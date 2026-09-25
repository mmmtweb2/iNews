import { useEffect } from 'react';
import { X, ArrowUpRight, Clock } from 'lucide-react';
import { timeAgo, isTrending, isSingleSource, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE, BIAS_STYLES, DEFAULT_BIAS_STYLE } from './utils';
import ImageBanner from './ImageBanner';
import ReactionBar from './ReactionBar';

const NewsModal = ({ item, onClose, imagesEnabled }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

  const categoryStyle = CATEGORY_STYLES[item.category] || DEFAULT_CATEGORY_STYLE;
  const trending = isTrending(item);
  const singleSource = isSingleSource(item);

  return (
    <div
      onClick={onClose}
      className="
        fixed inset-0 z-[100] flex items-center justify-center p-4
        bg-stone-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col
          bg-white rounded-lg shadow-2xl
          animate-[scaleIn_0.2s_ease-out]
        "
      >
       <div className="overflow-y-auto">
        {imagesEnabled && (
          <div className="relative">
            <ImageBanner item={item} className="w-full h-48" />
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/90 hover:bg-white text-stone-600 shadow-sm transition-colors"
              aria-label="סגור"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-x-2.5 gap-y-1 text-[11px] font-bold uppercase tracking-wide flex-wrap">
              {item.categoryLabel && (
                <span className={categoryStyle.text}>
                  {categoryStyle.emoji} {item.categoryLabel}
                </span>
              )}
              <span className="flex items-center gap-1 text-stone-400 normal-case font-medium">
                <Clock size={13} />
                {timeAgo(item.publishedAt)}
              </span>
              {trending && (
                <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">🔥 טרנדי</span>
              )}
              {singleSource && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">⚠️ מקור יחיד</span>
              )}
            </div>
            {!imagesEnabled && (
              <button
                onClick={onClose}
                className="p-2 -m-2 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <h2 className="font-serif font-bold text-stone-900 text-2xl sm:text-3xl leading-snug mb-6">
            {item.title}
          </h2>

          <ul className="space-y-3 mb-6">
            {item.bullets && item.bullets.map((bullet, idx) => (
              <li key={idx} className="flex gap-3 text-stone-600 leading-relaxed text-[15px]">
                <span className="text-rose-700 font-bold text-lg leading-none mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mb-6">
            <ReactionBar item={item} />
          </div>

          <div className="h-px w-full bg-stone-100 mb-4"></div>

          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-stone-400 uppercase tracking-wider">
            <span className={`w-1.5 h-1.5 rounded-full ${singleSource ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            {singleSource
              ? 'מקור יחיד — טרם עברה איזון בין נקודות מבט:'
              : 'מקורות משני צדי המפה — לקריאה מלאה:'}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {item.links && item.links.map((link, idx) => {
              const bias = BIAS_STYLES[link.bias] || DEFAULT_BIAS_STYLE;
              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={bias.label}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5
                    bg-stone-50 hover:bg-rose-50 hover:text-rose-700 border border-stone-200 hover:border-rose-200
                    rounded text-xs font-semibold text-stone-600 transition-all
                  "
                >
                  <span className={`w-2 h-2 rounded-full ${bias.dot}`}></span>
                  {link.name}
                  <ArrowUpRight size={14} />
                </a>
              );
            })}
          </div>
        </div>
       </div>
      </div>
    </div>
  );
};

export default NewsModal;
