require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RAW_FILE = path.join(__dirname, 'raw.json');
const FINAL_FILE = path.join(__dirname, 'final.json');

// פונקציית עזר לערבוב (כדי לא לקבל רק את המקור הראשון ברשימה)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function processNewsWithAI() {
    console.log("🧠 AI: מתחיל עיבוד (עם ערבוב מקורות לגיוון)...");

    try {
        if (!fs.existsSync(RAW_FILE)) throw new Error("חסר קובץ raw.json");

        let newsItems = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
        
        // --- התיקון הקריטי: ערבוב ---
        // זה מבטיח שאם ניקח 6 ידיעות, הן יהיו תערובת של Ynet, ערוץ 14, וואלה וכו'
        newsItems = shuffleArray(newsItems);

        // סינון לפי קטגוריות
        const categories = { 'Politics': [], 'Economy': [], 'Technology': [], 'Sports': [] };
        
        newsItems.forEach(item => {
            if (categories[item.category]) categories[item.category].push(item);
        });

        let limitedInput = [];
        const ITEMS_PER_CATEGORY = 6; 

        for (const [catName, items] of Object.entries(categories)) {
            const topItems = items.slice(0, ITEMS_PER_CATEGORY).map(item => ({
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

        const prompt = `
        אתה עורך חדשות אובייקטיבי. קבל רשימת ידיעות מגוונת (ימין ושמאל).
        המשימה:
        1. מזג כפילויות. אם יש ידיעה פוליטית שמופיעה גם במקור ימין וגם בשמאל - אחד אותן לכותרת ניטרלית.
        2. כתוב 3 בוליטים לכל ידיעה.
        3. לכל קישור מקור, החזר את אותו ערך bias שקיבלת עבורו בנתונים (אל תמציא).
        4. עבור publishedAt, החזר את ערך ה-pubDate המדויק (ISO 8601 אם קיים) של המקור העדכני ביותר שמוזג לתוך אותה ידיעה. אל תמציא תאריך.
        5. עבור image, בחר את אחת מכתובות ה-image שקיבלת (בדיוק כפי שהיא, בלי לשנות) עבור אחד המקורות שמוזגו לתוך הידיעה. אם לאף אחד מהמקורות אין image, החזר null. אל תמציא כתובת שלא קיבלת.

        החזר JSON בלבד (ללא Markdown):
        {
            "categories": [
                {
                    "name": "Politics", "label": "אקטואליה",
                    "items": [
                        {
                            "title": "כותרת",
                            "bullets": ["..."],
                            "links": [{"name": "Now 14", "url": "...", "bias": "right"}, {"name": "Ynet", "url": "...", "bias": "left-center"}],
                            "sentiment": "neutral",
                            "publishedAt": "2026-08-09T10:28:13+03:00",
                            "image": "https://... או null"
                        }
                    ]
                },
                { "name": "Economy", "label": "כלכלה", "items": [] },
                { "name": "Technology", "label": "טכנולוגיה", "items": [] },
                { "name": "Sports", "label": "ספורט", "items": [] }
            ]
        }

        הנתונים:
        ${JSON.stringify(limitedInput)}
        `;

        const msg = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4000,
            temperature: 0,
            messages: [{ role: "user", content: prompt }]
        });

        let textResponse = msg.content[0].text;
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '');
        
        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');
        
        if (firstBrace === -1) throw new Error("JSON לא תקין");
        
        const cleanJsonString = textResponse.substring(firstBrace, lastBrace + 1);
        JSON.parse(cleanJsonString); // בדיקת תקינות

        fs.writeFileSync(FINAL_FILE, cleanJsonString);
        console.log("✅ AI: הושלם בהצלחה (עם מקורות מגוונים).");

    } catch (error) {
        console.error("❌ שגיאה:", error.message);
    }
}

module.exports = { processNewsWithAI };

if (require.main === module) {
    processNewsWithAI();
}