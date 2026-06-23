import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScoreDelta, computeScoreMultiplier } from '../src/engine/scoring.js';

test('computeScoreMultiplier includes danger/wind/hardcore modifiers', () => {
  const mult = computeScoreMultiplier(
    { greed: 2 },
    { dangerBonus: 0.35, windFang: true },
    { pathMode: 'danger', speed: 4.2, baseSpeed: 2.2, modeKey: 'hardcore' }
  );
  assert.equal(Number(mult.toFixed(2)), 2.58);
});

test('computeScoreDelta is rounded to 0.1 and never negative', () => {
  assert.equal(computeScoreDelta(3.333, 1.25), 4.2);
  assert.equal(computeScoreDelta(-10, 2), 0);
});
