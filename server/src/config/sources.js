// News sources.
//
// `lean` is an EDITORIAL classification of Israeli general-news outlets on a
// five-point scale. It is subjective and contestable, so it lives here in one
// place, is shown to readers on the transparency page, and is easy to change.
// Sources that are not general Israeli political news (business, sports,
// international, tech) have `lean: null` ("unrated") and are ignored by the
// coverage-balance logic.
//
// The AI never sees the `lean` label: it is applied after the fact, so the
// model cannot be primed by it.
//
// `verified: true`  -> URL carried over from the previous version of the project.
// `verified: false` -> added in the redesign; could not be fetched from the
//                      development sandbox. Check /api/status after the first run
//                      and prune whatever fails.

const LEANS = ['left', 'center-left', 'center', 'center-right', 'right'];

const LEAN_LABELS = {
    left: 'שמאל',
    'center-left': 'מרכז-שמאל',
    center: 'מרכז',
    'center-right': 'מרכז-ימין',
    right: 'ימין',
};

function googleNews(id, query) {
    return {
        id,
        name: 'Google News',
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=iw&gl=IL&ceid=IL:iw`,
        lang: 'he',
        lean: null,
        kind: 'aggregator',
        verified: true,
    };
}

const SOURCES = [
    // --- Israeli general news ---
    { id: 'ynet', name: 'ynet', url: 'https://www.ynet.co.il/Integration/StoryRss1854.xml', lang: 'he', lean: 'center-left', verified: true },
    { id: 'walla', name: 'וואלה', url: 'https://rss.walla.co.il/feed/1?type=main', lang: 'he', lean: 'center', verified: true },
    { id: 'now14', name: 'עכשיו 14', url: 'https://www.now14.co.il/feed/', lang: 'he', lean: 'right', verified: true },
    { id: 'arutz7', name: 'ערוץ 7', url: 'https://www.inn.co.il/Rss.aspx', lang: 'he', lean: 'right', verified: true },
    { id: 'haaretz', name: 'הארץ', url: 'https://www.haaretz.co.il/cmlink/1.1470869', lang: 'he', lean: 'left', verified: false },
    { id: 'maariv', name: 'מעריב', url: 'https://www.maariv.co.il/Rss/RssFeedsMivzakiChadashot', lang: 'he', lean: 'center-right', verified: false },
    { id: 'israelhayom', name: 'ישראל היום', url: 'https://www.israelhayom.co.il/rss.xml', lang: 'he', lean: 'right', verified: false },
    { id: 'toi', name: 'The Times of Israel', url: 'https://www.timesofisrael.com/feed/', lang: 'en', lean: 'center', verified: false },
    { id: 'jpost', name: 'The Jerusalem Post', url: 'https://www.jpost.com/Rss/RssFeedsHeadlines.aspx', lang: 'en', lean: 'center-right', verified: false },

    // --- Business, tech, sports (unrated) ---
    { id: 'globes', name: 'גלובס', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.xsd?folderid=2', lang: 'he', lean: null, verified: true },
    { id: 'bizportal', name: 'ביזפורטל', url: 'https://www.bizportal.co.il/webservice/rss/general', lang: 'he', lean: null, verified: true },
    { id: 'calcalist', name: 'כלכליסט', url: 'https://www.calcalist.co.il/GeneralRSS/0,16335,L-8,00.xml', lang: 'he', lean: null, verified: false },
    { id: 'geektime', name: 'גיקטיים', url: 'https://www.geektime.co.il/feed/', lang: 'he', lean: null, verified: true },
    { id: 'one', name: 'ONE', url: 'https://www.one.co.il/cat/coop/xml/rss/news_main.xml', lang: 'he', lean: null, verified: true },

    // --- International (unrated; used mainly for world, tech and science) ---
    { id: 'bbc', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en', lean: null, verified: false },
    { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', lang: 'en', lean: null, verified: false },
    { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en', lean: null, verified: false },
    { id: 'npr', name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', lang: 'en', lean: null, verified: false },
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', lang: 'en', lean: null, verified: false },
    { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en', lean: null, verified: false },
    { id: 'ars', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', lang: 'en', lean: null, verified: false },
    { id: 'mittr', name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', lang: 'en', lean: null, verified: false },
    { id: 'sciencedaily', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top.xml', lang: 'en', lean: null, verified: false },

    // --- Aggregated feeds fill the topics direct feeds cover poorly.
    //     Their links are Google redirects, so article pages are not fetched. ---
    googleNews('gn-health', 'בריאות רפואה'),
    googleNews('gn-culture', 'תרבות אמנות בידור'),
    googleNews('gn-sports', 'ספורט ישראל'),
    googleNews('gn-science', 'מדע וסביבה'),
].map(s => ({ kind: 'publisher', ...s }));

module.exports = { SOURCES, LEANS, LEAN_LABELS };
