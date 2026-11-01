// Which parts of the (rated) Israeli media spectrum covered a story.
// Pure arithmetic over the source classification in config/sources.js; the AI is not involved.

const GROUP = { left: 'left', 'center-left': 'left', center: 'center', 'center-right': 'right', right: 'right' };
const POLITICAL_TOPICS = new Set(['politics', 'security', 'society']);

// How many distinct media organisations reported a story. Outlets under one
// owner (e.g. ynet and Calcalist) count once, and a publisher that reached us
// through an aggregator does not count twice if we also follow it directly.
// This measures breadth of reporting, not truth: outlets copy each other and
// wire services, so the interface says "reported by", never "verified".
function computeConfidence(sources) {
    const direct = sources.filter(source => source.kind !== 'aggregator' && !source.id.includes(':'));
    const directNames = new Set(direct.map(source => String(source.name || '').trim().toLowerCase()));
    const owners = new Set();
    let official = false;

    for (const source of sources) {
        if (source.kind === 'official') official = true;
        const name = String(source.name || '').trim().toLowerCase();
        const viaAggregator = source.id.includes(':');
        if (viaAggregator && directNames.has(name)) continue;
        owners.add(viaAggregator ? `name:${name}` : source.owner || source.id);
    }
    return { level: owners.size >= 2 ? 'multi' : 'single', owners: owners.size, official };
}

function computeCoverage(sources, topics) {
    const counts = { left: 0, center: 0, right: 0, unrated: 0 };
    const seen = new Set();

    for (const source of sources) {
        if (seen.has(source.id)) continue;
        seen.add(source.id);
        const group = GROUP[source.lean];
        if (group) counts[group] += 1;
        else counts.unrated += 1;
    }

    // "Blind spot": a political story reported only by outlets on one side.
    // `blindspot` is the side that did NOT report it, within the sources we monitor.
    const rated = ['left', 'center', 'right'].filter(group => counts[group] > 0);
    let blindspot = null;
    if (topics.some(topic => POLITICAL_TOPICS.has(topic)) && rated.length === 1 && rated[0] !== 'center') {
        blindspot = rated[0] === 'left' ? 'right' : 'left';
    }

    return { counts, blindspot, sourceCount: seen.size, confidence: computeConfidence(sources) };
}

module.exports = { computeCoverage, computeConfidence };
