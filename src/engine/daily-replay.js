import { createSeededRng, hashString, randomBetween } from './random.js';

/**
 * Deterministic lightweight simulator for verifying daily-seed reproducibility.
 * @param {{dateKey:string,elementKey:string,relics:string[],inputs:number[]}} params
 * @returns {{finalY:number,score:number,events:number[]}}
 */
export function simulateDailyReplay(params) {
  const seeded = createSeededRng();
  const seedKey = `${params.dateKey}:${params.elementKey}:${params.relics.join(',')}`;
  seeded.set(hashString(seedKey));

  let y = 300;
  let vy = 0;
  let score = 0;
  const events = [];

  for (let i = 0; i < params.inputs.length; i++) {
    const flap = params.inputs[i] ? -6.9 : 0;
    vy += 0.36 + randomBetween(-0.03, 0.03, seeded.next);
    vy += flap;
    y += vy;
    const pickupRoll = randomBetween(0, 1, seeded.next);
    if (pickupRoll < 0.12) {
      score += 3;
      events.push(i);
    }
    if (randomBetween(0, 1, seeded.next) < 0.08) score += 1;
  }

  return { finalY: Number(y.toFixed(4)), score, events };
}
