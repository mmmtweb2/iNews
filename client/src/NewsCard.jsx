import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, ArrowUpRight, Clock, ShieldCheck, Zap } from 'lucide-react';

const NewsCard = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  // עיצוב דינמי לפי סנטימנט - עדין יותר
  const getSentimentConfig = (sentiment) => {
    switch (sentiment) {
      case 'positive': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <ShieldCheck size={16} /> };
      case 'negative': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: <Zap size={16} /> };
      default: return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', icon: <Clock size={16} /> };
    }
  };

  const config = getSentimentConfig(item.sentiment);

  return (
    <div 
      className={`
        group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 
        transition-all duration-300 border border-slate-100 mb-4 overflow-hidden
      `}
    >
      {/* --- הכותרת (תמיד גלוי) --- */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 cursor-pointer relative"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {/* שורת מטא-דאטה עליונה */}
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-400">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {config.icon}
                {item.time || 'עודכן לאחרונה'}
              </span>
              <span>•</span>
              <span>{item.links ? item.links.length : 1} מקורות</span>
            </div>

            {/* הכותרת עצמה */}
            <h3 className="font-bold text-slate-800 text-xl leading-snug group-hover:text-blue-700 transition-colors">
              {item.title}
            </h3>
          </div>

          {/* אייקון פתיחה */}
          <button className={`
            mt-2 p-2 rounded-full bg-slate-50 text-slate-400 transition-transform duration-300
            ${isOpen ? 'rotate-180 bg-blue-50 text-blue-500' : ''}
          `}>
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* --- התוכן המורחב (Expandable) --- */}
      <div className={`
        overflow-hidden transition-[max-height] duration-500 ease-in-out
        ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 pb-6 pt-0">
          <div className="h-px w-full bg-slate-100 mb-4"></div>
          
          {/* בוליטים */}
          <ul className="space-y-3 mb-6">
            {item.bullets && item.bullets.map((bullet, idx) => (
              <li key={idx} className="flex gap-3 text-slate-600 leading-relaxed text-[15px]">
                <span className="text-blue-500 font-bold text-lg leading-none mt-0.5">•</span>
                <span>{bullet}</span>
              </li>
            ))}
            {!item.bullets && <p className="text-slate-500">טוען מידע נוסף...</p>}
          </ul>

          {/* מקורות וקישורים */}
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

export default NewsCard;