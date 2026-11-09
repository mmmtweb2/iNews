export const HEAT_RUBRIC = [
  [1, 'מידע בלי מטען רגשי: דוחות כספיים, השקת מוצר, לוחות זמנים'],
  [2, 'מתח או מחלוקת בלי פגיעה באנשים: ויכוח פוליטי, איום בשביתה'],
  [3, 'עימות או פגיעה מוגבלים ובלי תיאור גרפי: תאונה עם פצועים קל, משבר פוליטי'],
  [4, 'כבד: הרוגים, אירועי טרור ומלחמה, אלימות קשה, אסונות'],
  [5, 'קשה מאוד: פגיעה המונית, תיאורים גרפיים, אלימות נגד ילדים'],
]

// Copy for the five style dials. `ends` are the two ends of the dial (the first is value 0, shown
// at the start of the line); `steps` name each of the five positions and `notes` say what that
// position does, in one short sentence.
export const DIALS_COPY = {
  tone: {
    title: 'אופי',
    ends: ['רגוע', 'דרמטי'],
    steps: ['רגוע מאוד', 'רגוע', 'מאוזן', 'גם הקשה', 'דרמטי'],
    notes: [
      'רק ידיעות שקטות. נושאים כבדים וחשובים יופיעו בניסוח מאופק.',
      'בלי אלימות, אסונות ועימותים חריפים. נושאים כבדים וחשובים יופיעו בניסוח מאופק.',
      'כולל מתח ומחלוקות, בלי אלימות ואסונות. נושאים כבדים וחשובים יופיעו בניסוח מאופק.',
      'הכול, כפי שקרה, כולל ידיעות קשות.',
      'הכול, והידיעות הדרמטיות ביותר קודם.',
    ],
  },
  density: {
    title: 'כמות',
    ends: ['הרבה כותרות', 'מעט ובעומק'],
    steps: ['גלישה מהירה', 'הרבה וקצר', 'מאוזן', 'מעט ומפורט', 'רק הבולטות'],
    notes: [
      'עד 40 כותרות בלבד. כל ידיעה נפתחת בלחיצה.',
      'הרבה כותרות, והבולטות שבהן בתקציר.',
      'תקצירים, ומה שנשאר מהזמן לכתבה המלאה של הראשונות.',
      'עד 14 ידיעות בתקציר, והראשונות בכתבה מלאה.',
      'עד 7 ידיעות, כולן בכתבה המלאה.',
    ],
  },
  prominence: {
    title: 'בולטות',
    ends: ['גם הקטנות', 'רק הגדולות'],
    steps: ['כל מה שקרה', 'גם קטנות', 'מאוזן', 'חשובות', 'רק הגדולות'],
    notes: [
      'גם ידיעות קטנות מקבלות מקום, והחשיבות משפיעה פחות על הסדר.',
      'ידיעות קטנות נכנסות בקלות, והחשיבות משפיעה מעט פחות.',
      'החשיבות קובעת את הסדר, ידיעות קטנות נכנסות אם נשאר זמן.',
      'ידיעות קטנות עוברות ל"עוד ידיעות". תחומים שאתה עוקב אחריהם נשארים.',
      'רק ידיעות גדולות. את השאר אפשר למצוא תחת "עוד ידיעות".',
    ],
  },
  focus: {
    title: 'מיקוד',
    ends: ['רק מה שביקשתי', 'גם הפתעות'],
    steps: ['רק התחומים שלי', 'בעיקר שלי', 'מאוזן', 'מגוון', 'מגוון מקסימלי'],
    notes: [
      'תחומים ומילים שבחרת עולים בחוזקה, ושאר הידיעות יורדות.',
      'תחומים ומילים שבחרת עולים, ושאר הידיעות יורדות קצת.',
      'תחומים שבחרת עולים בעדינות, בלי להוריד את השאר.',
      'הבחירות שלך משפיעות פחות, ולא נראים יותר מדי תחומים זהים ברצף.',
      'מפזרים את הבריף בין תחומים, כדי שלא תפספס מה שמחוץ לתחומים שלך.',
    ],
  },
  freshness: {
    title: 'טריות',
    ends: ['הכי חדש קודם', 'החשוב קודם'],
    steps: ['חדש מאוד', 'חדש', 'מאוזן', 'חשוב', 'בלי קשר לשעה'],
    notes: [
      'מה שהתפרסם בשעות האחרונות עולה למעלה, גם אם הוא קטן יותר.',
      'ידיעות טריות מקבלות יתרון ברור.',
      'ידיעות טריות מקבלות יתרון קטן שדועך תוך 18 שעות.',
      'יתרון הטריות קטן, והחשיבות קובעת.',
      'הסדר נקבע רק לפי חשיבות, בלי קשר למועד הפרסום.',
    ],
  },
}

export function blindspotText(side) {
  return side === 'right'
    ? 'לא נמצא כיסוי של מקורות מהימין בין המקורות שנסרקו'
    : 'לא נמצא כיסוי של מקורות מהשמאל בין המקורות שנסרקו'
}

// "Reported by" describes breadth, not truth: outlets copy each other, so we never say "verified".
export function reachLabel(confidence, fallbackCount) {
  const owners = confidence ? confidence.owners : fallbackCount
  const official = confidence?.official ? ' כולל מקור רשמי.' : ''
  if (owners <= 1) return { single: true, text: `דווח בגוף תקשורת אחד בלבד.${official}` }
  return { single: false, text: `דווח ב-${owners} גופי תקשורת.${official}` }
}


export function progressText(progress) {
  if (!progress) return 'מתחיל'
  if (progress.phase === 'ingest') return 'אוסף כותרות מהאתרים'
  if (progress.phase === 'cluster') return 'מקבץ ידיעות על אותו אירוע'
  if (progress.phase === 'enrich') {
    if (!progress.total) return 'בודק מה השתנה'
    return `כותב ידיעה ${Math.min(progress.done + 1, progress.total)} מתוך ${progress.total}`
  }
  return 'מעבד'
}

const count = (n, one, many) => (n === 1 ? one : `${n} ${many}`)

// What the reader is told after pressing refresh. Plain facts, no apology and no cheer.
export function refreshMessage(message) {
  switch (message.kind) {
    case 'done': {
      const added = message.added || 0
      const changed = message.changed || 0
      if (!added && !changed) return 'אין ידיעות חדשות כרגע.'
      const addedText = added === 1 ? 'נוספה ידיעה חדשה' : `נוספו ${added} ידיעות חדשות`
      const changedText = changed === 1 ? 'ידיעה אחת עודכנה' : `${changed} ידיעות עודכנו`
      if (added && changed) return `${addedText} ו-${changed} עודכנו.`
      return `${added ? addedText : changedText}.`
    }
    case 'fresh': {
      const minutes = message.retryAfterSec ? Math.max(1, Math.ceil(message.retryAfterSec / 60)) : null
      return minutes ? `הידיעות עדכניות. אפשר לרענן שוב בעוד ${count(minutes, 'דקה', 'דקות')}.` : 'הידיעות עדכניות.'
    }
    case 'limit':
      return 'הגענו למכסת הריענון להיום. נסה שוב מחר.'
    case 'unavailable':
      return 'הריענון לא זמין כרגע בשרת הזה.'
    default:
      return 'הריענון נכשל. נסה שוב בעוד רגע.'
  }
}
