require('dotenv').config();
const path = require('path');
const cron = require('node-cron');
const { createRuntime } = require('./src/bootstrap');
const { createApp } = require('./src/app');
const { seedDemo } = require('./demo/seed');

const PORT = Number(process.env.PORT) || 3000;
const DEMO = process.env.DEMO_MODE === '1';
const REFRESH_CRON = process.env.REFRESH_CRON || '*/30 * * * *';
const STALE_AFTER_MS = 20 * 60 * 1000;

const runtime = createRuntime();
const { store } = runtime;

const app = createApp({
    store,
    runRefresh: runtime.runRefresh,
    isRefreshing: runtime.isRefreshing,
    adminToken: process.env.ADMIN_TOKEN || '',
    publicDir: path.join(__dirname, 'public'),
    demo: DEMO,
});

function refresh(reason) {
    runtime.runRefresh().catch(error => console.error(`refresh (${reason}) failed: ${error.message}`));
}

if (DEMO) {
    seedDemo(store);
    console.log('DEMO_MODE: serving fictional sample stories. No feeds are fetched and no AI calls are made.');
} else if (!runtime.hasAi) {
    console.warn('ANTHROPIC_API_KEY is not set: serving whatever is already stored and not refreshing.');
} else {
    const feed = store.read('stories.json', null);
    const age = feed && feed.generatedAt ? Date.now() - Date.parse(feed.generatedAt) : Infinity;
    if (age > STALE_AFTER_MS) refresh('startup');
    cron.schedule(REFRESH_CRON, () => refresh('schedule'));
}

app.listen(PORT, () => {
    console.log(`iNews on :${PORT}  data=${runtime.dataDir}  model=${runtime.model || 'none'}${DEMO ? '  [demo]' : ''}`);
});
