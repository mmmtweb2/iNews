// Which parts of the (rated) Israeli media spectrum covered a story.
// Pure arithmetic over the source classification in config/sources.js; the AI is not involved.

const GROUP = { left: 'left', 'center-left': 'left', center: 'center', 'center-right': 'right', right: 'right' };
const POLITICAL_TOPICS = new Set(['politics', 'security', 'society']);

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

    return { counts, blindspot, sourceCount: seen.size };
}

module.exports = { computeCoverage };
