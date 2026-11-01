const test = require('node:test');
const assert = require('node:assert/strict');
const { isPublicHttpUrl, extractFromHtml, fetchArticleMeta } = require('../src/pipeline/articleMeta');

test('only public http(s) URLs are fetched', () => {
    for (const url of ['https://example.com/a', 'http://news.site/x?y=1']) assert.equal(isPublicHttpUrl(url), true, url);
    for (const url of ['http://localhost:3000', 'http://127.0.0.1/x', 'http://10.0.0.5', 'http://192.168.1.2', 'http://172.20.0.1', 'http://169.254.169.254/latest', 'http://[::1]/', 'http://printer.local', 'file:///etc/passwd', 'ftp://x.com', 'nope']) {
        assert.equal(isPublicHttpUrl(url), false, url);
    }
});

const longText = 'זהו משפט ארוך מספיק כדי להיחשב כפסקה אמיתית בכתבה ולא כתפריט ניווט.';

test('extractFromHtml prefers JSON-LD articleBody and resolves relative image URLs', () => {
    const body = 'גוף הכתבה המלא מופיע כאן בתוך נתוני JSON-LD ויש בו מספיק טקסט כדי לעבור את הסף של שמונים תווים לפחות.';
    const html = `<html><head><meta property="og:image" content="/img/lead.jpg"><script type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': 'NewsArticle', articleBody: body }] })}</script></head><body><p>${longText}</p></body></html>`;
    const result = extractFromHtml(html, 'https://news.example/story/1');
    assert.equal(result.image, 'https://news.example/img/lead.jpg');
    assert.equal(result.excerpt, body);
});

test('extractFromHtml falls back to long paragraphs, then to the page description', () => {
    const paragraphs = extractFromHtml(`<body><p>קצר</p><p>${longText}</p></body>`, 'https://x.com');
    assert.equal(paragraphs.excerpt, longText);
    assert.equal(paragraphs.image, null);

    const description = extractFromHtml('<head><meta name="description" content="תיאור קצר של העמוד"></head><body><p>x</p></body>', 'https://x.com');
    assert.equal(description.excerpt, 'תיאור קצר של העמוד');
});

test('extractFromHtml survives malformed JSON-LD', () => {
    const html = `<script type="application/ld+json">{not json</script><p>${longText}</p>`;
    assert.equal(extractFromHtml(html, 'https://x.com').excerpt, longText);
});

test('fetchArticleMeta reads HTML pages, and ignores other content types, errors and private hosts', async () => {
    const page = `<head><meta property="og:image" content="https://cdn.x/i.jpg"></head><p>${longText}</p>`;
    const ok = await fetchArticleMeta('https://example.com/a', { fetchImpl: async () => new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8' } }) });
    assert.equal(ok.image, 'https://cdn.x/i.jpg');
    assert.equal(ok.excerpt, longText);

    const pdf = await fetchArticleMeta('https://example.com/a', { fetchImpl: async () => new Response('%PDF', { headers: { 'content-type': 'application/pdf' } }) });
    assert.deepEqual(pdf, { image: null, excerpt: '' });

    const failing = await fetchArticleMeta('https://example.com/a', { fetchImpl: async () => { throw new Error('network'); } });
    assert.deepEqual(failing, { image: null, excerpt: '' });

    let called = false;
    const blocked = await fetchArticleMeta('http://169.254.169.254/latest', { fetchImpl: async () => { called = true; return new Response(''); } });
    assert.deepEqual(blocked, { image: null, excerpt: '' });
    assert.equal(called, false);
});

test('fetchArticleMeta stops reading oversized pages', async () => {
    const huge = `<p>${longText}</p>` + 'x'.repeat(3_000_000);
    const result = await fetchArticleMeta('https://example.com/a', { maxBytes: 5000, fetchImpl: async () => new Response(huge, { headers: { 'content-type': 'text/html' } }) });
    assert.equal(result.excerpt, longText);
});
