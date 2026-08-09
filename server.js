const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(cors()); // מאפשר גישה מכל דומיין (חשוב לפיתוח)

// נתיב API שהריאקט יפנה אליו
app.get('/api/news', (req, res) => {
    try {
        // קריאת הקובץ המעודכן ביותר
        const rawData = fs.readFileSync('smart_feed.json', 'utf8');
        const jsonData = JSON.parse(rawData);
        
        // החזרת הנתונים ללקוח
        res.json(jsonData);
    } catch (error) {
        console.error("Error reading data:", error);
        res.status(500).json({ error: "Failed to load news data" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api/news`);
});