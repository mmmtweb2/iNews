// Turns the day's stories plus the reader's settings into a brief that fits the
// time they have and the level of intensity they chose. Pure functions, no React,
// so the rules are easy to test and to change.
//
// Principles:
//  - The reader's five style dials (see dials.js) shape the brief: tone, density, prominence,
//    focus and freshness. The middle position of every dial is the original behaviour.
//  - Intensity filters what is shown, but it never hides important news.
//    A heavy story that matters (importance >= 4) is shown in a calm rewrite instead.
//  - Prominence moves smaller stories to "more stories"; it never deletes them.
//  - A muted topic stays muted, except for the very biggest developments (importance 5)
//    or anything matching a keyword the reader asked to follow.
//  - Everything that was left out is returned, so the interface can say so.

import {
  DEFAULT_DIALS, DENSITY, FOLLOW_MULTIPLIER, FRESHNESS_MAX, IMPORTANCE_WEIGHT, MIN_IMPORTANCE, OFF_TOPIC_PENALTY,
  TONE_ALLOWS_GRAPHIC, TONE_CAP, TONE_INTENSITY_WEIGHT, TOPIC_REPEAT_PENALTY, sanitizeDials,
} from './dials.js';

const DEPTH_ORDER = ['headline', 'short', 'full'];

const lower = value => String(value || '').toLowerCase();

const dialsOf = prefs => (prefs && prefs.dials ? sanitizeDials(prefs.dials) : DEFAULT_DIALS);

// The highest intensity a story may have to be shown as it is (heavier ones get a calm rewrite or are filtered).
export const toneCap = dials => TONE_CAP[dialsOf({ dials }).tone];

export function matchesKeywords(story, keywords) {
  if (!keywords || !keywords.length) return false;
  const haystack = lower([story.headline, story.oneLiner, ...(story.entities || [])].join(' '));
  return keywords.some(word => word && haystack.includes(lower(word)));
}

export function scoreStory(story, prefs, now) {
  const dials = dialsOf(prefs);
  const topics = prefs.topics || {};
  const followed = Object.values(topics).includes('follow');
  const primaryFollowed = topics[story.primaryTopic] === 'follow';
  const secondaryFollowed = (story.topics || []).slice(1).some(id => topics[id] === 'follow');
  const keyword = matchesKeywords(story, prefs.keywords);

  let score = story.importance * IMPORTANCE_WEIGHT[dials.prominence];
  if (primaryFollowed) score += 4 * FOLLOW_MULTIPLIER[dials.focus];
  else if (secondaryFollowed) score += 2 * FOLLOW_MULTIPLIER[dials.focus];
  else if (followed && !keyword) score -= OFF_TOPIC_PENALTY[dials.focus];
  if (keyword) score += 5;
  score += Math.min(story.sources.length, 4) * 0.7; // several outlets reporting it is a signal
  const hours = Math.max(0, (now - Date.parse(story.publishedAt)) / 3_600_000);
  score += FRESHNESS_MAX[dials.freshness] * Math.max(0, 1 - hours / 18); // the bonus fades over 18 hours
  score += story.intensity * TONE_INTENSITY_WEIGHT[dials.tone]; // small lean toward calmer (or, at the far end, heavier) stories
  return score;
}

function costOf(entry, depth) {
  return entry.tone === 'calm' ? entry.story.readSec.calm : entry.story.readSec[depth];
}

// Orders stories by score, and when asked to, spreads a single topic out so one topic does not fill the whole brief.
function order(entries, penalty) {
  const base = [...entries].sort((a, b) => b.score - a.score || Date.parse(b.story.publishedAt) - Date.parse(a.story.publishedAt) || a.story.id.localeCompare(b.story.id));
  if (!penalty) return base;
  const taken = new Map();
  const result = [];
  const pool = [...base];
  while (pool.length) {
    let best = 0;
    let bestScore = -Infinity;
    pool.forEach((entry, index) => {
      const adjusted = entry.score - (taken.get(entry.story.primaryTopic) || 0) * penalty;
      if (adjusted > bestScore) { best = index; bestScore = adjusted; }
    });
    const [entry] = pool.splice(best, 1);
    taken.set(entry.story.primaryTopic, (taken.get(entry.story.primaryTopic) || 0) + 1);
    result.push(entry);
  }
  return result;
}

// What changed for this reader since they last read: ctx.seen maps story id -> updatedAt as it was when they read it.
function changeOf(story, seen) {
  if (!seen) return null;
  if (!seen.has(story.id)) return 'new';
  return seen.get(story.id) !== story.updatedAt ? 'updated' : null;
}

