import React, { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import NewsModal from './NewsModal';
import { RefreshCw } from 'lucide-react';

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

  const getCurrentItems = () => {
    if (activeTab === 'General') return categories.flatMap(cat => cat.items);
    const currentCategory = categories.find(c => c.name === activeTab);
    return currentCategory ? currentCategory.items : [];
  };

  const tabs = [
    { name: 'General', label: 'ראשי' },
    ...categories.map(c => ({ name: c.name, label: c.label }))
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-800 pb-10" dir="rtl">
      
      {/* --- Sticky Header --- */}
      {/* שינוי 1: הסרנו את max-w-3xl והשתמשנו ב-container רחב יותר */}
      <div className="sticky top-0 z-50 bg-[#F3F4F6]/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                Briefly<span className="text-blue-600">.</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">{today}</p>
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

      {/* --- Main Content --- */}
      {/* שינוי 2: הרחבנו את הקונטיינר הראשי ל-7xl */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {!loading && (
          <div className="text-center mb-8">
            <span className="bg-white/60 px-4 py-1.5 rounded-full text-xs font-bold text-slate-400 border border-white shadow-sm tracking-wide">
               🤖 עודכן ב-{lastUpdated}
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
          /* שינוי 3: מעבר מ-Flex ל-Grid רספונסיבי */
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