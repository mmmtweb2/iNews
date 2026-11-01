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

