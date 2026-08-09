const NewsTicker = ({ items, onSelect }) => {
  if (!items || items.length === 0) return null;

  const track = (
    <div className="flex items-center gap-10 shrink-0">
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(item)}
          className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white whitespace-nowrap transition-colors"
        >
          <span className="text-rose-500 text-xs">●</span>
          {item.title}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 overflow-hidden select-none">
      <div className="flex items-center gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="flex items-center gap-1.5 py-2 pl-4 shrink-0 text-xs font-black text-white bg-rose-600 -mr-4 px-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          LIVE
        </span>
        <div className="flex overflow-hidden py-2" dir="ltr">
          <div className="flex gap-10 animate-[ticker_35s_linear_infinite] hover:[animation-play-state:paused]" dir="rtl">
            {track}
            {track}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
