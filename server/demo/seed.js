// Sample stories for developing and demoing the interface without feeds or an API key:
//   npm run demo        (from ./server)
//
// Everything here is FICTIONAL: invented outlets and generic events, written to
// exercise every state the interface has (calm and heavy stories, blind spots,
// contested claims, inflated headlines, graphic content, single-source stories).
// The API labels this data `demo: true` and the interface shows a banner.

const { computeCoverage } = require('../src/pipeline/coverage');
const { readTimes } = require('../src/pipeline/run');

const OUTLETS = {
    north: { id: 'demo-north', name: 'שבועון הצפון', lean: 'center-left' },
    mirror: { id: 'demo-mirror', name: 'המראה', lean: 'left' },
    evening: { id: 'demo-evening', name: 'הערב', lean: 'center' },
    nation: { id: 'demo-nation', name: 'קול האומה', lean: 'right' },
    biz: { id: 'demo-biz', name: 'כלכלת היום', lean: null },
    tech: { id: 'demo-tech', name: 'טק-בייט', lean: null },
    sport: { id: 'demo-sport', name: 'ספורט 24', lean: null },
    world: { id: 'demo-world', name: 'עולם פתוח', lean: null },
    health: { id: 'demo-health', name: 'בריאות עכשיו', lean: null },
};

