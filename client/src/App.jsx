import React, { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import NewsModal from './NewsModal';
import NewsTicker from './NewsTicker';
import { RefreshCw, ShieldCheck } from 'lucide-react';

function App() {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const today = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
        setLastUpdated(new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}));
      }
    } catch (error) {
      console.error("Error fetching news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // מוסיפים לכל ידיעה את שם/תווית הקטגוריה שלה, כדי שנוכל לצבוע ולתייג אותה
  // גם בתצוגה "ראשי" שבה מציגים ידיעות מכמה קטגוריות יחד
  const allItems = categories.flatMap(cat =>
    cat.items.map(item => ({ ...item, category: cat.name, categoryLabel: cat.label }))
  );

  const getCurrentItems = () => {
    if (activeTab === 'General') return allItems;
    return allItems.filter(item => item.category === activeTab);
  };

  const tickerItems = [...allItems]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 12);

  const tabs = [
    { name: 'General', label: 'ראשי' },
    ...categories.map(c => ({ name: c.name, label: c.label }))
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-800 pb-10" dir="rtl">

      {/* --- Sticky Header + Live Ticker --- */}
      <div className="sticky top-0 z-50 shadow-sm">
        <div className="bg-[#F3F4F6]/90 backdrop-blur-md border-b border-slate-200/60 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">

            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                  Briefly<span className="text-blue-600">.</span>
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {today} <span className="text-slate-300 mx-1">·</span> חדשות משני הצדדים, בלי הטיה
                </p>
              </div>

              <button
                onClick={fetchNews}
                className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-blue-600 hover:rotate-180 transition-all duration-500"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border
                    ${activeTab === tab.name
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-500 border-transparent hover:bg-slate-200'}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <NewsTicker items={tickerItems} onSelect={setSelectedItem} />
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {!loading && (
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 border border-white shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              עודכן ב-{lastUpdated}
            </span>
            <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 border border-white shadow-sm">
              <ShieldCheck size={14} />
              מאוזן ושקוף — כל הצדדים
            </span>
          </div>
        )}

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100"></div>
             ))}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCurrentItems().length > 0 ? (
              getCurrentItems().map((item, index) => (
                <div key={index} className="h-full">
                   <NewsCard item={item} onSelect={setSelectedItem} />
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="text-4xl mb-2">☕</div>
                <p>הכל שקט כרגע.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {selectedItem && (
        <NewsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default App;
