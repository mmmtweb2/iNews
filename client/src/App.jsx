import React, { useState, useEffect, useRef } from 'react';
import NewsCard from './NewsCard';
import NewsModal from './NewsModal';
import NewsTicker from './NewsTicker';
import { RefreshCw, ShieldCheck, Image, ImageOff, Users } from 'lucide-react';
import { CATEGORY_STYLES, isRecent } from './utils';

function App() {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [onlineCount, setOnlineCount] = useState(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState('');
  const pollRef = useRef(null);
  const [imagesEnabled, setImagesEnabled] = useState(() => {
    const saved = localStorage.getItem('briefly-images-enabled');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('briefly-images-enabled', imagesEnabled);
  }, [imagesEnabled]);

  // מונה קוראים חי אמיתי: כל דפדפן שולח heartbeat תקופתי, והשרת סופר
  // כמה נראו ב-60 השניות האחרונות. מספר אמיתי - לא מומצא.
  useEffect(() => {
    let clientId;
    try {
      clientId = localStorage.getItem('briefly-client-id');
      if (!clientId) {
        clientId = Math.random().toString(36).slice(2);
        localStorage.setItem('briefly-client-id', clientId);
      }
    } catch {
      clientId = Math.random().toString(36).slice(2);
    }

    const beat = () => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
        .then(res => res.json())
        .then(data => setOnlineCount(data.online))
        .catch(() => {});
    };

    beat();
    const interval = setInterval(beat, 20000);
    return () => clearInterval(interval);
  }, []);

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
      if (data.refreshing === false && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setManualRefreshing(false);
      }
    } catch (error) {
      console.error("Error fetching news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!refreshNote) return;
    const t = setTimeout(() => setRefreshNote(''), 5000);
    return () => clearTimeout(t);
  }, [refreshNote]);

  // רענון אמיתי: מפעיל מחדש את כל צנרת השליפה+AI בשרת (לא רק מציג את
  // אותו final.json שוב), ואז בודק כל כמה שניות אם הריענון הסתיים
  const triggerFullRefresh = async () => {
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const data = await res.json();

      if (res.status === 429) {
        setRefreshNote(data.status === 'cooldown'
          ? `אפשר לרענן שוב בעוד ${data.retryInSeconds} שניות`
          : 'רענון כבר רץ ברקע...');
        return;
      }

      setManualRefreshing(true);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchNews, 4000);
      // רשת ביטחון - לא לדגור לנצח אם משהו נתקע
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setManualRefreshing(false);
        }
      }, 90000);
    } catch {
      setRefreshNote('הרענון נכשל, נסה שוב');
    }
  };

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

  const currentItems = getCurrentItems();
  const sortedItems = [...currentItems].sort((a, b) => {
    const aScore = (a.links?.length || 0) + (isRecent(a.publishedAt) ? 10 : 0);
    const bScore = (b.links?.length || 0) + (isRecent(b.publishedAt) ? 10 : 0);
    return bScore - aScore;
  });
  const [heroItem, ...restItems] = sortedItems;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-stone-800 pb-10" dir="rtl">

      {/* --- Sticky Masthead + Live Ticker --- */}
      <div className="sticky top-0 z-50">
        <div className="bg-white border-b-[3px] border-stone-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* שורת מהדורה - כמו קו התאריך בעיתון מודפס */}
            <div className="flex justify-between items-center py-2 text-[11px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">
              <span>מהדורה דיגיטלית · {today}</span>
              <span>חדשות משני הצדדים, בלי הטיה</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-stone-900">
                Briefly<span className="text-rose-700">.</span>
              </h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImagesEnabled(v => !v)}
                  title={imagesEnabled ? 'עבור לתצוגה נקייה ללא תמונות' : 'עבור לתצוגה עם תמונות'}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors
                    ${imagesEnabled ? 'bg-stone-100 text-stone-500 hover:text-rose-700' : 'bg-stone-900 text-white'}
                  `}
                >
                  {imagesEnabled ? <Image size={16} /> : <ImageOff size={16} />}
                  <span className="hidden sm:inline">{imagesEnabled ? 'עם תמונות' : 'תצוגה נקייה'}</span>
                </button>
                <button
                  onClick={triggerFullRefresh}
                  disabled={manualRefreshing}
                  title="משוך חדשות חדשות עכשיו"
                  className="p-2 bg-stone-100 rounded-full text-stone-500 hover:text-rose-700 transition-all duration-500 disabled:opacity-60"
                >
                  <RefreshCw size={18} className={manualRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-0 scrollbar-hide -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`
                    pb-3 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors
                    ${activeTab === tab.name
                      ? 'border-rose-700 text-stone-900'
                      : 'border-transparent text-stone-400 hover:text-stone-700'}
                  `}
                >
                  {tab.name === 'General' ? '👋' : CATEGORY_STYLES[tab.name]?.emoji} {tab.label}
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
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-stone-500 border border-stone-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              עודכן ב-{lastUpdated}
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 border border-stone-200">
              <ShieldCheck size={14} />
              מאוזן ושקוף — כל הצדדים
            </span>
            {onlineCount !== null && (
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-blue-700 border border-stone-200">
                <Users size={14} />
                {onlineCount} קוראים עכשיו
              </span>
            )}
            {manualRefreshing && (
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-stone-500 border border-stone-200">
                <RefreshCw size={14} className="animate-spin" />
                מרענן חדשות...
              </span>
            )}
            {refreshNote && (
              <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-stone-500 border border-stone-200">
                {refreshNote}
              </span>
            )}
          </div>
        )}

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-48 bg-white rounded-2xl border border-stone-200"></div>
             ))}
           </div>
        ) : currentItems.length > 0 ? (
          <>
            <div className="mb-6">
              <NewsCard item={heroItem} onSelect={setSelectedItem} imagesEnabled={imagesEnabled} featured />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restItems.map((item, index) => (
                <div key={index} className="h-full">
                   <NewsCard item={item} onSelect={setSelectedItem} imagesEnabled={imagesEnabled} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400">
            <div className="text-4xl mb-2">☕</div>
            <p>הכל שקט כרגע.</p>
          </div>
        )}

      </div>

      {selectedItem && (
        <NewsModal item={selectedItem} onClose={() => setSelectedItem(null)} imagesEnabled={imagesEnabled} />
      )}
    </div>
  );
}

export default App;
