export function evaluateAchievementsForRun({ ACHIEVEMENTS, meta, game, totalCompletedQuests, showToast }) {
  const runMetrics = {
    stats: {
      kills: game.runStats.kills,
      bestCombo: game.comboPeak,
      bossesDefeated: game.runStats.bossesDefeated,
      nearMisses: game.nearMisses,
      finishedDaily: game.modeKey === 'daily',
      hardcore20: game.modeKey === 'hardcore' && game.score >= 20,
      totalQuestsCompleted: totalCompletedQuests,
      levelReached: game.level
    }
  };

  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    if (!meta.achievements[id] && ach.test(game, runMetrics)) {
      meta.achievements[id] = { at: Date.now() };
      game.rewards.push(`Achievement: ${ach.name}`);
      showToast(`Achievement: ${ach.name}`, 'good');
      if (id === 'combo_10' && !meta.unlockedPets.includes('snowbat')) meta.unlockedPets.push('snowbat');
      if (id === 'first_blood' && !meta.unlockedPets.includes('emberling')) meta.unlockedPets.push('emberling');
      if (id === 'level_3' && !meta.unlockedPets.includes('sparkwisp')) meta.unlockedPets.push('sparkwisp');
    }
  }
}
