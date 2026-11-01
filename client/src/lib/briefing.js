// Turns the day's stories plus the reader's settings into a brief that fits the
// time they have and the level of intensity they chose. Pure functions, no React,
// so the rules are easy to test and to change.
//
// Principles:
//  - Intensity filters what is shown by default, but it never hides important news.
//    A heavy story that matters (importance >= 4) is shown in a calm rewrite instead.
//  - A muted topic stays muted, except for the very biggest developments (importance 5)
//    or anything matching a keyword the reader asked to follow.
//  - Everything that was left out is returned, so the interface can say so.

export const HEAT_CAP = { calm: 2, balanced: 3, all: 5 };

const MAX_ITEMS = 30;
const MAX_ITEMS_UNLIMITED = 40;
const FULL_DEPTH_LIMIT_UNLIMITED = 3;

const lower = value => String(value || '').toLowerCase();

export function matchesKeywords(story, keywords) {
  if (!keywords || !keywords.length) return false;
  const haystack = lower([story.headline, story.oneLiner, ...(story.entities || [])].join(' '));
  return keywords.some(word => word && haystack.includes(lower(word)));
}

export function scoreStory(story, prefs, now) {
  const topics = prefs.topics || {};
  let score = story.importance * 3;
  if (topics[story.primaryTopic] === 'follow') score += 4;
  else if ((story.topics || []).slice(1).some(id => topics[id] === 'follow')) score += 2;
  if (matchesKeywords(story, prefs.keywords)) score += 5;
  score += Math.min(story.sources.length, 4) * 0.7; // several outlets reporting it is a signal
  const hours = Math.max(0, (now - Date.parse(story.publishedAt)) / 3_600_000);
  score += Math.max(0, 3 - hours / 6); // freshness bonus fades over 18 hours
  score -= story.intensity * 0.3; // gentle tie-breaker toward calmer stories
  return score;
}

function costOf(entry, depth) {
  return entry.tone === 'calm' ? entry.story.readSec.calm : entry.story.readSec[depth];
}

export function buildBriefing(stories, prefs, now = Date.now()) {
  const cap = HEAT_CAP[prefs.heat] ?? HEAT_CAP.balanced;
  const hidden = new Set(prefs.hidden || []);
  const topics = prefs.topics || {};

  const candidates = [];
  const filtered = [];
  const muted = [];

  for (const story of stories) {
    if (hidden.has(story.id)) continue;

    const topicMuted = topics[story.primaryTopic] === 'mute' && story.importance < 5 && !matchesKeywords(story, prefs.keywords);
    if (topicMuted) {
      muted.push(story);
      continue;
    }

    const tooHeavy = story.intensity > cap || (story.graphic && prefs.heat !== 'all');
    if (!tooHeavy) candidates.push({ story, tone: 'normal' });
    else if (story.importance >= 4) candidates.push({ story, tone: 'calm' });
    else filtered.push(story);
  }

  const ranked = candidates
    .map(entry => ({ ...entry, score: scoreStory(entry.story, prefs, now) }))
    .sort((a, b) => b.score - a.score || Date.parse(b.story.publishedAt) - Date.parse(a.story.publishedAt) || a.story.id.localeCompare(b.story.id));

  const unlimited = !(prefs.minutes > 0);
  const budgetSec = unlimited ? Infinity : prefs.minutes * 60;
  const maxItems = unlimited ? MAX_ITEMS_UNLIMITED : MAX_ITEMS;

  // Pass 1: add stories in rank order, each at "short" depth, skipping any that no longer fit.
  let used = 0;
  const chosen = [];
  const leftovers = [];
  for (const entry of ranked) {
    const depth = entry.tone === 'calm' ? 'calm' : 'short';
    const cost = costOf(entry, depth);
    if (chosen.length < maxItems && (chosen.length === 0 || used + cost <= budgetSec)) {
      chosen.push({ ...entry, depth });
      used += cost;
    } else {
      leftovers.push(entry);
    }
  }

  // Pass 2: headline-only entries for stories that still fit in the leftover time.
  const overflow = [];
  for (const entry of leftovers) {
    const cost = entry.story.readSec.headline;
    if (entry.tone === 'normal' && chosen.length < maxItems && used + cost <= budgetSec) {
      chosen.push({ ...entry, depth: 'headline' });
      used += cost;
    } else {
      overflow.push(entry);
    }
  }

  // Pass 3: spend whatever time remains giving the highest-ranked stories their full write-up.
  chosen.sort((a, b) => b.score - a.score || a.story.id.localeCompare(b.story.id));
  let upgrades = 0;
  for (const entry of chosen) {
    if (entry.depth !== 'short') continue;
    if (unlimited && upgrades >= FULL_DEPTH_LIMIT_UNLIMITED) break;
    const extra = entry.story.readSec.full - entry.story.readSec.short;
    if (used + extra <= budgetSec) {
      entry.depth = 'full';
      used += extra;
      upgrades += 1;
    }
  }

  let clock = 0;
  const items = chosen.map(entry => {
    const costSec = costOf(entry, entry.depth);
    const item = { story: entry.story, tone: entry.tone, depth: entry.depth, score: entry.score, startSec: clock, costSec };
    clock += costSec;
    return item;
  });

  return {
    items,
    usedSec: clock,
    budgetSec: unlimited ? null : budgetSec,
    overflow: overflow.map(entry => ({ story: entry.story, tone: entry.tone, depth: 'headline' })),
    filtered,
    muted,
  };
}
