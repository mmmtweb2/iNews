const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const Parser = require('rss-parser');
const { Store } = require('./store');
const { createAi } = require('./lib/ai');
const { SOURCES } = require('./config/sources');
const { runPipeline } = require('./pipeline/run');

// Known-good model from the previous version. Override with AI_MODEL to try a newer one.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function createRuntime(env = process.env, logger = console) {
    const dataDir = path.resolve(env.DATA_DIR || path.join(__dirname, '..', 'data'));
    const store = new Store(dataDir);

    let ai = null;
    if (env.ANTHROPIC_API_KEY) {
        ai = createAi({ client: new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }), model: env.AI_MODEL || DEFAULT_MODEL });
    }

    const parser = new Parser({
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; iNewsBot/2.0)' },
        customFields: { item: ['media:content', 'media:thumbnail', 'content:encoded', 'source'] },
        timeout: 10000, // one unresponsive site must not stall the whole refresh
    });

    // One full pipeline run. Never called on a timer: the refresh controller starts it when a reader asks.
    function runRefresh(onProgress) {
        if (!ai) return Promise.reject(new Error('ANTHROPIC_API_KEY is not set'));
        return runPipeline({ store, ai, parser, sources: SOURCES, logger, onProgress });
    }

    return { store, dataDir, hasAi: Boolean(ai), model: ai ? ai.model : null, runRefresh };
}

module.exports = { createRuntime, DEFAULT_MODEL };
