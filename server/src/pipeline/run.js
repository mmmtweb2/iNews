const { fetchFeeds } = require('./ingest');
const { clusterItems } = require('./cluster');
const { enrichCluster, pickMembers } = require('./enrich');
const { fetchArticleMeta } = require('./articleMeta');
const { computeCoverage } = require('./coverage');
const { sha1, readSeconds, mapPool } = require('../lib/text');

const DEFAULT_LIMITS = {
    maxAgeHours: 36,
    perSource: 8,
    maxClusterItems: 220,
    maxEnrich: 40,
    retentionHours: 48,
    maxStories: 150,
    metaConcurrency: 6,
    enrichConcurrency: 4,
    metaCacheDays: 3,
};

const byPublishedDesc = (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
const sameSet = (a, b) => a.length === b.length && a.every(value => b.includes(value));

function readTimes(story) {
    const { headline, oneLiner, bullets, whyItMatters, calmSummary } = story;
    const status = [...(story.known || []), ...(story.claimed || []), ...(story.unknown || [])];
    return {
        headline: readSeconds(headline, 1),
        short: readSeconds(`${headline} ${oneLiner}`, 2),
        full: readSeconds([headline, oneLiner, ...bullets, whyItMatters, ...status].join(' '), 3),
        calm: readSeconds(`${headline} ${calmSummary}`, 2),
    };
}

const MAX_TIMELINE = 8;

// How the story developed: one entry per published version, oldest first. It is built from our own
// earlier versions, so it costs no extra AI call. An identical rewrite replaces the last entry.
function buildTimeline(previous, enrichment, at) {
    const entry = { at, headline: enrichment.headline, summary: enrichment.oneLiner, note: enrichment.whatsNew || '' };
    if (!previous) return [entry];
    const history = Array.isArray(previous.timeline) && previous.timeline.length ? [...previous.timeline] : [{ at: previous.updatedAt, headline: previous.headline, summary: previous.oneLiner, note: '' }];
    const last = history[history.length - 1];
    if (last.headline === entry.headline && last.summary === entry.summary) history[history.length - 1] = { ...last, at };
    else history.push(entry);
    return history.slice(-MAX_TIMELINE);
}

function composeStory({ id, cluster, enrichment, previous, now, model }) {
    const sources = cluster
        .map(item => ({ key: item.key, id: item.sourceId, name: item.sourceName, lean: item.lean, kind: item.kind, owner: item.owner, url: item.url, title: item.title, publishedAt: item.publishedAt }))
        .sort(byPublishedDesc);
    const image = [...cluster]
        .sort(byPublishedDesc)
        .map(item => item.image)
        .find(url => typeof url === 'string' && url.startsWith('https://'));

    const story = {
        id,
        ...enrichment,
        primaryTopic: enrichment.topics[0],
        sources,
        coverage: computeCoverage(sources, enrichment.topics),
        publishedAt: sources[0].publishedAt,
        firstSeenAt: previous ? previous.firstSeenAt : now.toISOString(),
        updatedAt: now.toISOString(),
        timeline: buildTimeline(previous, enrichment, now.toISOString()),
        image: image || null,
        model,
    };
    story.readSec = readTimes(story);
    return story;
}

// One full refresh: fetch feeds -> group by event -> write up and score each story -> persist.
// Everything external is injected, so the whole run can be tested offline.
async function runPipeline({ store, ai, parser, sources, fetchMeta = fetchArticleMeta, logger = console, now = () => new Date(), limits = {}, onProgress = () => {} }) {
    const L = { ...DEFAULT_LIMITS, ...limits };
    const startedAt = now();
    const usageBefore = { ...(ai.usage || { calls: 0, inputTokens: 0, outputTokens: 0 }) };

    const run = { startedAt: startedAt.toISOString(), ok: false, sources: [], counts: {} };
    const finish = extra => {
        const finishedAt = now();
        Object.assign(run, extra, { finishedAt: finishedAt.toISOString(), durationMs: finishedAt - startedAt });
        const usage = ai.usage || usageBefore;
        run.usage = {
            calls: usage.calls - usageBefore.calls,
            inputTokens: usage.inputTokens - usageBefore.inputTokens,
            outputTokens: usage.outputTokens - usageBefore.outputTokens,
        };
        run.model = ai.model || null;
        const previousMeta = store.read('meta.json', {});
        store.write('meta.json', { lastRun: run, lastSuccessAt: run.ok ? run.finishedAt : previousMeta.lastSuccessAt || null });
        return run;
    };

    const previousFeed = store.read('stories.json', { stories: [] });
    const previousStories = Array.isArray(previousFeed.stories) ? previousFeed.stories : [];
    const previousById = new Map(previousStories.map(story => [story.id, story]));

    // 1. Ingest
    onProgress({ phase: 'ingest' });
    const { items: fetched, health } = await fetchFeeds({ sources, parser, now: startedAt, maxAgeHours: L.maxAgeHours, perSourceLimit: L.perSource });
    run.sources = health;
    if (!fetched.length) {
        logger.warn('run: no items from any source; keeping the previous feed');
        return finish({ error: 'no items from any source' });
    }
    const items = fetched.sort(byPublishedDesc).slice(0, L.maxClusterItems);

    // 2. Group items about the same event
    onProgress({ phase: 'cluster' });
    const clusters = await clusterItems({ items, ai, logger });

    // 3. Give each cluster a stable id by matching it to last run's stories (shared article URLs)
    const previousByKey = new Map();
    for (const story of previousStories) for (const source of story.sources) previousByKey.set(source.key, story.id);

    const plans = clusters.map(cluster => {
        const keys = cluster.map(item => item.key);
        const overlap = new Map();
        for (const key of keys) {
            const id = previousByKey.get(key);
            if (id) overlap.set(id, (overlap.get(id) || 0) + 1);
        }
        let best = null;
        for (const [id, count] of overlap) if (!best || count > best.count) best = { id, count };
        return { cluster, keys, matchId: best ? best.id : null, overlap: best ? best.count : 0 };
    });

    const claimed = new Set();
    [...plans]
        .sort((a, b) => b.overlap - a.overlap)
        .forEach(plan => {
            if (plan.matchId && !claimed.has(plan.matchId)) {
                plan.id = plan.matchId;
                claimed.add(plan.matchId);
            } else {
                const earliest = [...plan.cluster].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt))[0];
                plan.id = sha1(earliest.key);
            }
        });

    // 4. Reuse unchanged stories; queue the rest, most-covered and freshest first
    const published = [];
    const queue = [];
    for (const plan of plans) {
        const previous = previousById.get(plan.id);
        if (previous && sameSet(previous.sources.map(source => source.key), plan.keys)) {
            published.push(previous);
        } else {
            plan.previous = previous || null;
            queue.push(plan);
        }
    }
    const priority = plan => {
        const newest = Math.max(...plan.cluster.map(item => Date.parse(item.publishedAt)));
        return new Set(plan.cluster.map(item => item.sourceId)).size * 2 + newest / 3.6e9; // more outlets first, then fresher
    };
    queue.sort((a, b) => priority(b) - priority(a));
    const toEnrich = queue.slice(0, L.maxEnrich);
    const deferred = queue.slice(L.maxEnrich);
    for (const plan of deferred) if (plan.previous) published.push(plan.previous);

    // 5. Read the article pages we are about to summarize (cached between runs)
    const metaCache = store.read('articles.json', {});
    const metaCutoff = startedAt.getTime() - L.metaCacheDays * 86_400_000;
    for (const key of Object.keys(metaCache)) if (metaCache[key].at < metaCutoff) delete metaCache[key];

    const memberSets = toEnrich.map(plan => pickMembers(plan.cluster));
    const needMeta = [...new Map(memberSets.flat().filter(item => !item.aggregated && !metaCache[item.key]).map(item => [item.key, item])).values()];
    await mapPool(needMeta, L.metaConcurrency, async item => {
        const meta = await fetchMeta(item.url);
        metaCache[item.key] = { image: meta.image, excerpt: meta.excerpt, at: startedAt.getTime() };
    });
    for (const item of memberSets.flat()) {
        const meta = metaCache[item.key];
        if (!meta) continue;
        item.text = meta.excerpt || item.snippet;
        if (!item.image && meta.image) item.image = meta.image;
    }
    store.write('articles.json', metaCache);

    // 6. Write up and score
    let done = 0;
    onProgress({ phase: 'enrich', done, total: toEnrich.length });
    const results = await mapPool(toEnrich, L.enrichConcurrency, async plan => {
        const result = await enrichCluster({ cluster: plan.cluster, ai, previous: plan.previous });
        done += 1;
        onProgress({ phase: 'enrich', done, total: toEnrich.length });
        return result;
    });
    let enriched = 0;
    let failed = 0;
    results.forEach((result, index) => {
        const plan = toEnrich[index];
        if (result.error) {
            failed += 1;
            logger.warn(`run: enrichment failed for "${plan.cluster[0].title}": ${result.error.message}`);
            if (plan.previous) published.push(plan.previous); // keep the older write-up rather than lose the story
            return;
        }
        enriched += 1;
        published.push(composeStory({ id: plan.id, cluster: plan.cluster, enrichment: result.value.enrichment, previous: plan.previous, now: startedAt, model: ai.model || null }));
    });

    // 7. Retire stories this run superseded (their articles now belong to a different story)
    const currentKeys = new Set(plans.flatMap(plan => plan.keys));
    const publishedIds = new Set(published.map(story => story.id));
    for (const story of previousStories) {
        if (publishedIds.has(story.id)) continue;
        const superseded = story.sources.some(source => currentKeys.has(source.key));
        if (!superseded) published.push(story); // simply aged out of the feeds; keep until retention expires
    }

    const retentionCutoff = startedAt.getTime() - L.retentionHours * 3_600_000;
    const stories = published
        .filter(story => Date.parse(story.publishedAt) >= retentionCutoff)
        .sort(byPublishedDesc)
        .slice(0, L.maxStories);

    store.write('stories.json', { generatedAt: startedAt.toISOString(), stories });

    logger.log(`run: ${items.length} items -> ${clusters.length} stories, ${enriched} written up, ${failed} failed, ${stories.length} published`);
    return finish({
        ok: true,
        counts: { items: items.length, clusters: clusters.length, enriched, failed, reused: plans.length - queue.length, deferred: deferred.length, published: stories.length },
    });
}

module.exports = { runPipeline, readTimes, buildTimeline, DEFAULT_LIMITS };