export function buildBriefing(stories, prefs, now = Date.now(), ctx = {}) {
  const dials = dialsOf(prefs);
  const cap = TONE_CAP[dials.tone];
  const allowGraphic = TONE_ALLOWS_GRAPHIC[dials.tone];
  const density = DENSITY[dials.density];
  const minImportance = MIN_IMPORTANCE[dials.prominence];
  const hidden = new Set(prefs.hidden || []);
  const topics = prefs.topics || {};

  const candidates = [];
  const filtered = [];
  const muted = [];
  const below = [];

  for (const story of stories) {
    if (hidden.has(story.id)) continue;

    const keyword = matchesKeywords(story, prefs.keywords);
    const topicMuted = topics[story.primaryTopic] === 'mute' && story.importance < 5 && !keyword;
    if (topicMuted) {
      muted.push(story);
      continue;
    }

    const tooHeavy = story.intensity > cap || (story.graphic && !allowGraphic);
    let entry;
    if (!tooHeavy) entry = { story, tone: 'normal' };
    else if (story.importance >= 4) entry = { story, tone: 'calm' };
    else {
      filtered.push(story);
      continue;
    }

    // Stories under the prominence bar wait in "more stories", unless the reader follows them.
    const followed = keyword || topics[story.primaryTopic] === 'follow';
    if (story.importance < minImportance && !followed) below.push(entry);
    else candidates.push(entry);
  }

  const ranked = order(candidates.map(entry => ({ ...entry, score: scoreStory(entry.story, prefs, now) })), TOPIC_REPEAT_PENALTY[dials.focus]);

  const unlimited = !(prefs.minutes > 0);
  const budgetSec = unlimited ? Infinity : prefs.minutes * 60;
  const maxItems = unlimited ? Math.ceil((density.maxItems * 4) / 3) : density.maxItems; // with no time limit the brief may run a third longer

  // Pass 1: add stories in rank order at the density's base depth, stepping down a level when time is short.
  let used = 0;
  const chosen = [];
  const leftovers = [];
  ranked.forEach((entry, rank) => { entry.rank = rank; });
  for (const entry of ranked) {
    let depth = entry.tone === 'calm' ? 'calm' : density.base;
    let cost = costOf(entry, depth);
    if (entry.tone === 'normal') {
      let level = DEPTH_ORDER.indexOf(depth);
      while (chosen.length > 0 && used + cost > budgetSec && level > 0) {
        level -= 1;
        depth = DEPTH_ORDER[level];
        cost = costOf(entry, depth);
      }
    }
    if (chosen.length < maxItems && (chosen.length === 0 || used + cost <= budgetSec)) {
      chosen.push({ ...entry, depth, planned: depth === density.base });
      used += cost;
    } else {
      leftovers.push(entry);
    }
  }

  // Pass 2: headline-only entries for stories that still fit in the leftover time.
  const overflow = [];
  for (const entry of leftovers) {
    const cost = entry.story.readSec.headline;
    if (density.headlines && entry.tone === 'normal' && chosen.length < maxItems && used + cost <= budgetSec) {
      chosen.push({ ...entry, depth: 'headline', planned: false });
      used += cost;
    } else {
      overflow.push(entry);
    }
  }

  // Pass 3: spend whatever time remains deepening the highest-ranked stories.
  chosen.sort((a, b) => a.rank - b.rank); // back into ranked order (which already includes the topic spread)
  if (density.top !== density.base) {
    let upgrades = 0;
    for (const entry of chosen) {
      if (!entry.planned || entry.depth !== density.base) continue;
      if (unlimited && upgrades >= density.unlimitedUpgrades) break;
      const extra = entry.story.readSec[density.top] - entry.story.readSec[entry.depth];
      if (used + extra <= budgetSec) {
        entry.depth = density.top;
        used += extra;
        upgrades += 1;
      }
    }
  }

  let clock = 0;
  const items = chosen.map(entry => {
    const costSec = costOf(entry, entry.depth);
    const item = {
      story: entry.story, tone: entry.tone, depth: entry.depth, score: entry.score, startSec: clock, costSec,
      change: changeOf(entry.story, ctx.seen),
    };
    clock += costSec;
    return item;
  });

  const more = [...overflow, ...below.map(entry => ({ ...entry, score: 0 }))]
    .sort((a, b) => b.story.importance - a.story.importance || Date.parse(b.story.publishedAt) - Date.parse(a.story.publishedAt) || a.story.id.localeCompare(b.story.id))
    .map(entry => ({ story: entry.story, tone: entry.tone, depth: 'headline', change: changeOf(entry.story, ctx.seen) }));

  // The promise behind the whole product: an important story is never silently lost. If one is not in the
  // brief, it is named here so the interface can say so and point to it.
  const missedImportant = [...more.map(entry => entry.story), ...muted].filter(story => story.importance >= 4);

  return {
    items,
    usedSec: clock,
    missedImportant,
    budgetSec: unlimited ? null : budgetSec,
    overflow: more,
    filtered,
    muted,
    changed: items.filter(item => item.change).length,
  };
}
