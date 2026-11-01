const { stripHtml, normalizeUrl, normalizeTitle, sha1, truncate, mapPool } = require('../lib/text');

// Best-effort lead image from the usual RSS places.
function extractImage(item) {
    if (item.enclosure && item.enclosure.url && (!item.enclosure.type || item.enclosure.type.startsWith('image'))) {
        return item.enclosure.url;
    }
    for (const field of ['media:content', 'media:thumbnail']) {
        const value = item[field];
        if (!value) continue;
        const node = Array.isArray(value) ? value[0] : value;
        const url = node && node.$ && node.$.url;
        if (url) return url;
    }
    const html = item['content:encoded'] || item.content || '';
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
}

// Google News items carry the real publisher in <source>.
function publisherFromItem(item) {
    const value = item.source;
    if (!value) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value._ === 'string') return value._.trim() || null;
    return null;
}

function toIso(value, fallback) {
    const time = Date.parse(value);
    return Number.isNaN(time) ? fallback.toISOString() : new Date(time).toISOString();
}

function normalizeItem(source, raw, now) {
    const url = normalizeUrl(raw.link || raw.guid);
    let title = stripHtml(raw.title);
    if (!url || !title) return null;

    const aggregated = source.kind === 'aggregator';
    let sourceName = source.name;
    if (aggregated) {
        const publisher = publisherFromItem(raw);
        if (publisher) {
            sourceName = publisher;
            const suffix = ` - ${publisher}`;
            if (title.endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
        }
    }

    return {
        key: sha1(url),
        url,
        title,
        // Aggregator summaries are a list of related headlines, not article text.
        snippet: aggregated ? '' : truncate(stripHtml(raw.contentSnippet || raw.summary || raw.content || ''), 600),
        publishedAt: toIso(raw.isoDate || raw.pubDate, now),
        image: extractImage(raw),
        sourceId: aggregated ? `${source.id}:${sha1(sourceName, 6)}` : source.id,
        sourceName,
        lean: aggregated ? null : source.lean || null,
        kind: source.kind || 'publisher',
        owner: aggregated ? null : source.owner || source.id,
        lang: source.lang,
        aggregated,
    };
}

async function fetchFeeds({ sources, parser, now = new Date(), maxAgeHours = 36, perSourceLimit = 8, concurrency = 8 }) {
    const cutoff = now.getTime() - maxAgeHours * 3_600_000;

    const settled = await mapPool(sources, concurrency, async source => {
        const started = Date.now();
        const feed = await parser.parseURL(source.url);
        return { feed, ms: Date.now() - started };
    });

    const health = [];
    const byKey = new Map();
    const seenTitles = new Set();

    settled.forEach((result, index) => {
        const source = sources[index];
        if (result.error) {
            health.push({ id: source.id, name: source.name, ok: false, count: 0, error: truncate(result.error.message || String(result.error), 120) });
            return;
        }

        const items = (result.value.feed.items || [])
            .map(raw => normalizeItem(source, raw, now))
            .filter(item => item && Date.parse(item.publishedAt) >= cutoff)
            .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
            .slice(0, perSourceLimit);

        let kept = 0;
        for (const item of items) {
            const titleKey = `${item.sourceId}|${normalizeTitle(item.title)}`;
            if (byKey.has(item.key) || seenTitles.has(titleKey)) continue;
            byKey.set(item.key, item);
            seenTitles.add(titleKey);
            kept += 1;
        }
        health.push({ id: source.id, name: source.name, ok: true, count: kept, ms: result.value.ms });
    });

    return { items: [...byKey.values()], health };
}

module.exports = { fetchFeeds, normalizeItem };