// [age in minutes, topics, intensity, importance, sourceHeat, graphic, outlets, copy]
const STORIES = [
    [14, ['tech'], 1, 4, 1, false, ['tech', 'evening'], {
        headline: 'סטארטאפ ישראלי הציג מודל שפה שרץ ישירות על הטלפון, בלי חיבור לרשת',
        oneLiner: 'המודל קטן מספיק לפעול על מכשירים רגילים, והחברה מתכננת להוציא גרסת בדיקה למפתחים.',
        bullets: ['בהדגמה בוצעו סיכום והקראה של מסמכים בלי שליחת מידע לשרת חיצוני', 'החברה אומרת שהמודל פחות מדויק ממודלים גדולים במשימות מורכבות', 'גרסת הבדיקה למפתחים צפויה בתוך כמה חודשים'],
        why: 'אם הביצועים יחזיקו, אפשר יהיה להפעיל עוזרים חכמים בלי להעביר מידע אישי לענן.',
        calm: 'סטארטאפ ישראלי הציג מודל שפה שרץ על הטלפון בלי חיבור לרשת. החברה מציינת שהדיוק נמוך ממודלים גדולים במשימות מורכבות.',
        entities: ['מודל שפה', 'עיבוד מקומי', 'פרטיות'],
        framing: [[0, 'מדגיש את היתרון לפרטיות ואת הדגמת היכולות'], [1, 'מתמקד במגבלות הדיוק ובלוחות הזמנים של החברה']],
    }],
    [47, ['economy'], 1, 5, 1, false, ['biz', 'evening', 'nation'], {
        headline: 'הבנק המרכזי השאיר את הריבית ללא שינוי; ההחלטה התקבלה פה אחד',
        oneLiner: 'בהודעה נמסר שההחלטות הבאות יתבססו על נתוני האינפלציה והתעסוקה בחודשים הקרובים.',
        bullets: ['הוועדה המליצה להמשיך לעקוב אחרי קצב עליית המחירים', 'הצפי בשווקים היה להשארת הריבית ללא שינוי', 'ההחלטה הבאה תתקבל בעוד כשישה שבועות'],
        why: 'ההחלטה משפיעה ישירות על גובה החזרי המשכנתאות ועל תשואות החיסכון.',
        calm: 'הבנק המרכזי השאיר את הריבית ללא שינוי בהחלטה פה אחד, ומסר שההחלטות הבאות ייגזרו מנתוני האינפלציה והתעסוקה.',
        entities: ['ריבית', 'אינפלציה', 'משכנתאות'],
    }],
    [63, ['politics'], 2, 4, 3, false, ['mirror', 'nation', 'evening', 'north'], {
        headline: 'ועדת חוקה אישרה לקריאה שנייה הצעת חוק לשינוי מימון המפלגות',
        oneLiner: 'ההצעה עברה ברוב קולות של חברי הוועדה, ויועצים משפטיים ביקשו להכניס בה תיקונים לפני ההצבעה במליאה.',
        bullets: ['לפי ההצעה, גובה המימון הציבורי ייקבע לפי כוחה של כל מפלגה בבחירות האחרונות', 'התומכים בהצעה טוענים שהיא תצמצם את התלות בתרומות פרטיות', 'המתנגדים טוענים שהיא תקשה על כניסת מפלגות חדשות'],
        why: 'ההצעה תשפיע על הכללים שלפיהם מפלגות ממומנות בבחירות הבאות.',
        calm: 'ועדת החוקה אישרה לקריאה שנייה הצעת חוק לשינוי מימון המפלגות. התומכים והמתנגדים חלוקים בשאלה אם היא תצמצם את התלות בתרומות או תקשה על מפלגות חדשות.',
        contested: 'התומכים אומרים שההצעה מצמצמת תלות בתרומות פרטיות; המתנגדים אומרים שהיא מקשה על מפלגות חדשות להיכנס.',
        entities: ['ועדת חוקה', 'מימון מפלגות', 'קריאה שנייה'],
        framing: [[0, 'מציג את ההצעה בעיקר דרך הביקורת של המתנגדים'], [1, 'מציג את ההצעה בעיקר דרך הטענה שהיא מצמצמת תרומות פרטיות'], [2, 'מדווח על מהלך ההצבעה ועל הערות היועצים המשפטיים']],
    }],
    [90, ['politics', 'society'], 3, 3, 3, false, ['nation'], {
        headline: 'ראש עירייה הודיע על קיצוץ בתקציבי התרבות כדי לממן שיפוץ של בתי ספר',
        oneLiner: 'לפי הודעת העירייה, הכסף יועבר לשיפוץ מבנים ישנים; ארגוני תרבות מקומיים מתנגדים.',
        bullets: ['הקיצוץ יחול על מרבית התקציבים שמיועדים לאירועי תרבות בעיר', 'ארגוני התרבות טוענים שלא קיימו איתם דיון מקדים'],
        why: '',
        calm: 'ראש עירייה הודיע על העברת כספים מתקציבי תרבות לשיפוץ בתי ספר. ארגוני תרבות מקומיים מתנגדים.',
        contested: 'העירייה אומרת שהמהלך נחוץ לבטיחות המבנים; ארגוני התרבות אומרים שלא התקיים דיון.',
        entities: ['תקציב עירוני', 'תרבות', 'חינוך'],
    }],
    [130, ['politics'], 2, 3, 2, false, ['mirror', 'north'], {
        headline: 'ארגוני סביבה עתרו נגד הרחבת אזור תעשייה בשטח פתוח',
        oneLiner: 'העותרים טוענים שהתוכנית אושרה בלי סקר השפעה על המים התת-קרקעיים.',
        bullets: ['העתירה הוגשה לבית המשפט המחוזי', 'הרשות המקומית מסרה שהתוכנית עמדה בכל דרישות התכנון'],
        why: '',
        calm: 'ארגוני סביבה עתרו נגד הרחבת אזור תעשייה, בטענה שלא נערך סקר השפעה על מי התהום. הרשות המקומית מסרה שהתוכנית עמדה בדרישות התכנון.',
        contested: 'העותרים אומרים שחסר סקר השפעה על המים; הרשות המקומית אומרת שהתוכנית עמדה בכל הדרישות.',
        entities: ['תכנון ובנייה', 'סביבה', 'עתירה'],
    }],
    [75, ['security'], 2, 3, 1, false, ['evening', 'tech'], {
        headline: 'מערכת הביטחון הציגה תוכנית רב-שנתית לחיזוק ההגנה בסייבר',
        oneLiner: 'התוכנית כוללת הקמת מרכז תגובה משותף לגופים אזרחיים ולגופי ביטחון.',
        bullets: ['התוכנית משתרעת על חמש שנים', 'חלק מהתקציב מיועד לשיתוף פעולה עם חברות פרטיות', 'ביקורת ציבורית עסקה בפיקוח על המידע שיועבר בין הגופים'],
        why: 'התוכנית עשויה לשנות את אופן הדיווח על תקיפות סייבר של חברות ושל רשויות מקומיות.',
        calm: 'מערכת הביטחון הציגה תוכנית רב-שנתית לחיזוק ההגנה בסייבר, הכוללת מרכז תגובה משותף לגופים אזרחיים ובטחוניים.',
        entities: ['סייבר', 'מערכת הביטחון'],
    }],
    [38, ['world', 'science'], 4, 4, 3, false, ['world', 'health', 'evening'], {
        headline: 'רעידת אדמה באזור הררי באסיה: מאות הרוגים וצוותי חילוץ פועלים בשטח',
        oneLiner: 'ארגוני סיוע בינלאומיים החלו לשלוח ציוד רפואי ואוהלים לאזור שנותק מהחשמל.',
        bullets: ['הרעידה הורגשה במספר מדינות שכנות', 'הכבישים לאזור חסומים בחלקם והמחלצים מתקדמים ברגל', 'ארגוני הסיוע מבקשים תרומות של ציוד רפואי ומים'],
        why: 'ארגוני סיוע ישראליים בוחנים שליחת משלחת.',
        calm: 'רעידת אדמה באזור הררי באסיה גרמה למאות הרוגים. צוותי חילוץ פועלים באזור וארגוני סיוע שולחים ציוד.',
        entities: ['רעידת אדמה', 'סיוע הומניטרי'],
    }],
    [210, ['society'], 5, 2, 5, true, ['nation', 'mirror'], {
        headline: 'חקירת מקרה רצח במרכז העיר: פרטים נחשפו בכתב אישום',
        oneLiner: 'כתב האישום מתאר את מהלך האירוע ואת הנסיבות שקדמו לו.',
        bullets: ['הנאשם נעצר שבוע לאחר האירוע', 'התביעה ביקשה להשאירו במעצר עד תום ההליכים'],
        why: '',
        calm: 'כתב אישום הוגש בחקירת מקרה רצח במרכז העיר. התביעה ביקשה להשאיר את הנאשם במעצר עד תום ההליכים.',
        entities: ['כתב אישום', 'מעצר'],
    }],
    [55, ['society'], 3, 2, 3, false, ['evening'], {
        headline: 'תאונה בכביש הראשי גרמה לפקקים כבדים בשעות הבוקר',
        oneLiner: 'שני נפגעים פונו לבית החולים במצב קל, והתנועה חזרה לסדרה לקראת הצהריים.',
        bullets: ['הכביש נחסם בשני הכיוונים לשעה וחצי'],
        why: '',
        calm: 'תאונה בכביש הראשי גרמה לפקקים בבוקר. שני נפגעים פונו במצב קל והתנועה התחדשה.',
        entities: ['תאונת דרכים'],
    }],
    [320, ['society'], 1, 4, 1, false, ['evening', 'north'], {
        headline: 'משרד החינוך פרסם את לוח הבחינות לסמסטר הקרוב',
        oneLiner: 'הבחינות יחלו בשבוע השני של החודש הבא; התלמידים יוכלו לבחור בין שני מועדים בחלק מהמקצועות.',
        bullets: ['מועד ב׳ יתקיים שלושה שבועות אחרי המועד הראשון', 'פירוט הציונים יפורסם באתר המשרד'],
        why: 'התלמידים והמורים יכולים להתחיל לתכנן את ההכנה.',
        calm: 'משרד החינוך פרסם את לוח הבחינות לסמסטר הקרוב. בחלק מהמקצועות יוכלו התלמידים לבחור בין שני מועדים.',
        entities: ['בחינות', 'משרד החינוך'],
    }],
    [160, ['health', 'science'], 1, 3, 2, false, ['health', 'world'], {
        headline: 'מחקר: הליכה של 20 דקות ביום קשורה לירידה בסיכון למחלות לב',
        oneLiner: 'החוקרים עקבו אחרי אלפי משתתפים לאורך עשור, והדגישו שמדובר בקשר סטטיסטי ולא בהוכחה לסיבתיות.',
        bullets: ['הקשר נמצא גם בקרב משתתפים שלא עסקו בפעילות גופנית אחרת', 'החוקרים מזהירים שחלק מהמשתתפים אולי היו בריאים יותר מלכתחילה'],
        why: 'הממצא מחזק את ההמלצה לשלב פעילות קלה בשגרה היומיומית.',
        calm: 'מחקר שעקב אחרי אלפי משתתפים מצא קשר בין הליכה יומית של 20 דקות לסיכון נמוך יותר למחלות לב. החוקרים מדגישים שזה קשר סטטיסטי.',
        entities: ['מחקר רפואי', 'פעילות גופנית'],
    }],
    [95, ['health'], 3, 4, 3, false, ['health', 'evening'], {
        headline: 'משרד הבריאות מדווח על עלייה במקרי חצבה במחוז הדרום ומזכיר חיסונים',
        oneLiner: 'בתי הספר והמרפאות באזור קיבלו הנחיות לבדיקת מצב החיסון של הילדים.',
        bullets: ['רוב החולים לא היו מחוסנים', 'המשרד מציע מקומות חיסון נוספים בשעות הערב'],
        why: 'הורים בדרום מתבקשים לבדוק אם הילדים קיבלו את שתי המנות.',
        calm: 'משרד הבריאות דיווח על עלייה במקרי חצבה במחוז הדרום והמליץ לבדוק את מצב החיסון של הילדים. נפתחו מקומות חיסון נוספים.',
        entities: ['חצבה', 'חיסונים'],
    }],
    [400, ['science'], 1, 2, 1, false, ['world', 'tech'], {
        headline: 'טלסקופ חלל קלט פעילות חריגה בגלקסיה רחוקה',
        oneLiner: 'החוקרים עדיין בוחנים אם מדובר בהתפרצות של חור שחור או בתופעה אחרת.',
        bullets: ['האות נקלט במשך כמה שעות ואז נחלש', 'תצפיות המשך מתוכננות בשבועות הקרובים'],
        why: '',
        calm: 'טלסקופ חלל קלט פעילות חריגה בגלקסיה רחוקה. החוקרים בודקים את מקורה.',
        entities: ['טלסקופ', 'גלקסיה'],
    }],
    [250, ['science', 'world'], 2, 4, 2, false, ['world', 'evening', 'mirror'], {
        headline: 'דוח אקלימי: השנה האחרונה בין החמות שנמדדו',
        oneLiner: 'הדוח מצביע על עלייה בתדירות של גלי חום, ומפרט מדינות שבהן הנזק החקלאי היה הגדול ביותר.',
        bullets: ['הנתונים מבוססים על מדידות תחנות מזג אוויר ולוויינים', 'חלק מהחוקרים מציינים שיש שונות גדולה בין אזורים'],
        why: 'התוצאות רלוונטיות להחלטות בתחום האנרגיה והחקלאות.',
        calm: 'דוח אקלימי קבע שהשנה האחרונה הייתה בין החמות שנמדדו, עם עלייה בתדירות גלי החום.',
        entities: ['אקלים', 'גלי חום'],
    }],
    [180, ['sports'], 2, 2, 4, false, ['sport', 'evening'], {
        headline: 'הנבחרת העפילה לגמר אחרי ניצחון 2:1 בדקות הסיום',
        oneLiner: 'השער המכריע נכבש בדקה ה-88 אחרי שהנבחרת פיגרה במחצית.',
        bullets: ['הגמר יתקיים בסוף השבוע הבא', 'המאמן הודיע שלא יהיו שינויים בהרכב'],
        why: '',
        calm: 'הנבחרת העפילה לגמר בניצחון 2:1 לאחר שער בדקה ה-88.',
        entities: ['נבחרת', 'גמר'],
    }],
    [520, ['sports'], 1, 1, 1, false, ['sport'], {
        headline: 'המאמן הודיע על הרכב ההתחלה למשחק מחר',
        oneLiner: 'שני שחקנים חוזרים אחרי פציעה, ושחקן אחד יישאר על הספסל.',
        bullets: [],
        why: '',
        calm: 'המאמן הודיע על הרכב ההתחלה למשחק מחר.',
        entities: ['משחק'],
    }],
    [700, ['culture'], 1, 2, 1, false, ['evening'], {
        headline: 'פסטיבל הקולנוע ייפתח השבוע עם 40 סרטים מ-20 מדינות',
        oneLiner: 'בתוכנית מקרנים סרטי בכורה, מפגשים עם יוצרים וסדרת הקרנות חינם.',
        bullets: ['הכרטיסים נמכרים באתר הפסטיבל', 'סרט הפתיחה יוקרן בחוץ'],
        why: '',
        calm: 'פסטיבל הקולנוע ייפתח השבוע עם 40 סרטים מ-20 מדינות.',
        entities: ['פסטיבל', 'קולנוע'],
    }],
    [900, ['culture'], 2, 1, 4, false, ['sport', 'tech'], {
        headline: 'זמרת ידועה הודיעה על סיבוב הופעות חדש',
        oneLiner: 'ההופעות יתקיימו בקיץ בשלוש ערים, והמכירה תיפתח בשבוע הבא.',
        bullets: [],
        why: '',
        calm: 'זמרת ידועה הודיעה על סיבוב הופעות בקיץ בשלוש ערים.',
        entities: ['הופעות'],
    }],
    [140, ['world', 'politics'], 2, 4, 3, false, ['world', 'evening', 'mirror', 'nation'], {
        headline: 'פסגת מנהיגים הסתיימה בלי הסכם סחר; המשא ומתן יימשך',
        oneLiner: 'המנהיגים הודיעו על קביעת פגישות המשך, ושני הצדדים מסרו שהשיחות היו עניניות.',
        bullets: ['המחלוקת נסובה סביב מכסים על מוצרי חקלאות', 'שני הצדדים פרסמו הודעות שונות על המשמעות של סיום הפסגה'],
        why: 'היעדר הסכם משאיר לא ודאות בנוגע למחירי יבוא של מוצרים חקלאיים.',
        calm: 'פסגת מנהיגים הסתיימה בלי הסכם סחר, והמשא ומתן יימשך. המחלוקת נסובה סביב מכסים על מוצרי חקלאות.',
        contested: 'כל צד מציג את סיום הפסגה כהצלחה, ומאשים את הצד השני בהקשחת עמדות.',
        entities: ['סחר', 'מכסים'],
        framing: [[2, 'מדגיש את התנאים שהציב הצד שלו כמפתח להמשך המשא ומתן'], [3, 'מדגיש את האחריות של הצד השני לכישלון להגיע להסכם']],
    }],
    [280, ['world'], 4, 3, 4, false, ['world', 'evening'], {
        headline: 'שיטפונות בדרום אסיה: עשרות אלפים פונו מבתיהם',
        oneLiner: 'רשויות מקומיות הקימו מרכזי מחסה זמניים והזהירו מפני עלייה נוספת במפלס המים.',
        bullets: ['גשם חזק צפוי להימשך לפחות עוד יומיים', 'חלק מהכבישים הראשיים נחסמו'],
        why: '',
        calm: 'שיטפונות בדרום אסיה אילצו עשרות אלפים לעזוב את בתיהם. הרשויות הקימו מרכזי מחסה.',
        entities: ['שיטפונות'],
    }],
    [30, ['tech'], 2, 3, 5, false, ['tech'], {
        headline: 'אפליקציית מסרים חדשה הוסיפה אפשרות מחיקה אוטומטית של הודעות',
        oneLiner: 'המשתמשים יוכלו לבחור את משך השמירה, מיום אחד ועד שנה.',
        bullets: ['האפשרות תהיה זמינה בהדרגה בשבועות הקרובים', 'החברה לא פרסמה נתונים על מספר המשתמשים'],
        why: '',
        calm: 'אפליקציית מסרים חדשה הוסיפה אפשרות מחיקה אוטומטית של הודעות, עם בחירה של משך השמירה.',
        entities: ['אפליקציה', 'פרטיות'],
    }],
    [110, ['economy', 'society'], 3, 4, 3, false, ['biz', 'mirror', 'nation'], {
        headline: 'שביתה במפעל גדול נכנסת ליום השלישי; ההנהלה וועד העובדים ממשיכים לדון',
        oneLiner: 'הוועד דורש עדכון שכר והבטחת תנאי פרישה, וההנהלה טוענת שהדרישות חורגות מהתקציב.',
        bullets: ['השביתה עצרה את קו הייצור המרכזי', 'לקוחות גדולים הודיעו על עיכובים באספקה'],
        why: 'עיכובים באספקה עלולים להשפיע על מחירים בחנויות בשבועות הקרובים.',
        calm: 'שביתה במפעל גדול נכנסת ליום השלישי. הוועד דורש עדכון שכר והבטחת תנאי פרישה, וההנהלה אומרת שהדרישות חורגות מהתקציב.',
        contested: 'הוועד אומר שהדרישות סבירות; ההנהלה אומרת שהן חורגות מהתקציב.',
        entities: ['שביתה', 'שכר'],
        framing: [[1, 'מציג את השביתה בעיקר דרך מצוקת העובדים'], [2, 'מציג את השביתה בעיקר דרך הנזק לייצור ולאספקה']],
    }],
    [600, ['economy'], 2, 3, 2, false, ['biz', 'evening'], {
        headline: 'מחירי הדירות עלו בחודש האחרון, לפי סקר חודשי של שוק הנדל"ן',
        oneLiner: 'העלייה הייתה חדה יותר באזורי הביקוש, ומתונה בפריפריה.',
        bullets: ['מספר העסקאות ירד לעומת החודש הקודם', 'הסוכנים מדווחים על גידול בעסקאות עם משכנתאות קטנות'],
        why: 'הנתונים רלוונטיים למי שמתכננים רכישה או מכירה בחודשים הקרובים.',
        calm: 'מחירי הדירות עלו בחודש האחרון, בעיקר באזורי הביקוש. מספר העסקאות ירד.',
        entities: ['נדל"ן', 'דירות'],
    }],
];

