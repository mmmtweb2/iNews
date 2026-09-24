require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const Parser = require('rss-parser');
const { processNewsWithAI } = require('./processor');
const reactions = require('./reactions');

const app = express();
const PORT = process.env.PORT || 3000;

// --- הגדרת שמות הקבצים ---
const RAW_FILE = path.join(__dirname, 'raw.json');   // קלט
const FINAL_FILE = path.join(__dirname, 'final.json'); // פלט (לאתר)
const PUBLIC_DIR = path.join(__dirname, 'public'); // build סטטי של הקליינט

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// --- חלק א': שרת ה-API ---
app.get('/api/news', (req, res) => {
    try {
        if (!fs.existsSync(FINAL_FILE)) {
             // אם אין עדיין קובץ סופי, נחזיר תשובה ריקה כדי לא לקרוס
             return res.json({ categories: [] });
        }
        const rawData = fs.readFileSync(FINAL_FILE, 'utf8');
        const data = JSON.parse(rawData);
        const allReactions = reactions.getAll();

        // מוסיפים לכל ידיעה את ספירת הריאקציות האמיתית והמשותפת שלה
        data.categories.forEach(cat => {
            cat.items.forEach(item => {
                item.reactions = allReactions[item.id] || {};
            });
        });

        res.json(data);
    } catch (error) {
        console.error("❌ שגיאה בהגשת הנתונים:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- ריאקציות אמיתיות ומשותפות לכל המבקרים (לא רק בדפדפן שלך) ---
app.post('/api/react', (req, res) => {
    const { itemId, emoji } = req.body || {};
    const updated = reactions.add(itemId, emoji);
    if (!updated) {
        return res.status(400).json({ error: 'itemId/emoji לא תקינים' });
    }
    res.json({ reactions: updated });
});

// --- מונה קוראים חי אמיתי: כל דפדפן פעיל שולח heartbeat כל 20 שניות ---
const activeVisitors = new Map(); // clientId -> lastSeen (ms)
const ONLINE_WINDOW_MS = 60 * 1000;

app.post('/api/heartbeat', (req, res) => {
    const { clientId } = req.body || {};
    if (clientId) activeVisitors.set(clientId, Date.now());

    const cutoff = Date.now() - ONLINE_WINDOW_MS;
    for (const [id, lastSeen] of activeVisitors) {
        if (lastSeen < cutoff) activeVisitors.delete(id);
    }

    res.json({ online: activeVisitors.size });
});

// --- חלק ב': משיכת RSS (יוצר את raw.json) ---
const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' },
    customFields: {
        item: ['media:content', 'media:thumbnail', 'content:encoded']
    }
});

// מנסה לחלץ כתובת תמונה מהידיעה, בכמה דרכים נפוצות בפידי RSS
function extractImage(item) {
    if (item.enclosure && item.enclosure.url && (!item.enclosure.type || item.enclosure.type.startsWith('image'))) {
        return item.enclosure.url;
    }

    const mediaContent = item['media:content'];
    if (mediaContent) {
        const node = Array.isArray(mediaContent) ? mediaContent[0] : mediaContent;
        const url = node?.$?.url;
        if (url) return url;
    }

    const mediaThumb = item['media:thumbnail'];
    if (mediaThumb) {
        const node = Array.isArray(mediaThumb) ? mediaThumb[0] : mediaThumb;
        const url = node?.$?.url;
        if (url) return url;
    }

    const htmlContent = item['content:encoded'] || item.content || '';
    const match = htmlContent.match(/<img[^>]+src="([^"]+)"/i);
    if (match) return match[1];

    return null;
}

// פידים גנריים של Google News (בעברית, ישראל) - תבנית URL יציבה וידועה,
// משמשים להרחבת מגוון בלי להסתמך על ניחוש כתובות RSS ספציפיות לאתר
function googleNewsFeed(query, category) {
    return {
        name: 'Google News',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=iw&gl=IL&ceid=IL:iw`,
        category,
        bias: 'aggregated'
    };
}

const feedUrls = [
    { name: 'Ynet', url: 'https://www.ynet.co.il/Integration/StoryRss1854.xml', category: 'Politics', bias: 'left-center' },
    { name: 'Walla', url: 'https://rss.walla.co.il/feed/1?type=main', category: 'Politics', bias: 'center' },
    { name: 'Now 14', url: 'https://www.now14.co.il/feed/', category: 'Politics', bias: 'right' },
    { name: 'Arutz 7', url: 'https://www.inn.co.il/Rss.aspx', category: 'Politics', bias: 'right-religious' },
    { name: 'Globes', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.xsd?folderid=2', category: 'Economy', bias: 'neutral' },
    { name: 'Bizportal', url: 'https://www.bizportal.co.il/webservice/rss/general', category: 'Economy', bias: 'neutral' },
    { name: 'Geektime', url: 'https://www.geektime.co.il/feed/', category: 'Technology', bias: 'neutral' },
    { name: 'ONE', url: 'https://www.one.co.il/cat/coop/xml/rss/news_main.xml', category: 'Sports', bias: 'neutral' },

    // הרחבת מגוון בקטגוריות הקיימות
    googleNewsFeed('פוליטיקה ישראל', 'Politics'),
    googleNewsFeed('כלכלה ישראל', 'Economy'),
    googleNewsFeed('טכנולוגיה', 'Technology'),
    googleNewsFeed('ספורט ישראל', 'Sports'),

    // קטגוריות חדשות
    googleNewsFeed('חדשות עולם', 'World'),
    googleNewsFeed('בידור סלבריטי', 'Entertainment'),
    googleNewsFeed('בריאות רפואה', 'Health'),
    googleNewsFeed('תרבות אמנות', 'Culture'),
];

async function fetchRSS() {
    let allNews = [];
    console.log("🔄 RSS: מתחיל משיכה...");

    for (const source of feedUrls) {
        try {
            const feed = await parser.parseURL(source.url);
            const items = feed.items.slice(0, 10).map(item => ({
                source: source.name,
                bias: source.bias,
                category: source.category,
                title: item.title,
                link: item.link,
                contentSnippet: item.contentSnippet ? item.contentSnippet.trim() : '',
                pubDate: item.pubDate,
                image: extractImage(item),
                id: item.guid || item.link
            }));
            allNews.push(...items);
        } catch (error) {
            console.log(`⚠️ דילוג על ${source.name} (${source.category}): ${error.message}`);
        }
    }

    // אם כל המקורות נכשלו, לא לדרוס נתונים טובים בקובץ ריק
    if (allNews.length === 0) {
        console.log("⚠️ RSS: כל המקורות נכשלו, raw.json נשאר ללא שינוי");
        return;
    }

    fs.writeFileSync(RAW_FILE, JSON.stringify(allNews, null, 2));
    console.log(`✅ RSS: נשמרו ${allNews.length} ידיעות לקובץ raw.json`);
}

// --- חלק ג': הרצה מלאה (RSS + עיבוד AI) ---
async function refreshNews() {
    await fetchRSS();
    await processNewsWithAI();
}

// הרצה ראשונית כשהשרת עולה, ולאחר מכן כל 30 דקות
refreshNews();
cron.schedule('*/30 * * * *', refreshNews);

app.listen(PORT, () => {
    console.log(`🚀 השרת רץ על פורט ${PORT}`);
    console.log(`📡 API זמין ב-/api/news`);
});
