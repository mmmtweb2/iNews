import { ChevronDown } from 'lucide-react';
import { timeAgo, isRecent, isTrending, isSingleSource, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE } from './utils';
import ImageBanner from './ImageBanner';
import ReactionBar from './ReactionBar';

const NewsCard = ({ item, onSelect, imagesEnabled, featured = false }) => {
  const categoryStyle = CATEGORY_STYLES[item.category] || DEFAULT_CATEGORY_STYLE;
  const fresh = isRecent(item.publishedAt);
  const trending = isTrending(item);
  const singleSource = isSingleSource(item);

  return (
    <div
      onClick={() => onSelect(item)}
      className={`
        group relative bg-white overflow-hidden cursor-pointer h-full flex
        border border-stone-200 hover:border-stone-300 transition-colors
        ${featured ? 'md:flex-row flex-col' : 'flex-col rounded-lg'}
      `}
    >
      {imagesEnabled && (
        <ImageBanner
          item={item}
          className={featured ? 'w-full md:w-1/2 h-56 md:h-auto shrink-0' : 'w-full h-36 shrink-0'}
        />
      )}

      <span className={`absolute top-0 right-0 h-full w-1 ${categoryStyle.bar}`} />

      <div className={`relative flex-1 flex flex-col ${featured ? 'p-6 md:p-8 justify-center' : 'p-5'}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-x-2.5 gap-y-1 mb-2.5 text-[11px] font-bold text-stone-400 uppercase tracking-wide flex-wrap">
              {item.categoryLabel && (
                <span className={categoryStyle.text}>
                  {categoryStyle.emoji} {item.categoryLabel}
                </span>
              )}
              <span className="text-stone-300">•</span>
              <span className="normal-case font-medium">{timeAgo(item.publishedAt)}</span>
              {trending && (
                <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">🔥 טרנדי</span>
              )}
              {fresh && (
                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">✨ חדש</span>
              )}
              {singleSource && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700" title="הידיעה הזו מסתמכת על מקור אחד בלבד, ולא עברה מיזוג בין נקודות מבט">
                  ⚠️ מקור יחיד
                </span>
              )}
            </div>

            <h3 className={`
              font-serif font-bold text-stone-900 leading-snug group-hover:text-rose-800 transition-colors
              ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}
            `}>
              {item.title}
            </h3>
          </div>

          {!featured && (
            <button className="mt-1 p-2 rounded-full bg-stone-50 text-stone-400 transition-transform duration-300 group-hover:text-rose-700">
              <ChevronDown size={20} />
            </button>
          )}
        </div>

        {item.bullets && item.bullets[0] && (
          <p className={`mt-3 text-stone-500 leading-relaxed ${featured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
            {item.bullets[0]}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-stone-100">
          <ReactionBar item={item} />
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
