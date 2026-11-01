const { normalizeTitle, truncate } = require('../lib/text');

// Groups items that report the same event, across sources and across languages
// (an English TechCrunch headline and a Hebrew Geektime headline can be the same story).
// The model only sees titles, which keeps this step cheap; a deterministic
// token-overlap grouping takes over if the model call fails.

const GROUP_TOOL = {
    name: 'group_items',
    description: 'Return groups of item ids that report the same specific event.',
    input_schema: {
        type: 'object',
        properties: {
            groups: {
                type: 'array',
                description: 'Each group is a list of item ids about the same event. Items about different events must be in different groups.',
                items: { type: 'array', items: { type: 'integer' } },
            },
        },
        required: ['groups'],
    },
};

const SYSTEM = `You group news headlines by event.
Two headlines belong together only if they report the same specific event or development (same incident, same announcement, same ruling, same match, same data release).
Do NOT group items merely because they share a topic, a person, or a place.
When unsure, keep items apart: a missed merge is cheap, a wrong merge hides a separate story.
Headlines may be in Hebrew or English. Items you leave out are treated as standalone stories.`;

const MAX_GROUP_SIZE = 10;

const STOPWORDS = new Set(['של', 'על', 'עם', 'את', 'זה', 'זו', 'הוא', 'היא', 'לא', 'כי', 'אל', 'או', 'גם', 'כל', 'מה', 'בין', 'אחרי', 'לפני', 'the', 'and', 'for', 'with', 'after', 'over', 'that', 'this', 'from', 'says', 'will']);

function tokens(title) {
    return new Set(normalizeTitle(title).split(' ').filter(word => word.length >= 3 && !STOPWORDS.has(word)));
}

function similar(a, b) {
    let shared = 0;
    for (const word of a) if (b.has(word)) shared += 1;
    if (!shared) return false;
    const union = a.size + b.size - shared;
    return shared / union >= 0.5 || (shared >= 3 && shared / union >= 0.4);
}

// Deterministic fallback: single-linkage grouping by title token overlap, same language only.
function overlapGroups(reps, subset) {
    const ids = subset || reps.map((_, i) => i);
    const parent = new Map(ids.map(i => [i, i]));
    const find = i => (parent.get(i) === i ? i : (parent.set(i, find(parent.get(i))), parent.get(i)));
    const bags = new Map(ids.map(i => [i, tokens(reps[i][0].title)]));

    for (let x = 0; x < ids.length; x++) {
        for (let y = x + 1; y < ids.length; y++) {
            const a = ids[x];
            const b = ids[y];
            if (reps[a][0].lang !== reps[b][0].lang) continue;
            if (similar(bags.get(a), bags.get(b))) parent.set(find(a), find(b));
        }
    }

    const groups = new Map();
    for (const i of ids) {
        const root = find(i);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(i);
    }
    return [...groups.values()];
}

function sanitizeGroups(raw, count) {
    const seen = new Set();
    const groups = [];
    for (const group of Array.isArray(raw) ? raw : []) {
        if (!Array.isArray(group)) continue;
        const ids = [...new Set(group)].filter(i => Number.isInteger(i) && i >= 0 && i < count && !seen.has(i));
        ids.forEach(i => seen.add(i));
        if (ids.length) groups.push(ids);
    }
    for (let i = 0; i < count; i++) if (!seen.has(i)) groups.push([i]);
    return groups;
}

async function aiGroups(reps, ai) {
    const lines = reps.map((group, i) => {
        const head = group[0];
        return `${i}|${head.sourceName}|${truncate(head.title, 140)}`;
    });
    const raw = await ai.callTool({
        system: SYSTEM,
        user: `Items (id|source|headline):\n${lines.join('\n')}`,
        tool: GROUP_TOOL,
        maxTokens: 4000,
    });
    return sanitizeGroups(raw.groups, reps.length);
}

async function clusterItems({ items, ai, logger = console }) {
    // Identical normalized titles (4+ words) are the same story; no model needed.
    const reps = [];
    const byTitle = new Map();
    for (const item of items) {
        const title = normalizeTitle(item.title);
        const dedupable = title.split(' ').length >= 4;
        if (dedupable && byTitle.has(title)) {
            byTitle.get(title).push(item);
        } else {
            const group = [item];
            reps.push(group);
            if (dedupable) byTitle.set(title, group);
        }
    }

    let groups;
    try {
        groups = await aiGroups(reps, ai);
    } catch (error) {
        logger.warn(`cluster: model grouping failed (${error.message}); using token-overlap fallback`);
        groups = overlapGroups(reps);
    }

    // A group this large is almost certainly an over-merge; split it again by overlap.
    groups = groups.flatMap(group => (group.length > MAX_GROUP_SIZE ? overlapGroups(reps, group) : [group]));

    return groups.map(group => group.flatMap(i => reps[i]));
}

module.exports = { clusterItems, overlapGroups, sanitizeGroups };