// What a second refresh brings in demo mode: one update to an existing story and a few
// follow-ups, so the "following" area can be tried without waiting for real news.
const UPDATE_PREFIX = 'שביתה במפעל';
const UPDATE = {
    headline: 'השביתה במפעל הסתיימה: הוועד וההנהלה חתמו על הסכם שכר',
    oneLiner: 'ההסכם כולל עדכון שכר הדרגתי ותנאי פרישה מוסכמים. קו הייצור יחזור לפעול מחר בבוקר.',
    bullets: ['העובדים יחזרו לעבודה כבר מחר', 'לקוחות גדולים אמרו שיבדקו את לוחות האספקה מחדש'],
    why: 'סיום השביתה מקטין את הסיכון לעיכובים באספקה ולעלייה במחירים.',
    calm: 'השביתה במפעל הסתיימה אחרי שהוועד וההנהלה חתמו על הסכם שכר. העובדים חוזרים לעבודה מחר.',
};

const FOLLOWUPS = [
    [4, ['economy'], 1, 3, 1, false, ['biz', 'evening'], {
        headline: 'נתוני האינפלציה לחודש האחרון: מחירי המזון עלו, מחירי הדלק ירדו',
        oneLiner: 'האינפלציה השנתית נשארה בטווח היעד, כך עולה מהנתונים שפורסמו הבוקר. הנתונים נבחנים לקראת החלטת הריבית הבאה.',
        bullets: ['מחירי המזון עלו בעיקר בירקות ובפירות', 'מחירי הדלק ירדו אחרי ירידה במחירי האנרגיה בעולם', 'כלכלנים מעריכים שהריבית תישאר ללא שינוי'],
        why: 'נתוני האינפלציה הם אחד הגורמים העיקריים בהחלטה על גובה הריבית ועל החזרי המשכנתאות.',
        calm: 'האינפלציה השנתית נשארה בטווח היעד. מחירי המזון עלו ומחירי הדלק ירדו.',
        entities: ['אינפלציה', 'ריבית', 'משכנתאות'],
    }],
    [9, ['politics'], 2, 4, 3, false, ['mirror', 'nation', 'evening'], {
        headline: 'מליאת הכנסת אישרה בקריאה שלישית את חוק מימון המפלגות',
        oneLiner: 'החוק עבר ברוב קולות אחרי דיון ארוך. האופוזיציה הודיעה שתעתור נגדו, והקואליציה אמרה שהוא יצמצם תרומות פרטיות.',
        bullets: ['יועצים משפטיים ביקשו תיקונים שנוספו לנוסח הסופי', 'החוק ייכנס לתוקף לקראת הבחירות הבאות'],
        why: 'החוק קובע איך מפלגות ימומנו בבחירות הבאות.',
        calm: 'מליאת הכנסת אישרה את חוק מימון המפלגות. האופוזיציה הודיעה שתעתור נגדו.',
        contested: 'הקואליציה אומרת שהחוק מצמצם תרומות פרטיות; האופוזיציה אומרת שהוא מקשה על מפלגות חדשות.',
        entities: ['מימון מפלגות', 'מליאה', 'קריאה שלישית'],
        framing: [[0, 'מדגיש את הצעד האחרון בחקיקה ואת הכוונה לעתור'], [1, 'מדגיש את הטענה שהחוק מצמצם תרומות פרטיות']],
    }],
    [16, ['tech'], 1, 3, 1, false, ['tech'], {
        headline: 'מפתחים קיבלו גרסת בדיקה של מודל השפה הישראלי שרץ על הטלפון',
        oneLiner: 'הגרסה זמינה להורדה לבדיקה בלבד. החברה מבקשת ממפתחים לדווח על טעויות בדיוק.',
        bullets: ['הגרסה פועלת בלי חיבור לרשת', 'החברה אומרת שהדיוק משתפר בעדכונים שבועיים'],
        why: '',
        calm: 'חברה ישראלית פתחה גרסת בדיקה של מודל שפה שרץ על הטלפון. מפתחים מתבקשים לדווח על טעויות.',
        entities: ['מודל שפה', 'עיבוד מקומי', 'מפתחים'],
    }],
    [22, ['sports', 'society'], 1, 2, 1, false, ['sport', 'evening'], {
        headline: 'האצטדיון החדש נחנך: 30 אלף צופים צפויים במשחק הפתיחה',
        oneLiner: 'האצטדיון נבנה בשלוש שנים. משחק הפתיחה יתקיים בשבת, ותחבורה ציבורית מיוחדת תפעל לקראתו.',
        bullets: ['הכרטיסים נמכרו ברובם', 'התחבורה הציבורית תחזק קווים לאצטדיון'],
        why: '',
        calm: 'האצטדיון החדש נחנך. משחק הפתיחה יתקיים בשבת.',
        entities: ['אצטדיון', 'משחק פתיחה'],
    }],
];

