require('dotenv').config();
const path = require('path');
const { createRuntime } = require('./src/bootstrap');
const { createApp } = require('./src/app');
const { createRefreshController } = require('./src/refresh');
const { seedDemo, createDemoRun } = require('./demo/seed');

const PORT = Number(process.env.PORT) || 3000;
const DEMO = process.env.DEMO_MODE === '1';

const runtime = createRuntime();
const { store } = runtime;

// News is fetched and written up only when a reader presses the refresh button (POST /api/refresh).
// There is no timer and no run at startup, so an idle site costs nothing.
const refresh = createRefreshController({
    store,
    run: DEMO ? createDemoRun(store) : runtime.runRefresh,
    available: DEMO || runtime.hasAi,
    minIntervalMs: DEMO ? 10_000 : (Number(process.env.REFRESH_MIN_INTERVAL_MIN) || 5) * 60_000,
    maxPerDay: Number(process.env.REFRESH_MAX_PER_DAY) || 24,
});

const app = createApp({
    store,
    refresh,
    adminToken: process.env.ADMIN_TOKEN || '',
    publicDir: path.join(__dirname, 'public'),
    demo: DEMO,
});

if (DEMO) {
    seedDemo(store);
    console.log('DEMO_MODE: serving fictional sample stories. The refresh button adds a few fictional follow-ups. No feeds are fetched and no AI calls are made.');
} else if (!runtime.hasAi) {
    console.warn('ANTHROPIC_API_KEY is not set: serving whatever is already stored. The refresh button is disabled.');
}

app.listen(PORT, () => {
    console.log(`iNews on :${PORT}  data=${runtime.dataDir}  model=${runtime.model || 'none'}${DEMO ? '  [demo]' : ''}`);
});
