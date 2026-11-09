// The five style dials. Each is a position from 0 to 4 between two ends, and each one
// changes a single, explainable part of how the brief is built. Defaults sit in the middle
// and reproduce the original behaviour exactly.

export const DIAL_IDS = ['tone', 'density', 'prominence', 'focus', 'freshness']
export const DIAL_MAX = 4
export const DIAL_DEFAULT = 2
export const DEFAULT_DIALS = Object.fromEntries(DIAL_IDS.map(id => [id, DIAL_DEFAULT]))

// Tone: which stories are shown as they are, and how intense ones are ranked.
// 0..2 soften heavy news, 3 shows everything, 4 also puts the most intense stories first.
export const TONE_CAP = [1, 2, 3, 5, 5]
export const TONE_ALLOWS_GRAPHIC = [false, false, false, true, true]
export const TONE_INTENSITY_WEIGHT = [-0.4, -0.35, -0.3, 0, 0.8]

// Density: how many stories, and how deep each one goes.
// base = depth every story starts at, top = deepest a story may be upgraded to with spare time.
export const DENSITY = [
  { maxItems: 40, base: 'headline', top: 'headline', headlines: false, unlimitedUpgrades: 0 },
  { maxItems: 34, base: 'headline', top: 'short', headlines: false, unlimitedUpgrades: 5 },
  { maxItems: 30, base: 'short', top: 'full', headlines: true, unlimitedUpgrades: 3 },
  { maxItems: 14, base: 'short', top: 'full', headlines: false, unlimitedUpgrades: 8 },
  { maxItems: 7, base: 'full', top: 'full', headlines: false, unlimitedUpgrades: 7 },
]

// Prominence: how much importance counts in ranking, and the lowest importance allowed in the brief itself.
// Stories under the minimum are not dropped: they go to the "more stories" list.
export const IMPORTANCE_WEIGHT = [1.5, 2.25, 3, 4.5, 6]
export const MIN_IMPORTANCE = [1, 1, 1, 3, 4]

// Focus: how strongly followed topics lift a story, how much stories outside them are held back,
// and how hard the brief pushes against repeating the same topic.
export const FOLLOW_MULTIPLIER = [2, 1.5, 1, 0.5, 0.25]
export const OFF_TOPIC_PENALTY = [3, 1.5, 0, 0, 0]
export const TOPIC_REPEAT_PENALTY = [0, 0, 0, 0.6, 1.2]

// Freshness: the largest bonus a brand-new story gets (fades over 18 hours).
export const FRESHNESS_MAX = [6, 4.5, 3, 1.5, 0]

export const PRESETS = [
  { id: 'balanced', name: 'מאוזן', note: 'ברירת המחדל', dials: { tone: 2, density: 2, prominence: 2, focus: 2, freshness: 2 } },
  { id: 'quiet', name: 'בוקר שקט', note: 'ברוגע, רק החשוב, בעומק', dials: { tone: 0, density: 3, prominence: 3, focus: 2, freshness: 3 } },
  { id: 'quick', name: 'סקירה מהירה', note: 'הרבה כותרות, הכי חדש קודם', dials: { tone: 2, density: 0, prominence: 2, focus: 2, freshness: 0 } },
  { id: 'essential', name: 'רק מה שחשוב', note: 'מעט ידיעות בולטות לעומק', dials: { tone: 2, density: 4, prominence: 4, focus: 1, freshness: 3 } },
  { id: 'everything', name: 'הכול, בלי סינון', note: 'כולל הכבדות והקשות', dials: { tone: 3, density: 1, prominence: 0, focus: 3, freshness: 1 } },
]

export function matchPreset(dials) {
  return PRESETS.find(preset => DIAL_IDS.every(id => preset.dials[id] === dials[id])) || null
}

// The tone dial as the three-colour "heat" the page accent follows.
export function heatOf(dials) {
  const tone = dials.tone
  return tone <= 1 ? 'calm' : tone === 2 ? 'balanced' : 'all'
}

export function sanitizeDials(raw, legacyHeat) {
  const out = { ...DEFAULT_DIALS }
  const input = raw && typeof raw === 'object' ? raw : null
  if (!input && legacyHeat) out.tone = { calm: 1, balanced: 2, all: 3 }[legacyHeat] ?? DIAL_DEFAULT
  if (input) {
    for (const id of DIAL_IDS) {
      const value = Math.round(Number(input[id]))
      if (Number.isFinite(value) && value >= 0 && value <= DIAL_MAX) out[id] = value
    }
  }
  return out
}

export const isDefaultDials = dials => DIAL_IDS.every(id => dials[id] === DIAL_DEFAULT)
