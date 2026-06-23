export function renderGameOverSheet({ ui, game, scoreRounded, summaryText }) {
  ui.gameOverTitle.textContent = game.modeConfig.zen ? 'Zen Run Complete' : 'Run Over';
  ui.gameOverSummary.textContent = summaryText;
  ui.finalScore.textContent = scoreRounded;
  ui.finalBest.textContent = game.high;
  ui.finalCombo.textContent = game.comboPeak;
  ui.finalBiome.textContent = game.runStats.biomeReached;
  ui.runRewards.innerHTML = '';
  if (!game.rewards.length) {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = 'No special rewards this run.';
    ui.runRewards.appendChild(div);
  } else {
    for (const r of game.rewards.slice(0, 6)) {
      const div = document.createElement('div');
      div.className = 'item';
      div.textContent = r;
      ui.runRewards.appendChild(div);
    }
  }
}
