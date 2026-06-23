/**
 * @param {{meta:any,game:any,todayKey:string}} params
 * @returns {{scoreRounded:number,runCrystalReward:number}}
 */
export function applyRunScoreAndCurrency(params) {
  const { meta, game, todayKey } = params;
  const scoreRounded = Math.floor(game.score);
  if (game.modeKey === 'daily') {
    meta.dailyBestByDate[todayKey] = Math.max(Number(meta.dailyBestByDate[todayKey] || 0), scoreRounded);
    game.high = Number(meta.dailyBestByDate[todayKey] || 0);
  } else {
    meta.bestScores[game.modeKey] = Math.max(Number(meta.bestScores[game.modeKey] || 0), scoreRounded);
    game.high = Number(meta.bestScores[game.modeKey] || 0);
  }
  meta.lastRunScore = scoreRounded;

  const runCrystalReward = game.runCrystals + Math.floor(scoreRounded / 10) + game.runStats.bossesDefeated * 5;
  meta.crystals += runCrystalReward;
  game.rewards.unshift(`Run reward: +${runCrystalReward} crystals`);
  game.rewards.unshift(`Highest level this run: ${game.level}`);

  return { scoreRounded, runCrystalReward };
}

/**
 * @param {{meta:any,game:any,totalCompletedQuests:number}} params
 */
export function applyUnlocksAndReplay(params) {
  const { meta, game, totalCompletedQuests } = params;
  if (game.runStats.biomeReached === 'Frozen Peaks' && !meta.unlockedSkins.includes('glacial')) meta.unlockedSkins.push('glacial');
  if (game.runStats.bossesDefeated > 0 && !meta.unlockedSkins.includes('tempest')) meta.unlockedSkins.push('tempest');
  if (totalCompletedQuests >= 6 && !meta.unlockedSkins.includes('shadowmoss')) meta.unlockedSkins.push('shadowmoss');

  const replay = {
    at: Date.now(),
    score: Math.floor(game.score),
    mode: game.modeKey,
    element: game.elementKey,
    trace: game.trail.slice(0, 2400),
    stats: { combo: game.comboPeak, near: game.nearMisses }
  };
  meta.replays = [replay, ...(meta.replays || [])].slice(0, 5);
  meta.ghostTrace = game.trail.slice(0, 4000);
  meta.ghostMeta = { score: Math.floor(game.score), mode: game.modeKey, element: game.elementKey };
}

/**
 * @param {{reason:string,game:any}} params
 * @returns {string}
 */
export function buildGameOverSummary(params) {
  const { reason, game } = params;
  return `${reason}. Reached Level ${game.level}. ${game.runStats.bossesDefeated ? `Bosses defeated: ${game.runStats.bossesDefeated}.` : ''} ${game.pathMode === 'danger' ? 'You ended on the danger route.' : ''}`.trim();
}
