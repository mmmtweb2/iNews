// Fallback לחילוץ תמונה כשל-RSS עצמו אין metadata של תמונה (נפוץ בפידים ישראליים
// רבים שכוללים רק כותרת+קישור). כמעט כל אתר חדשות מודרני כולל תגית og:image
// בדף הכתבה (לצורך שיתוף ברשתות חברתיות), אז זו דרך אמינה יותר מהסתמכות
// בלעדית על מבנה ה-RSS.
async function fetchOgImage(url) {
    if (!url) return null;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' }
        });
        clearTimeout(timeout);
        if (!res.ok) return null;

        const html = await res.text();
        const match =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

module.exports = { fetchOgImage };
