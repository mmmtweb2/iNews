export const HEAT_NOTES = {
  calm: 'רק ידיעות רגועות. נושאים כבדים וחשובים יופיעו בניסוח מאופק.',
  balanced: 'כולל מתח ומחלוקות, בלי אלימות ואסונות. נושאים כבדים וחשובים יופיעו בניסוח מאופק.',
  all: 'הכול, כפי שקרה.',
}

export const HEAT_NAMES = { calm: 'רגוע', balanced: 'מאוזן', all: 'הכול' }

export const HEAT_RUBRIC = [
  [1, 'מידע בלי מטען רגשי: דוחות כספיים, השקת מוצר, לוחות זמנים'],
  [2, 'מתח או מחלוקת בלי פגיעה באנשים: ויכוח פוליטי, איום בשביתה'],
  [3, 'עימות או פגיעה מוגבלים ובלי תיאור גרפי: תאונה עם פצועים קל, משבר פוליטי'],
  [4, 'כבד: הרוגים, אירועי טרור ומלחמה, אלימות קשה, אסונות'],
  [5, 'קשה מאוד: פגיעה המונית, תיאורים גרפיים, אלימות נגד ילדים'],
]

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
