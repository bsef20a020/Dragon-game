import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAchievementsForRun } from '../src/progression/achievements.js';
import { defaultMeta } from '../src/storage/meta.js';

test('evaluateAchievementsForRun unlocks first_blood and grants pet', () => {
  const ACHIEVEMENTS = {
    first_blood: { name: 'First Flame', test: (_g, m) => m.stats.kills >= 1 }
  };
  const meta = defaultMeta();
  const game = {
    modeKey: 'classic',
    score: 0,
    level: 1,
    comboPeak: 0,
    nearMisses: 0,
    rewards: [],
    runStats: { kills: 2, bossesDefeated: 0 }
  };
  const toasts = [];

  evaluateAchievementsForRun({
    ACHIEVEMENTS,
    meta,
    game,
    totalCompletedQuests: 0,
    showToast: (text) => toasts.push(text)
  });

  assert.equal(Boolean(meta.achievements.first_blood), true);
  assert.equal(meta.unlockedPets.includes('emberling'), true);
  assert.equal(game.rewards.includes('Achievement: First Flame'), true);
  assert.equal(toasts.includes('Achievement: First Flame'), true);
});
