import Dialog from './Dialog.jsx'
import HeatGlyph from './HeatGlyph.jsx'
import { HEAT_RUBRIC } from '../lib/copy.js'

const LEAN_ORDER = ['left', 'center-left', 'center', 'center-right', 'right']

function Section({ title, children }) {
  return (
    <section className="mt-6 first:mt-1">
      <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
      <div className="mt-1.5 space-y-2 text-[0.9375rem] leading-[1.7] text-soft">{children}</div>
    </section>
  )
}

export default function AboutDialog({ open, onClose, sources, leanLabels }) {
  const publishers = sources.filter(source => source.kind === 'publisher')
  const rated = LEAN_ORDER.map(lean => [lean, publishers.filter(source => source.lean === lean)]).filter(([, list]) => list.length)
  const unrated = publishers.filter(source => !source.lean)

  return (
    <Dialog open={open} onClose={onClose} title="שקיפות ושיטה">
      <Section title="מאיפה החדשות">
        <p>אנחנו אוספים כותרות ותקצירים מ-{publishers.length} אתרי חדשות, ומאגרגטור אחד להשלמת תחומים. כל ידיעה מקשרת למאמרים המקוריים.</p>
      </Section>

      <Section title="מתי הידיעות מתעדכנות">
        <p>האתר לא מעדכן את עצמו ברקע. הידיעות נאספות ונכתבות רק כשמישהו לוחץ על &quot;רענן&quot;, ואז הן זמינות לכולם. כדי לשמור על עלות נמוכה, אפשר לרענן פעם בכמה דקות ועד מספר מוגבל של פעמים ביום. אם הידיעות כבר עדכניות, תקבל הודעה.</p>
      </Section>

      <Section title="איך כל ידיעה נכתבת">
        <p>מערכת בינה מלאכותית קוראת את הכתבות על אותו אירוע וכותבת כותרת וסיכום עובדתיים. היא מייחסת טענות למי שאמר אותן, משמיטה ניסוח טעון ולא מוסיפה דעה.</p>
        <p>כל מספר בסיכום נבדק מול הטקסט המקורי. סיכום שמכיל מספר שלא מופיע במקורות נפסל.</p>
      </Section>

      <Section title="רמת הריגוש">
        <p>הציון מתאר את האירוע עצמו, לא את הניסוח של הכתבה. 1 הוא הרגוע ביותר.</p>
        <ul className="space-y-1.5">
          {HEAT_RUBRIC.map(([level, text]) => (
            <li key={level} className="flex items-start gap-3">
              <HeatGlyph level={level} className="mt-1.5 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p>ידיעה כבדה שחשובה לציבור לא נעלמת: היא מופיעה בניסוח מאופק. מה שסונן תמיד מופיע בתחתית הדף.</p>
      </Section>

      <Section title="איזון פוליטי">
        <p>אנחנו מסווגים אתרי חדשות ישראליים כלליים על ציר שמאל-ימין. זה סיווג עריכתי שיכול להיות שנוי במחלוקת, ואנחנו מציגים אותו כדי שתוכל לשפוט בעצמך. המודל שכותב את הסיכום לא רואה את הסיווג.</p>
        {rated.map(([lean, list]) => (
          <p key={lean}>
            <span className="font-semibold text-ink">{leanLabels[lean]}: </span>
            {list.map(source => source.name).join(', ')}
          </p>
        ))}
        {unrated.length > 0 && (
          <p>
            <span className="font-semibold text-ink">ללא סיווג: </span>
            {unrated.map(source => source.name).join(', ')}
          </p>
        )}
        {unrated.some(source => source.audience === 'haredi') && (
          <p>אתרים חרדיים לא משובצים על ציר שמאל-ימין, כי קו המערכת שלהם לא נמדד עליו. הם נכללים כדי שידיעות שמעניינות את הציבור החרדי לא ייעלמו.</p>
        )}
        <p>כשידיעה פוליטית מסוקרת רק בצד אחד של הציר, אנחנו אומרים את זה בכרטיס הידיעה.</p>
      </Section>

      <Section title="כמה דיווחו">
        <p>בכל ידיעה מצוין בכמה גופי תקשורת היא דווחה. אתרים של אותו בעלים נספרים פעם אחת. זה מדד לרוחב הסיקור ולא הוכחה שהמידע נכון, כי אתרים לפעמים מצטטים זה את זה.</p>
      </Section>

      <Section title="מעקב אחר ידיעות">
        <p>לחיצה על &quot;מעניין אותי&quot; שומרת ידיעה בלשונית &quot;במעקב&quot;. אחרי כל ריענון נציג את העדכונים שלה ואת הידיעות החדשות שמזכירות את אותם אנשים, מקומות ונושאים. ליד כל ידיעה כתוב אילו מילים משותפות, כדי שתוכל לשפוט אם הקשר נכון. ההשוואה נעשית בדפדפן שלך, והסימונים לא נשלחים לשום מקום.</p>
      </Section>

      <Section title="מגבלות">
        <p>בינה מלאכותית עלולה לטעות, בעיקר בציוני הריגוש והחשיבות. הם הערכה ולא מדידה. אם משהו נראה לך שגוי, בדוק במקור.</p>
      </Section>

      <Section title="הפרטיות שלך">
        <p>ההעדפות שלך נשמרות בדפדפן שלך בלבד. אין חשבונות ואין מעקב אחריך.</p>
      </Section>
    </Dialog>
  )
}
