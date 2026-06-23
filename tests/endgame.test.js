import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRunScoreAndCurrency, applyUnlocksAndReplay, buildGameOverSummary } from '../src/engine/endgame.js';
import { defaultMeta } from '../src/storage/meta.js';

test('applyRunScoreAndCurrency updates best score and run currency', () => {
  const meta = defaultMeta();
  const game = {
    score: 42.9,
    modeKey: 'classic',
    level: 3,
    runCrystals: 4,
    runStats: { bossesDefeated: 2 },
    rewards: [],
    high: 0
  };

  const result = applyRunScoreAndCurrency({ meta, game, todayKey: '2026-03-11' });

  assert.equal(result.scoreRounded, 42);
  assert.equal(meta.bestScores.classic, 42);
  assert.equal(meta.crystals, 4 + 4 + 10);
  assert.equal(game.rewards[0], 'Highest level this run: 3');
  assert.equal(game.rewards[1], 'Run reward: +18 crystals');
});

test('applyUnlocksAndReplay unlocks shadowmoss and stores replay/ghost', () => {
  const meta = defaultMeta();
  const game = {
    score: 23,
    modeKey: 'daily',
    elementKey: 'storm',
    comboPeak: 12,
    nearMisses: 3,
    trail: Array.from({ length: 10 }, (_, i) => ({ x: i, y: i })),
    runStats: { biomeReached: 'Frozen Peaks', bossesDefeated: 1 }
  };

  applyUnlocksAndReplay({ meta, game, totalCompletedQuests: 6 });

  assert.equal(meta.unlockedSkins.includes('glacial'), true);
  assert.equal(meta.unlockedSkins.includes('tempest'), true);
  assert.equal(meta.unlockedSkins.includes('shadowmoss'), true);
  assert.equal(Array.isArray(meta.replays), true);
  assert.equal(meta.ghostMeta.mode, 'daily');
});

test('buildGameOverSummary includes boss count and danger route text', () => {
  const text = buildGameOverSummary({
    reason: 'Crash',
    game: { level: 4, pathMode: 'danger', runStats: { bossesDefeated: 2 } }
  });
  assert.match(text, /Crash\. Reached Level 4\./);
  assert.match(text, /Bosses defeated: 2\./);
  assert.match(text, /danger route/);
});
