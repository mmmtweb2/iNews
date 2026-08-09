import { ChevronDown, Clock, ShieldCheck, Zap } from 'lucide-react';

const getSentimentConfig = (sentiment) => {
  switch (sentiment) {
    case 'positive': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ShieldCheck size={16} /> };
    case 'negative': return { color: 'text-rose-600', bg: 'bg-rose-50', icon: <Zap size={16} /> };
    default: return { color: 'text-slate-500', bg: 'bg-slate-50', icon: <Clock size={16} /> };
  }
};

const NewsCard = ({ item, onSelect }) => {
  const config = getSentimentConfig(item.sentiment);

  return (
    <div
      onClick={() => onSelect(item)}
      className="
        group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-300 border border-slate-100 overflow-hidden cursor-pointer h-full
      "
    >
      <div className="p-5 relative h-full flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-400">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {config.icon}
                {item.time || 'עודכן לאחרונה'}
              </span>
              <span>•</span>
              <span>{item.links ? item.links.length : 1} מקורות</span>
            </div>

            <h3 className="font-bold text-slate-800 text-xl leading-snug group-hover:text-blue-700 transition-colors">
              {item.title}
            </h3>
          </div>

          <button className="mt-2 p-2 rounded-full bg-slate-50 text-slate-400 transition-transform duration-300 group-hover:text-blue-500">
            <ChevronDown size={20} />
          </button>
        </div>

        {item.bullets && item.bullets[0] && (
          <p className="mt-3 text-slate-500 text-sm leading-relaxed line-clamp-2">
            {item.bullets[0]}
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
