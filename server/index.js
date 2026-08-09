const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = 3000;

// --- הגדרת שמות הקבצים (החוק החדש) ---
const RAW_FILE = path.join(__dirname, 'raw.json');   // קלט
const FINAL_FILE = path.join(__dirname, 'final.json'); // פלט (לאתר)

app.use(cors());

// --- חלק א': שרת ה-API ---
app.get('/api/news', (req, res) => {
    try {
        if (!fs.existsSync(FINAL_FILE)) {
             // אם אין עדיין קובץ סופי, נחזיר תשובה ריקה כדי לא לקרוס
             return res.json({ categories: [] });
        }
        const rawData = fs.readFileSync(FINAL_FILE, 'utf8');
        res.json(JSON.parse(rawData));
    } catch (error) {
        console.error("❌ שגיאה בהגשת הנתונים:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- חלק ב': משיכת RSS (יוצר את raw.json) ---
const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' }
});

const feedUrls = [
    { name: 'Ynet', url: 'https://www.ynet.co.il/Integration/StoryRss1854.xml', category: 'Politics', bias: 'left-center' },
    { name: 'Walla', url: 'https://rss.walla.co.il/feed/1?type=main', category: 'Politics', bias: 'center' },
    { name: 'Now 14', url: 'https://www.now14.co.il/feed/', category: 'Politics', bias: 'right' },
    { name: 'Arutz 7', url: 'https://www.inn.co.il/Rss.aspx', category: 'Politics', bias: 'right-religious' },
    { name: 'Globes', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.xsd?folderid=2', category: 'Economy', bias: 'neutral' },
    { name: 'Bizportal', url: 'https://www.bizportal.co.il/webservice/rss/general', category: 'Economy', bias: 'neutral' },
    { name: 'Geektime', url: 'https://www.geektime.co.il/feed/', category: 'Technology', bias: 'neutral' },
    { name: 'ONE', url: 'https://www.one.co.il/cat/coop/xml/rss/news_main.xml', category: 'Sports', bias: 'neutral' }
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
                id: item.guid || item.link
            }));
            allNews.push(...items);
        } catch (error) {
            console.log(`⚠️ דילוג על ${source.name}`);
        }
    }

    fs.writeFileSync(RAW_FILE, JSON.stringify(allNews, null, 2));
    console.log(`✅ RSS: נשמרו ${allNews.length} ידיעות לקובץ raw.json`);
}

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`🚀 השרת רץ: http://localhost:${PORT}`);
    // הרצת משיכה ראשונית כשהשרת עולה
    fetchRSS();
});