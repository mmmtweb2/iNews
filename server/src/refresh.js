// Refreshing is the only thing that costs AI money, so it happens only when a reader asks.
// This controller is the single gate: one run at a time, a shared cooldown, and a daily cap.
// The counters live in DATA_DIR, so restarting the server does not reset them.

const DEFAULTS = {
    minIntervalMs: 5 * 60_000, // shared by all readers: a second click inside this window reuses the fresh data
    failureCooldownMs: 60_000, // after a failed run, allow a retry sooner
    maxPerDay: 24, // UTC day, counts runs that started
};

function createRefreshController({ store, run, available = true, now = () => Date.now(), logger = console, ...overrides }) {
    const policy = { ...DEFAULTS, ...overrides };
    let running = null;
    let progress = null;

    const readLog = () => store.read('refresh-log.json', {});
    const dayOf = time => new Date(time).toISOString().slice(0, 10);

    function status() {
        const time = now();
        const log = readLog();
        const used = log.day === dayOf(time) ? log.count || 0 : 0;
        const cooldown = log.lastOk === false ? Math.min(policy.failureCooldownMs, policy.minIntervalMs) : policy.minIntervalMs;
        const next = log.lastStartedAt ? Date.parse(log.lastStartedAt) + cooldown : 0;
        return {
            available,
            running: running !== null,
            progress,
            nextAllowedAt: next > time ? new Date(next).toISOString() : null,
            remainingToday: Math.max(0, policy.maxPerDay - used),
        };
    }

    // force skips cooldown and cap. Only the admin endpoint passes it.
    function request({ force = false } = {}) {
        if (!available) return { status: 'unavailable', ...status() };
        if (running) return { status: 'running', ...status() };

        const time = now();
        const current = status();
        if (!force) {
            if (current.nextAllowedAt) return { status: 'fresh', ...current, retryAfterSec: Math.ceil((Date.parse(current.nextAllowedAt) - time) / 1000) };
            if (current.remainingToday <= 0) return { status: 'limit', ...current };
        }

        const log = readLog();
        const day = dayOf(time);
        store.write('refresh-log.json', { day, count: (log.day === day ? log.count || 0 : 0) + 1, lastStartedAt: new Date(time).toISOString(), lastOk: log.lastOk ?? null });

        progress = null;
        running = Promise.resolve()
            .then(() => run(update => { progress = update }))
            .then(result => !(result && result.ok === false))
            .catch(error => {
                logger.error(`refresh failed: ${error.message}`);
                return false;
            })
            .then(ok => {
                store.write('refresh-log.json', { ...readLog(), lastOk: ok });
            })
            .finally(() => {
                running = null;
                progress = null;
            });
        return { status: 'started', ...status() };
    }

    return { request, status, whenIdle: () => running || Promise.resolve() };
}

module.exports = { createRefreshController, DEFAULTS };
