import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, STORAGE_VERSION, defaultMeta, loadMetaFromStorage, migrateMeta, saveMetaToStorage } from '../src/storage/meta.js';

function createMemoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('migrateMeta upgrades legacy save to current schema', () => {
  const legacy = {
    crystals: 99,
    skills: { greed: 3 },
    unlockedSkins: ['ember', 'ember'],
    schemaVersion: 1
  };
  const migrated = migrateMeta(legacy);
  assert.equal(migrated.schemaVersion, STORAGE_VERSION);
  assert.equal(migrated.crystals, 99);
  assert.equal(migrated.skills.greed, 3);
  assert.deepEqual(migrated.unlockedSkins, ['ember']);
  assert.equal(migrated.totalQuestsCompleted, 0);
});

test('load/save roundtrip keeps versioned meta', () => {
  const storage = createMemoryStorage();
  const meta = defaultMeta();
  meta.crystals = 7;
  saveMetaToStorage(storage, meta);
  const loaded = loadMetaFromStorage(storage);
  assert.equal(loaded.schemaVersion, STORAGE_VERSION);
  assert.equal(loaded.crystals, 7);
  assert.ok(storage.getItem(STORAGE_KEY));
});
