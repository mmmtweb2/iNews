import { ChevronDown } from 'lucide-react';
import { timeAgo, isRecent, isTrending, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE } from './utils';
import ImageBanner from './ImageBanner';
import ReactionBar from './ReactionBar';

const NewsCard = ({ item, onSelect, imagesEnabled }) => {
  const categoryStyle = CATEGORY_STYLES[item.category] || DEFAULT_CATEGORY_STYLE;
  const fresh = isRecent(item.publishedAt);
  const trending = isTrending(item);

  return (
    <div
      onClick={() => onSelect(item)}
      className="
        group relative bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:rotate-[0.3deg]
        transition-all duration-300 border border-slate-100 overflow-hidden cursor-pointer h-full
        flex flex-col
      "
    >
      {imagesEnabled && <ImageBanner item={item} className="w-full h-36 shrink-0" />}

      <span className={`absolute top-0 right-0 h-full w-1.5 ${categoryStyle.bar}`} />

      <div className="p-5 relative flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-400 flex-wrap">
              {item.categoryLabel && (
                <span className={`px-2 py-0.5 rounded-full font-bold ${categoryStyle.pill}`}>
                  {categoryStyle.emoji} {item.categoryLabel}
                </span>
              )}
              {trending && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-600">
                  🔥 טרנדי
                </span>
              )}
              {fresh && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-600">
                  ✨ חדש
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

        <div className="mt-4 pt-3 border-t border-slate-50">
          <ReactionBar item={item} />
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
