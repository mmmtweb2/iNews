import { useEffect } from 'react';
import { X, ArrowUpRight, Clock, ShieldCheck, Zap } from 'lucide-react';

const getSentimentConfig = (sentiment) => {
  switch (sentiment) {
    case 'positive': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ShieldCheck size={16} /> };
    case 'negative': return { color: 'text-rose-600', bg: 'bg-rose-50', icon: <Zap size={16} /> };
    default: return { color: 'text-slate-500', bg: 'bg-slate-50', icon: <Clock size={16} /> };
  }
};

const NewsModal = ({ item, onClose }) => {
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

  const config = getSentimentConfig(item.sentiment);

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
          w-full max-w-xl max-h-[85vh] overflow-y-auto
          bg-white rounded-2xl shadow-2xl border border-slate-100
          animate-[scaleIn_0.2s_ease-out]
        "
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
              {config.icon}
              {item.time || 'עודכן לאחרונה'}
            </span>
            <button
              onClick={onClose}
              className="p-2 -m-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="סגור"
            >
              <X size={20} />
            </button>
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

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-wider">לקריאה במקור:</span>
            {item.links && item.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center gap-1.5 px-3 py-1.5
                  bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200
                  rounded-lg text-xs font-semibold text-slate-600 transition-all
                "
              >
                {link.name}
                <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
