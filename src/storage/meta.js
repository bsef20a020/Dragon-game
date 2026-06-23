import '../types.js';

export const STORAGE_KEY = 'dragon_mythic_v2';
export const STORAGE_VERSION = 2;

/**
 * @returns {import('../types.js').MetaState}
 */
export function defaultMeta() {
  return {
    schemaVersion: STORAGE_VERSION,
    crystals: 0,
    skillPoints: 0,
    skills: { ember: 0, aerodynamics: 0, warding: 0, greed: 0 },
    bestScores: { classic: 0, bossrush: 0, daily: 0, zen: 0, hardcore: 0 },
    unlockedSkins: ['ember'],
    selectedSkin: 'ember',
    unlockedPets: ['none'],
    selectedPet: 'none',
    achievements: {},
    bestiary: {},
    quests: null,
    lastQuestDate: '',
    lastRunScore: 0,
    ghostTrace: [],
    ghostMeta: null,
    dailyBestByDate: {},
    replays: [],
    highestLevelCleared: 0,
    totalLevelClears: 0,
    totalQuestsCompleted: 0
  };
}

/**
 * @param {unknown} raw
 * @returns {import('../types.js').MetaState}
 */
export function migrateMeta(raw) {
  if (!raw || typeof raw !== 'object') return defaultMeta();
  const migrated = { ...raw };
  const version = Number(migrated.schemaVersion || 1);
  if (version < 2) {
    migrated.totalQuestsCompleted = Number(migrated.totalQuestsCompleted || 0);
  }
  migrated.schemaVersion = STORAGE_VERSION;
  return Object.assign(defaultMeta(), migrated, {
    skills: Object.assign(defaultMeta().skills, migrated.skills || {}),
    bestScores: Object.assign(defaultMeta().bestScores, migrated.bestScores || {}),
    achievements: Object.assign({}, migrated.achievements || {}),
    bestiary: Object.assign({}, migrated.bestiary || {}),
    unlockedSkins: Array.from(new Set(migrated.unlockedSkins || ['ember'])),
    unlockedPets: Array.from(new Set(migrated.unlockedPets || ['none'])),
    totalQuestsCompleted: Number(migrated.totalQuestsCompleted || 0),
    schemaVersion: STORAGE_VERSION
  });
}

/**
 * @param {Storage} storage
 * @returns {import('../types.js').MetaState}
 */
export function loadMetaFromStorage(storage) {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    return migrateMeta(raw);
  } catch {
    return defaultMeta();
  }
}

/**
 * @param {Storage} storage
 * @param {import('../types.js').MetaState} meta
 */
export function saveMetaToStorage(storage, meta) {
  const next = { ...meta, schemaVersion: STORAGE_VERSION };
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
}
