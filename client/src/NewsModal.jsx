import { useEffect } from 'react';
import { X, ArrowUpRight, Clock } from 'lucide-react';
import { timeAgo, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE, BIAS_STYLES, DEFAULT_BIAS_STYLE } from './utils';
import ImageBanner from './ImageBanner';

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

  return (
    <div
      onClick={onClose}
      className="
        fixed inset-0 z-[100] flex items-center justify-center p-4
        bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]
      "
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col
          bg-white rounded-2xl shadow-2xl border border-slate-100
          animate-[scaleIn_0.2s_ease-out]
        "
      >
       <div className="overflow-y-auto">
        {imagesEnabled && (
          <div className="relative">
            <ImageBanner item={item} className="w-full h-48" />
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-sm transition-colors"
              aria-label="סגור"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {item.categoryLabel && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${categoryStyle.pill}`}>
                  {item.categoryLabel}
                </span>
              )}
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500">
                <Clock size={14} />
                {timeAgo(item.publishedAt)}
              </span>
            </div>
            {!imagesEnabled && (
              <button
                onClick={onClose}
                className="p-2 -m-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <h2 className="font-bold text-slate-900 text-2xl leading-snug mb-6">
            {item.title}
          </h2>

          <ul className="space-y-3 mb-6">
            {item.bullets && item.bullets.map((bullet, idx) => (
              <li key={idx} className="flex gap-3 text-slate-600 leading-relaxed text-[15px]">
                <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="h-px w-full bg-slate-100 mb-4"></div>

          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            מקורות משני צדי המפה — לקריאה מלאה:
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
                    bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200
                    rounded-lg text-xs font-semibold text-slate-600 transition-all
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