function makeStory(tuple, index, now, prefix) {
    const [age, topics, intensity, importance, sourceHeat, graphic, outletKeys, copy] = tuple;
    const sources = outletKeys.map((key, i) => {
        const outlet = OUTLETS[key];
        const publishedAt = new Date(now.getTime() - (age + i * 11) * 60_000).toISOString();
        return { key: `${prefix}${index}-${i}`, id: outlet.id, name: outlet.name, lean: outlet.lean, url: `https://example.com/demo/${prefix}${index}/${i}`, title: copy.headline, publishedAt };
    });
    const framing = (copy.framing || []).map(([n, note]) => ({ sourceId: sources[n].id, source: sources[n].name, note }));
    const story = {
        id: `${prefix === 'demo' ? 'demo' : 'demo-f'}-${String(index + 1).padStart(2, '0')}`,
        headline: copy.headline,
        oneLiner: copy.oneLiner,
        bullets: copy.bullets,
        whyItMatters: copy.why,
        calmSummary: copy.calm,
        contested: copy.contested || '',
        topics,
        entities: copy.entities || [],
        intensity,
        importance,
        sourceHeat,
        graphic,
        framing,
        primaryTopic: topics[0],
        sources,
        coverage: computeCoverage(sources, topics),
        publishedAt: sources[0].publishedAt,
        firstSeenAt: sources[sources.length - 1].publishedAt,
        updatedAt: sources[0].publishedAt,
        image: null,
        model: 'demo',
    };
    story.readSec = readTimes(story);
    return story;
}

