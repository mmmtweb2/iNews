const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDemoStories } = require('../demo/seed');
const { TOPIC_IDS } = require('../src/config/topics');

const stories = buildDemoStories(new Date('2026-11-01T12:00:00Z'));

test('demo stories follow the production story schema', () => {
    assert.equal(new Set(stories.map(s => s.id)).size, stories.length);
    for (const s of stories) {
        assert.ok(s.headline && s.calmSummary, s.id);
        assert.ok(s.topics.length >= 1 && s.topics.every(t => TOPIC_IDS.has(t)), s.id);
        assert.equal(s.primaryTopic, s.topics[0]);
        for (const field of ['intensity', 'importance', 'sourceHeat']) assert.ok(s[field] >= 1 && s[field] <= 5, `${s.id} ${field}`);
        assert.ok(s.sources.length >= 1);
        assert.ok(s.readSec.headline > 0 && s.readSec.short >= s.readSec.headline && s.readSec.full >= s.readSec.short && s.readSec.calm > 0, s.id);
        assert.equal(s.coverage.sourceCount, new Set(s.sources.map(x => x.id)).size);
    }
});

test('demo stories are newest first', () => {
    const times = stories.map(s => Date.parse(s.publishedAt));
    assert.deepEqual([...times].sort((a, b) => b - a), times);
});

test('demo data covers every state the interface has to handle', () => {
    assert.ok(stories.some(s => s.coverage.blindspot === 'left'), 'blind spot (left)');
    assert.ok(stories.some(s => s.coverage.blindspot === 'right'), 'blind spot (right)');
    assert.ok(stories.some(s => s.graphic), 'graphic');
    assert.ok(stories.some(s => s.contested), 'contested');
    assert.ok(stories.some(s => s.framing.length >= 2), 'framing');
    assert.ok(stories.some(s => s.sourceHeat >= s.intensity + 2), 'inflated headline');
    assert.ok(stories.some(s => s.intensity >= 4 && s.importance >= 4), 'heavy but important');
    assert.ok(stories.some(s => s.intensity >= 4 && s.importance < 4), 'heavy and minor');
    assert.ok(stories.some(s => s.importance === 5), 'top importance');
    assert.ok(stories.some(s => s.sources.length === 1), 'single source');
    const topics = new Set(stories.map(s => s.primaryTopic));
    assert.equal(topics.size, TOPIC_IDS.size);
});
