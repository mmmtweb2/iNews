const test = require('node:test');
const assert = require('node:assert/strict');
const { createRefreshController } = require('../src/refresh');
const { tempStore, silent } = require('./helpers');

const settle = () => new Promise(resolve => setTimeout(resolve, 10));

function make(options = {}) {
    const store = options.store || tempStore();
    let time = Date.parse('2026-11-09T10:00:00Z');
    const calls = [];
    const controller = createRefreshController({
        store,
        logger: silent,
        now: () => time,
        run: options.run || (async () => { calls.push(time); return { ok: true }; }),
        ...options.policy,
    });
    return { controller, store, calls, advance: ms => { time += ms; } };
}

test('a request starts a run; a second one during the run shares it', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let runs = 0;
    const c = createRefreshController({ store: tempStore(), logger: silent, run: async () => { runs += 1; await gate; return { ok: true }; } });
    assert.equal(c.request().status, 'started');
    assert.equal(c.request().status, 'running');
    assert.equal(c.status().running, true);
    release();
    await c.whenIdle();
    assert.equal(runs, 1);
    assert.equal(c.status().running, false);
});

test('the cooldown is shared and expires', async () => {
    const h = make({ policy: { minIntervalMs: 5 * 60_000 } });
    assert.equal(h.controller.request().status, 'started');
    await h.controller.whenIdle();
    const early = h.controller.request();
    assert.equal(early.status, 'fresh');
    assert.equal(early.retryAfterSec, 300);
    h.advance(4 * 60_000);
    assert.equal(h.controller.request().status, 'fresh');
    h.advance(61_000);
    assert.equal(h.controller.request().status, 'started');
    await h.controller.whenIdle();
    assert.equal(h.calls.length, 2);
});

test('a failed run allows a quicker retry', async () => {
    const h = make({ run: async () => ({ ok: false }), policy: { minIntervalMs: 5 * 60_000, failureCooldownMs: 60_000 } });
    h.controller.request();
    await h.controller.whenIdle();
    assert.equal(h.controller.request().status, 'fresh');
    h.advance(61_000);
    assert.equal(h.controller.request().status, 'started');
});

test('a run that throws is treated as a failure and does not break the controller', async () => {
    const h = make({ run: async () => { throw new Error('boom'); } });
    assert.equal(h.controller.request().status, 'started');
    await h.controller.whenIdle();
    assert.equal(h.controller.status().running, false);
});

test('the daily cap stops runs, resets the next UTC day, and survives a restart', async () => {
    const store = tempStore();
    const first = make({ store, policy: { minIntervalMs: 0, maxPerDay: 2 } });
    for (let i = 0; i < 2; i++) {
        assert.equal(first.controller.request().status, 'started');
        await first.controller.whenIdle();
    }
    assert.equal(first.controller.request().status, 'limit');
    assert.equal(first.controller.status().remainingToday, 0);

    // a new controller on the same store (a restart) still sees the count
    const restarted = make({ store, policy: { minIntervalMs: 0, maxPerDay: 2 } });
    assert.equal(restarted.controller.request().status, 'limit');

    restarted.advance(24 * 3_600_000);
    assert.equal(restarted.controller.request().status, 'started');
});

test('force skips the cooldown and the cap', async () => {
    const h = make({ policy: { maxPerDay: 1 } });
    h.controller.request();
    await h.controller.whenIdle();
    assert.equal(h.controller.request().status, 'fresh');
    assert.equal(h.controller.request({ force: true }).status, 'started');
});

test('unavailable when there is no AI key', () => {
    const h = make({ policy: { available: false } });
    assert.equal(h.controller.request().status, 'unavailable');
});

test('progress reported by the run is exposed while it is running', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const c = createRefreshController({ store: tempStore(), logger: silent, run: async report => { report({ phase: 'enrich', done: 3, total: 10 }); await gate; return { ok: true }; } });
    c.request();
    await settle();
    assert.deepEqual(c.status().progress, { phase: 'enrich', done: 3, total: 10 });
    release();
    await c.whenIdle();
    assert.equal(c.status().progress, null);
});
