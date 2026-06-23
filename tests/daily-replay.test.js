import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateDailyReplay } from '../src/engine/daily-replay.js';

const inputs = [1,0,0,1,0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,1];

test('daily replay is deterministic for same seed and inputs', () => {
  const a = simulateDailyReplay({ dateKey: '2026-03-11', elementKey: 'fire', relics: ['ember_heart', 'wind_fang'], inputs });
  const b = simulateDailyReplay({ dateKey: '2026-03-11', elementKey: 'fire', relics: ['ember_heart', 'wind_fang'], inputs });
  assert.deepEqual(a, b);
});

test('daily replay differs for a different seed key', () => {
  const a = simulateDailyReplay({ dateKey: '2026-03-11', elementKey: 'fire', relics: ['ember_heart', 'wind_fang'], inputs });
  const b = simulateDailyReplay({ dateKey: '2026-03-12', elementKey: 'fire', relics: ['ember_heart', 'wind_fang'], inputs });
  assert.notDeepEqual(a, b);
});
