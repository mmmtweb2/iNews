import { useState, useEffect } from 'react';
import { REACTION_EMOJIS } from './utils';

// ריאקציות אמיתיות ומשותפות לכל המבקרים (הספירה חיה בשרת, לא רק בדפדפן שלך).
// כל דפדפן יכול להצביע פעם אחת לכל ידיעה (מסומן ב-localStorage).
const ReactionBar = ({ item }) => {
  const [counts, setCounts] = useState(item.reactions || {});
  const [myReaction, setMyReaction] = useState(() => {
    try {
      return localStorage.getItem(`briefly-reacted-${item.id}`) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setCounts(item.reactions || {});
  }, [item.reactions]);

  const react = async (emoji, e) => {
    e.stopPropagation();
    if (myReaction) return;

    setMyReaction(emoji);
    try { localStorage.setItem(`briefly-reacted-${item.id}`, emoji); } catch { /* no-op */ }
    setCounts(c => ({ ...c, [emoji]: (c[emoji] || 0) + 1 }));

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, emoji }),
      });
      const data = await res.json();
      if (data.reactions) setCounts(data.reactions);
    } catch {
      // הספירה האופטימית כבר על המסך, לא קריטי אם השרת לא הגיב
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => react(emoji, e)}
          disabled={!!myReaction}
          className={`
            flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold transition-all
            ${myReaction === emoji ? 'bg-blue-100 scale-110' : 'bg-slate-50 hover:bg-slate-100 hover:scale-105'}
            ${myReaction && myReaction !== emoji ? 'opacity-40' : ''}
          `}
        >
          <span>{emoji}</span>
          {counts[emoji] > 0 && <span className="text-slate-500 text-xs">{counts[emoji]}</span>}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
