const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../src/app');
const { seedDemo } = require('../demo/seed');
const { createRefreshController } = require('../src/refresh');
const { tempStore, silent } = require('./helpers');

async function serve(options = {}) {
    const store = options.store || tempStore();
    if (options.seed !== false) seedDemo(store);
    const refresh = options.refresh || createRefreshController({ store, run: options.run || (async () => ({ ok: true })), logger: silent, ...(options.policy || {}) });
    const app = createApp({ store, refresh, logger: silent, ...options });
    const server = await new Promise(resolve => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)), store };
}

test('GET /api/feed returns topics, sources, labels and stories, with security headers', async () => {
    const s = await serve({ demo: true });
    try {
        const res = await fetch(`${s.base}/api/feed`);
        const body = await res.json();
        assert.equal(res.status, 200);
        assert.equal(body.demo, true);
        assert.equal(body.refreshing, false);
        assert.ok(body.generatedAt);
        assert.ok(body.topics.some(t => t.id === 'tech' && t.label));
        assert.equal(body.leanLabels.right, 'ימין');
        assert.ok(body.sources.length > 5);
        assert.ok(body.stories.length >= 20);
        assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(res.headers.get('x-powered-by'), null);
    } finally {
        await s.close();
    }
});

test('GET /api/feed on an empty store returns an empty, valid feed', async () => {
    const s = await serve({ seed: false });
    try {
        const body = await (await fetch(`${s.base}/api/feed`)).json();
        assert.deepEqual(body.stories, []);
        assert.equal(body.generatedAt, null);
    } finally {
        await s.close();
    }
});

test('POST /api/refresh starts one run, shares it, then answers "fresh" inside the cooldown', async () => {
    let started = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const s = await serve({ run: async () => { started += 1; await gate; return { ok: true }; } });
    try {
        const first = await fetch(`${s.base}/api/refresh`, { method: 'POST' });
        assert.equal(first.status, 202);
        assert.equal((await first.json()).status, 'started');

        const second = await fetch(`${s.base}/api/refresh`, { method: 'POST' });
        assert.equal((await second.json()).status, 'running');
        assert.equal(started, 1);

        const state = await (await fetch(`${s.base}/api/refresh`)).json();
        assert.equal(state.running, true);

        release();
        await new Promise(resolve => setTimeout(resolve, 20));
        const after = await fetch(`${s.base}/api/refresh`, { method: 'POST' });
        const body = await after.json();
        assert.equal(after.status, 200);
        assert.equal(body.status, 'fresh');
        assert.ok(body.nextAllowedAt);
        assert.ok(Number(after.headers.get('retry-after')) > 0);
        assert.equal(started, 1);
    } finally {
        await s.close();
    }
});

test('POST /api/refresh reports unavailable when there is no AI key, and the daily limit as 429', async () => {
    const off = await serve({ refresh: createRefreshController({ store: tempStore(), run: async () => ({ ok: true }), available: false, logger: silent }) });
    try {
        assert.equal((await fetch(`${off.base}/api/refresh`, { method: 'POST' })).status, 503);
    } finally {
        await off.close();
    }

    const capped = await serve({ policy: { maxPerDay: 0 } });
    try {
        assert.equal((await fetch(`${capped.base}/api/refresh`, { method: 'POST' })).status, 429);
    } finally {
        await capped.close();
    }
});

test('the feed is revalidated, never cached for a minute', async () => {
    const s = await serve();
    try {
        assert.equal((await fetch(`${s.base}/api/feed`)).headers.get('cache-control'), 'no-cache');
    } finally {
        await s.close();
    }
});

test('the admin refresh endpoint is invisible without a token, checked with one, and skips the cooldown', async () => {
    let started = 0;
    const off = await serve({ run: async () => { started += 1; return { ok: true }; } });
    try {
        assert.equal((await fetch(`${off.base}/api/admin/refresh`, { method: 'POST' })).status, 404);
    } finally {
        await off.close();
    }

    const on = await serve({ adminToken: 's3cret', run: async () => { started += 1; return { ok: true }; } });
    try {
        assert.equal((await fetch(`${on.base}/api/admin/refresh`, { method: 'POST' })).status, 401);
        assert.equal((await fetch(`${on.base}/api/admin/refresh`, { method: 'POST', headers: { 'x-admin-token': 'wrong' } })).status, 401);
        const ok = await fetch(`${on.base}/api/admin/refresh`, { method: 'POST', headers: { 'x-admin-token': 's3cret' } });
        assert.equal(ok.status, 202);
        assert.equal((await ok.json()).status, 'started');
        await new Promise(resolve => setTimeout(resolve, 20));
        // the public button is now in cooldown, the admin is not
        assert.equal((await (await fetch(`${on.base}/api/refresh`, { method: 'POST' })).json()).status, 'fresh');
        const again = await fetch(`${on.base}/api/admin/refresh`, { method: 'POST', headers: { 'x-admin-token': 's3cret' } });
        assert.equal((await again.json()).status, 'started');
        assert.equal(started, 2);
    } finally {
        await on.close();
    }
});

test('the API is rate limited per client', async () => {
    const s = await serve({ rateLimit: { windowMs: 60_000, max: 3 } });
    try {
        const statuses = [];
        for (let i = 0; i < 5; i++) statuses.push((await fetch(`${s.base}/api/status`)).status);
        assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
    } finally {
        await s.close();
    }
});

test('GET /api/status reports the latest run', async () => {
    const store = tempStore();
    seedDemo(store);
    store.write('meta.json', { lastRun: { ok: true, sources: [{ id: 'a', ok: false, error: 'x' }] }, lastSuccessAt: '2026-11-01T10:00:00Z' });
    const s = await serve({ store, seed: false });
    try {
        const body = await (await fetch(`${s.base}/api/status`)).json();
        assert.equal(body.lastSuccessAt, '2026-11-01T10:00:00Z');
        assert.equal(body.lastRun.sources[0].ok, false);
        assert.ok(body.storyCount > 0);
    } finally {
        await s.close();
    }
});

test('the built client is served with a single-page fallback, and unknown API routes are JSON 404s', async () => {
    const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inews-public-'));
    fs.mkdirSync(path.join(publicDir, 'assets'));
    fs.writeFileSync(path.join(publicDir, 'index.html'), '<!doctype html><title>shell</title>');
    fs.writeFileSync(path.join(publicDir, 'assets', 'app-abc123.js'), 'console.log(1)');
    const s = await serve({ publicDir });
    try {
        const shell = await fetch(`${s.base}/some/client/route`);
        assert.equal(shell.status, 200);
        assert.match(await shell.text(), /shell/);
        assert.equal(shell.headers.get('cache-control'), 'no-cache');

        const asset = await fetch(`${s.base}/assets/app-abc123.js`);
        assert.match(asset.headers.get('cache-control'), /immutable/);

        const missing = await fetch(`${s.base}/api/nope`);
        assert.equal(missing.status, 404);
        assert.deepEqual(await missing.json(), { error: 'not_found' });
    } finally {
        await s.close();
    }
});
