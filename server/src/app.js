const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { TOPICS } = require('./config/topics');
const { SOURCES, LEAN_LABELS } = require('./config/sources');

function safeEqual(a, b) {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

const CSP = [
    "default-src 'self'",
    "img-src 'self' https: data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "font-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
].join('; ');

function securityHeaders(req, res, next) {
    res.set({
        'Content-Security-Policy': CSP,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    next();
}

// Per-IP fixed-window limiter. In memory, so it resets on restart and is per instance.
function rateLimiter({ windowMs, max }) {
    const hits = new Map();
    const sweep = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
    }, windowMs);
    sweep.unref();

    return (req, res, next) => {
        const now = Date.now();
        let entry = hits.get(req.ip);
        if (!entry || entry.reset <= now) {
            entry = { count: 0, reset: now + windowMs };
            hits.set(req.ip, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
            return res.status(429).json({ error: 'rate_limited' });
        }
        next();
    };
}

// What the reader's transparency page may show about our sources.
function publicSources() {
    const publishers = SOURCES.filter(source => source.kind === 'publisher').map(({ id, name, lang, lean, audience }) => ({ id, name, lang, lean, audience: audience || null, kind: 'publisher' }));
    return [...publishers, { id: 'aggregator', name: 'Google News', lang: 'he', lean: null, kind: 'aggregator' }];
}

function createApp({ store, refresh, adminToken = '', publicDir = null, demo = false, logger = console, rateLimit = { windowMs: 60_000, max: 120 } }) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);
    app.use(securityHeaders);

    app.get('/healthz', (req, res) => res.json({ ok: true }));

    app.use('/api', cors({ methods: ['GET'] }), rateLimiter(rateLimit));
    const refreshLimiter = rateLimiter({ windowMs: 60_000, max: 6 });

    // The feed only changes when a reader presses refresh, so always revalidate (a cheap file read).
    app.get('/api/feed', (req, res) => {
        const feed = store.read('stories.json', { generatedAt: null, stories: [] });
        res.set('Cache-Control', 'no-cache');
        res.json({
            demo,
            generatedAt: feed.generatedAt || null,
            refreshing: refresh.status().running,
            topics: TOPICS.map(({ id, label }) => ({ id, label })),
            leanLabels: LEAN_LABELS,
            sources: publicSources(),
            stories: feed.stories || [],
        });
    });

    // Source health from the latest run: use it to prune feeds that keep failing.
    app.get('/api/status', (req, res) => {
        const feed = store.read('stories.json', { generatedAt: null, stories: [] });
        const meta = store.read('meta.json', {});
        res.json({ demo, generatedAt: feed.generatedAt || null, storyCount: (feed.stories || []).length, lastSuccessAt: meta.lastSuccessAt || null, lastRun: meta.lastRun || null });
    });

    // What the refresh button needs: is a run going, how far along, and when may the next one start.
    const view = result => ({
        status: result.status,
        running: result.running,
        progress: result.progress,
        nextAllowedAt: result.nextAllowedAt,
        retryAfterSec: result.retryAfterSec || null,
        remainingToday: result.remainingToday,
    });
    const HTTP = { started: 202, running: 202, fresh: 200, limit: 429, unavailable: 503 };

    app.get('/api/refresh', (req, res) => {
        res.set('Cache-Control', 'no-store');
        res.json(view({ status: refresh.status().running ? 'running' : 'idle', ...refresh.status() }));
    });

    // Public on purpose: this is the refresh button. Safe because the controller allows one run at a time,
    // shares a cooldown between all readers, and stops at a daily cap, so repeated calls cost nothing.
    app.post('/api/refresh', refreshLimiter, (req, res) => {
        const result = refresh.request();
        if (result.retryAfterSec) res.set('Retry-After', String(result.retryAfterSec));
        res.set('Cache-Control', 'no-store');
        res.status(HTTP[result.status] || 200).json(view(result));
    });

    // Disabled unless ADMIN_TOKEN is set. Skips the cooldown and the daily cap.
    app.post('/api/admin/refresh', (req, res) => {
        if (!adminToken) return res.status(404).json({ error: 'not_found' });
        if (!safeEqual(req.get('x-admin-token') || '', adminToken)) return res.status(401).json({ error: 'unauthorized' });
        const result = refresh.request({ force: true });
        res.status(HTTP[result.status] || 200).json(view(result));
    });

    app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

    if (publicDir && fs.existsSync(path.join(publicDir, 'index.html'))) {
        app.use(
            express.static(publicDir, {
                index: false,
                setHeaders(res, file) {
                    if (file.includes(`${path.sep}assets${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
                    else res.set('Cache-Control', 'no-cache');
                },
            }),
        );
        // Single-page app: any other GET serves the shell.
        app.use((req, res, next) => {
            if (req.method !== 'GET') return next();
            res.set('Cache-Control', 'no-cache');
            res.sendFile(path.join(publicDir, 'index.html'));
        });
    }

    return app;
}

module.exports = { createApp };