// Wave 2 is what a refresh adds. It builds on the stories already stored, so earlier stories keep
// their ids and first-seen times, exactly as the real pipeline does.
function applyRefreshWave(existing, now) {
    const stamp = now.toISOString();
    const stories = existing.map(story => ({ ...story }));
    const target = stories.find(story => story.headline.startsWith(UPDATE_PREFIX));
    if (target) {
        Object.assign(target, { headline: UPDATE.headline, oneLiner: UPDATE.oneLiner, bullets: UPDATE.bullets, whyItMatters: UPDATE.why, calmSummary: UPDATE.calm, contested: '', framing: [], updatedAt: stamp });
        target.readSec = readTimes(target);
    }
    FOLLOWUPS.forEach((tuple, index) => {
        if (stories.some(story => story.id === `demo-f-${String(index + 1).padStart(2, '0')}`)) return; // already added
        const story = makeStory(tuple, index, now, 'followup');
        story.firstSeenAt = stamp; // first seen by this refresh
        story.updatedAt = stamp;
        stories.push(story);
    });
    return stories.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function buildDemoStories(now = new Date(), wave = 1) {
    const stories = STORIES.map((tuple, index) => makeStory(tuple, index, now, 'demo')).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    return wave >= 2 ? applyRefreshWave(stories, now) : stories;
}

function seedDemo(store, now = new Date()) {
    store.write('stories.json', { generatedAt: new Date(now.getTime() - 6 * 60_000).toISOString(), stories: buildDemoStories(now, 1) });
    store.write('meta.json', { lastRun: null, lastSuccessAt: null });
}

// Stands in for the real pipeline in demo mode: waits a moment, then publishes wave 2.
function createDemoRun(store, { delayMs = 2500, now = () => new Date() } = {}) {
    return async onProgress => {
        const steps = ['ingest', 'cluster'];
        for (const phase of steps) {
            onProgress({ phase });
            await new Promise(resolve => setTimeout(resolve, delayMs / 3));
        }
        const total = FOLLOWUPS.length + 1;
        for (let done = 0; done <= total; done += 1) {
            onProgress({ phase: 'enrich', done, total });
            await new Promise(resolve => setTimeout(resolve, delayMs / (total * 3)));
        }
        const time = now();
        const current = store.read('stories.json', { stories: [] }).stories;
        store.write('stories.json', { generatedAt: time.toISOString(), stories: applyRefreshWave(current, time) });
        return { ok: true };
    };
}

module.exports = { buildDemoStories, applyRefreshWave, seedDemo, createDemoRun, OUTLETS };
