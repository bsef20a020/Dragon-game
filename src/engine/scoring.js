/**
 * Pure scoring multiplier used by gameplay and tests.
 * @param {{greed:number}} skills
 * @param {{dangerBonus:number,windFang:boolean}} relicMods
 * @param {{pathMode:string,speed:number,baseSpeed:number,modeKey:string}} game
 * @returns {number}
 */
export function computeScoreMultiplier(skills, relicMods, game) {
  let mult = 1 + skills.greed * 0.04;
  mult += game.pathMode === 'danger' ? (0.5 + relicMods.dangerBonus) : 0;
  if (relicMods.windFang) mult += Math.max(0, (game.speed - game.baseSpeed) * 0.2);
  if (game.modeKey === 'hardcore') mult += 0.25;
  return mult;
}

/**
 * @param {number} amount
 * @param {number} multiplier
 * @returns {number}
 */
export function computeScoreDelta(amount, multiplier) {
  return Math.max(0, Math.round(amount * multiplier * 10) / 10);
}
