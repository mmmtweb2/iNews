require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { fetchOgImage } = require('./ogImage');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RAW_FILE = path.join(__dirname, 'raw.json');
const FINAL_FILE = path.join(__dirname, 'final.json');

const CATEGORY_LABELS = {
    Politics: 'אקטואליה',
    Economy: 'כלכלה',
    Technology: 'טכנולוגיה',
    Sports: 'ספורט',
    World: 'עולם',
    Entertainment: 'בידור',
    Health: 'בריאות',
    Culture: 'תרבות',
};

// מזהה יציב לידיעה, כדי שריאקציות יוכלו להיצמד אליה. מבוסס על הכותרת,
// כך שהוא נשאר קבוע כל עוד ה-AI לא מנסח את הכותרת אחרת במחזור הבא.
function stableId(title) {
    return crypto.createHash('sha1').update(title || '').digest('hex').slice(0, 12);
}

async function processNewsWithAI() {
    console.log("🧠 AI: מתחיל עיבוד...");

    try {
        if (!fs.existsSync(RAW_FILE)) throw new Error("חסר קובץ raw.json");

        const newsItems = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));

        // סינון לפי קטגוריות
        const categories = Object.fromEntries(Object.keys(CATEGORY_LABELS).map(name => [name, []]));

        newsItems.forEach(item => {
            if (categories[item.category]) categories[item.category].push(item);
        });

        let limitedInput = [];
        const ITEMS_PER_SOURCE = 3;

        for (const [catName, items] of Object.entries(categories)) {
            // --- התיקון הקריטי: לקיחה מכל מקור בנפרד ---
            // לפני התיקון: ערבוב כל הקטגוריה יחד ולקיחת 6 אקראיים - עם כמה
            // מקורות בקטגוריה זה כמעט תמיד "פספס" את אותו סיפור משני מקורות
            // בו-זמנית, ולכן כמעט כלום לא התמזג. עכשיו כל מקור מיוצג בוודאות,
            // כך שיש סיכוי אמיתי שאותו אירוע יגיע מכמה מקורות ויתמזג בפועל.
            const bySource = {};
            items.forEach(item => {
                if (!bySource[item.source]) bySource[item.source] = [];
                bySource[item.source].push(item);
            });

            const topItems = Object.values(bySource)
                .flatMap(sourceItems => sourceItems.slice(0, ITEMS_PER_SOURCE))
                .map(item => ({
                    source: item.source,
                    bias: item.bias,
                    category: item.category,
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    image: item.image,
                    snippet: item.contentSnippet ? item.contentSnippet.substring(0, 100) : ''
                }));
            limitedInput.push(...topItems);
        }

        // Fallback לתמונה: לכל פריט שאין לו תמונה מה-RSS, ננסה למשוך og:image
        // מדף הכתבה עצמה. מקבילי, עם timeout לכל בקשה כדי לא לתקוע את התהליך.
        const missingImage = limitedInput.filter(item => !item.image);
        if (missingImage.length > 0) {
            console.log(`🖼️  מנסה למשוך og:image עבור ${missingImage.length} ידיעות ללא תמונה מה-RSS...`);
            await Promise.all(missingImage.map(async item => {
                item.image = await fetchOgImage(item.link);
            }));
        }

        const categoryList = Object.entries(CATEGORY_LABELS)
            .map(([name, label]) => `${name} (label: "${label}")`)
            .join(', ');

        const prompt = `
        אתה עורך חדשות אובייקטיבי. קבל רשימת ידיעות מגוונת ממקורות שונים (כולל ימין ושמאל בפוליטיקה).
        המשימה:
        1. מזג כפילויות. אם אותה ידיעה מופיעה במספר מקורות - אחד אותה לכותרת ניטרלית אחת.
        2. כתוב 3 בוליטים לכל ידיעה.
        3. לכל קישור מקור, החזר את אותו ערך bias שקיבלת עבורו בנתונים (אל תמציא).
        4. עבור publishedAt, החזר את ערך ה-pubDate המדויק (ISO 8601 אם קיים) של המקור העדכני ביותר שמוזג לתוך אותה ידיעה. אל תמציא תאריך.
        5. עבור image, בחר את אחת מכתובות ה-image שקיבלת (בדיוק כפי שהיא, בלי לשנות) עבור אחד המקורות שמוזגו לתוך הידיעה. אם לאף אחד מהמקורות אין image, החזר null. אל תמציא כתובת שלא קיבלת.

        החזר JSON בלבד (ללא Markdown), עם בדיוק שמונה הקטגוריות הבאות תחת "categories" (כל אחת עם name ו-label כפי שמופיע כאן, גם אם items ריק): ${categoryList}.

        כל item בפורמט:
        {
            "title": "כותרת",
            "bullets": ["...", "...", "..."],
            "links": [{"name": "שם מקור", "url": "...", "bias": "right"}],
            "sentiment": "neutral",
            "publishedAt": "2026-08-09T10:28:13+03:00",
            "image": "https://... או null"
        }

        הנתונים:
        ${JSON.stringify(limitedInput)}
        `;

        const msg = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 12000,
            temperature: 0,
            messages: [{ role: "user", content: prompt }]
        });

        let textResponse = msg.content[0].text;
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '');

        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');

        if (firstBrace === -1) throw new Error("JSON לא תקין");

        const cleanJsonString = textResponse.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(cleanJsonString); // בדיקת תקינות

        // מוסיפים מזהה יציב לכל ידיעה, כדי שריאקציות יוכלו להיצמד אליה
        parsed.categories.forEach(cat => {
            cat.items.forEach(item => { item.id = stableId(item.title); });
        });

        fs.writeFileSync(FINAL_FILE, JSON.stringify(parsed, null, 2));
        console.log("✅ AI: הושלם בהצלחה (עם מקורות מגוונים).");

    } catch (error) {
        console.error("❌ שגיאה:", error.message);
    }
}

module.exports = { processNewsWithAI };

if (require.main === module) {
    processNewsWithAI();
}