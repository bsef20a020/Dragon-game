import '../types.js';

/**
 * @param {import('../types.js').MetaState} meta
 * @returns {number}
 */
export function totalCompletedQuests(meta) {
  return Number(meta.totalQuestsCompleted || 0);
}

/**
 * @param {import('../types.js').MetaState} meta
 * @returns {boolean}
 */
export function isShadowmossUnlocked(meta) {
  return totalCompletedQuests(meta) >= 6;
}

/**
 * Finalizes quest progress and returns reward summary.
 * @param {import('../types.js').MetaState} meta
 * @param {{modeKey:string,score:number,nearMisses:number,runStats:{kills:number,crystals:number,finishers:number,bossesDefeated:number,biomeReached:string,usedAbility:boolean}}} game
 * @returns {{crystalsAwarded:number,skillPointsAwarded:number,completedNow:number,rewardTexts:string[]}}
 */
export function finalizeQuestsFromRun(meta, game) {
  const summary = {
    crystalsAwarded: 0,
    skillPointsAwarded: 0,
    completedNow: 0,
    rewardTexts: []
  };
  if (!Array.isArray(meta.quests)) return summary;

  for (const q of meta.quests) {
    if (q.type === 'kills') q.progress = Math.min(q.goal, q.progress + game.runStats.kills);
    if (q.type === 'crystals') q.progress = Math.min(q.goal, q.progress + game.runStats.crystals);
    if (q.type === 'near') q.progress = Math.min(q.goal, q.progress + game.nearMisses);
    if (q.type === 'finishers') q.progress = Math.min(q.goal, q.progress + game.runStats.finishers);
    if (q.type === 'boss') q.progress = Math.min(q.goal, q.progress + game.runStats.bossesDefeated);
    if (q.type === 'daily_play' && game.modeKey === 'daily') q.progress = 1;
    if (q.type === 'biome_storm' && game.runStats.biomeReached === 'Tempest Veins') q.progress = 1;
    if (q.type === 'nofire' && !game.runStats.usedAbility && game.score >= q.goal) q.progress = q.goal;
    if (q.progress >= q.goal) q.done = true;

    if (q.done && !q.claimed) {
      q.claimed = true;
      meta.totalQuestsCompleted = Number(meta.totalQuestsCompleted || 0) + 1;
      meta.crystals += 8;
      meta.skillPoints += 1;
      summary.crystalsAwarded += 8;
      summary.skillPointsAwarded += 1;
      summary.completedNow += 1;
      summary.rewardTexts.push(`Quest complete: ${q.title} (+8 crystals, +1 SP)`);
    }
  }

  return summary;
}
