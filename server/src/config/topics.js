// The reader-facing topic taxonomy. The AI classifies every story into these ids,
// regardless of which feed it came from (feed categories are unreliable).
// The client receives this list from /api/feed, so adding a topic is a one-line change here.

const TOPICS = [
    { id: 'tech', label: 'טכנולוגיה ו-AI', hint: 'טכנולוגיה, בינה מלאכותית, סטארטאפים, סייבר אזרחי, מוצרים דיגיטליים' },
    { id: 'economy', label: 'כלכלה ושווקים', hint: 'כלכלה, שווקים, ריבית, נדל"ן, תעסוקה, יוקר המחיה, חברות' },
    { id: 'politics', label: 'פוליטיקה וממשל', hint: 'כנסת, ממשלה, בחירות, חקיקה, מדיניות ציבורית' },
    { id: 'security', label: 'ביטחון', hint: 'צבא, לחימה, טרור, מערכת הביטחון, מדיניות חוץ וביטחון' },
    { id: 'world', label: 'עולם', hint: 'חדשות בינלאומיות שאינן ביטחון ישראלי' },
    { id: 'society', label: 'חברה ומשפט', hint: 'משטרה, בתי משפט, חינוך, רווחה, תחבורה, אירועים מקומיים' },
    { id: 'health', label: 'בריאות', hint: 'רפואה, מחקרים רפואיים, מערכת הבריאות, תזונה' },
    { id: 'science', label: 'מדע וסביבה', hint: 'מדע, חלל, אקלים, טבע, אנרגיה' },
    { id: 'sports', label: 'ספורט', hint: 'ספורט בישראל ובעולם' },
    { id: 'culture', label: 'תרבות ובידור', hint: 'קולנוע, מוזיקה, טלוויזיה, אמנות, ספרים, סלבריטאים' },
];

const TOPIC_IDS = new Set(TOPICS.map(t => t.id));

module.exports = { TOPICS, TOPIC_IDS };
