// עשיר את הנתונים של כל כתבה על ידי קריאת דף הכתבה עצמו: גם תמונה (og:image,
// fallback לפידים שאין להם metadata של תמונה) וגם קטע טקסט אמיתי מהכתבה
// (לא רק כותרת+100 תווים מה-RSS). בלי זה ל-AI אין כמעט שום תוכן לעבוד איתו,
// והוא בעצם רק מנסח מחדש את הכותרת ל-3 בוליטים ריקים מתוכן.
async function fetchArticleMeta(url) {
    if (!url) return { image: null, excerpt: '' };
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' }
        });
        clearTimeout(timeout);
        if (!res.ok) return { image: null, excerpt: '' };

        const html = await res.text();

        const imageMatch =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        const image = imageMatch ? imageMatch[1] : null;

        // חילוץ היוריסטי של טקסט מתוך תגי <p> - לא פרסר HTML אמיתי, אבל מספיק
        // כדי לתת ל-AI תוכן ממשי לעבוד איתו במקום כותרת בלבד
        const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
            .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(text => text.length > 40); // מסנן שכבות ניווט/פוטר קצרות

        const excerpt = paragraphs.join(' ').slice(0, 700);

        return { image, excerpt };
    } catch {
        return { image: null, excerpt: '' };
    }
}

module.exports = { fetchArticleMeta };
