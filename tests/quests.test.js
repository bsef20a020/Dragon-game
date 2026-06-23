import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/storage/meta.js';
import { finalizeQuestsFromRun, isShadowmossUnlocked, totalCompletedQuests } from '../src/progression/quests.js';

test('finalizeQuestsFromRun awards rewards once and tracks lifetime completions', () => {
  const meta = defaultMeta();
  meta.quests = [
    { id: 'q1', title: 'Destroy 10 enemies', goal: 10, type: 'kills', progress: 0, done: false, claimed: false },
    { id: 'q2', title: 'Play daily', goal: 1, type: 'daily_play', progress: 0, done: false, claimed: false }
  ];

  const game = {
    modeKey: 'daily',
    score: 15,
    nearMisses: 0,
    runStats: {
      kills: 11,
      crystals: 0,
      finishers: 0,
      bossesDefeated: 0,
      biomeReached: 'Volcanic Reach',
      usedAbility: false
    }
  };

  const first = finalizeQuestsFromRun(meta, game);
  const second = finalizeQuestsFromRun(meta, game);

  assert.equal(first.completedNow, 2);
  assert.equal(second.completedNow, 0);
  assert.equal(totalCompletedQuests(meta), 2);
  assert.equal(meta.crystals, 16);
  assert.equal(meta.skillPoints, 2);
});

test('shadowmoss unlock threshold uses lifetime completion count', () => {
  const meta = defaultMeta();
  meta.totalQuestsCompleted = 5;
  assert.equal(isShadowmossUnlocked(meta), false);
  meta.totalQuestsCompleted = 6;
  assert.equal(isShadowmossUnlocked(meta), true);
});
