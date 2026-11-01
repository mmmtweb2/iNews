const { stripHtml } = require('../lib/text');

// Article URLs come from third-party feeds, so treat them as untrusted: only
// public http(s) hosts are fetched. This blocks the obvious SSRF targets
// (localhost, private ranges, cloud metadata). It does not defend against DNS
// rebinding; if that matters in your deployment, fetch through an egress proxy.
function isPublicHttpUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        return false;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const [a, b] = host.split('.').map(Number);
        if (a === 0 || a === 10 || a === 127) return false;
        if (a === 169 && b === 254) return false;
        if (a === 172 && b >= 16 && b <= 31) return false;
        if (a === 192 && b === 168) return false;
    }
    if (host.includes(':') && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80'))) {
        return false;
    }
    return true;
}

function findKey(node, key, depth = 0) {
    if (!node || depth > 6) return null;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findKey(child, key, depth + 1);
            if (found) return found;
        }
        return null;
    }
    if (typeof node === 'object') {
        if (typeof node[key] === 'string' && node[key].length > 80) return node[key];
        for (const value of Object.values(node)) {
            const found = findKey(value, key, depth + 1);
            if (found) return found;
        }
    }
    return null;
}

function metaContent(html, property) {
    const forward = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
    const backward = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
    const match = html.match(forward) || html.match(backward);
    return match ? stripHtml(match[1]) : '';
}

// Pull a clean excerpt and a lead image out of an article page.
// Preference order for text: JSON-LD articleBody, then body paragraphs, then the
// page's own description. This is heuristic HTML handling, not a real parser.
function extractFromHtml(html, pageUrl) {
    let image = metaContent(html, 'og:image');
    if (image) {
        try {
            image = new URL(image, pageUrl).toString();
        } catch {
            image = null;
        }
    } else {
        image = null;
    }

    let body = '';
    for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            const found = findKey(JSON.parse(match[1]), 'articleBody');
            if (found) {
                body = stripHtml(found);
                break;
            }
        } catch {
            // malformed JSON-LD is common; try the next block
        }
    }

    if (!body) {
        body = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
            .map(match => stripHtml(match[1]))
            .filter(text => text.length > 40)
            .join(' ');
    }
    if (!body) body = metaContent(html, 'og:description') || metaContent(html, 'description');

    return { image, excerpt: body.slice(0, 900) };
}

async function readLimited(response, maxBytes) {
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
        size += value.length;
        if (size >= maxBytes) {
            await reader.cancel();
            break;
        }
    }
    return Buffer.concat(chunks).toString('utf8');
}

async function fetchArticleMeta(url, { fetchImpl = fetch, timeoutMs = 6000, maxBytes = 1_000_000 } = {}) {
    const empty = { image: null, excerpt: '' };
    if (!url || !isPublicHttpUrl(url)) return empty;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetchImpl(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; iNewsBot/2.0)',
                Accept: 'text/html,application/xhtml+xml',
            },
        });
        if (!response.ok) return empty;
        const type = response.headers.get('content-type') || '';
        if (type && !/html/i.test(type)) return empty;
        return extractFromHtml(await readLimited(response, maxBytes), url);
    } catch {
        return empty;
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { fetchArticleMeta, extractFromHtml, isPublicHttpUrl };
