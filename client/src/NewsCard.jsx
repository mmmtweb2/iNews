import { ChevronDown } from 'lucide-react';
import { timeAgo, isRecent, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE } from './utils';

const NewsCard = ({ item, onSelect }) => {
  const categoryStyle = CATEGORY_STYLES[item.category] || DEFAULT_CATEGORY_STYLE;
  const fresh = isRecent(item.publishedAt);

  return (
    <div
      onClick={() => onSelect(item)}
      className="
        group relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-300 border border-slate-100 overflow-hidden cursor-pointer h-full
      "
    >
      <span className={`absolute top-0 right-0 bottom-0 w-1 ${categoryStyle.bar}`} />

      <div className="p-5 relative h-full flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-400 flex-wrap">
              {item.categoryLabel && (
                <span className={`px-2 py-0.5 rounded-full font-bold ${categoryStyle.pill}`}>
                  {item.categoryLabel}
                </span>
              )}
              {fresh && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-600">
                  חדש
                </span>
              )}
              <span>{timeAgo(item.publishedAt)}</span>
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
