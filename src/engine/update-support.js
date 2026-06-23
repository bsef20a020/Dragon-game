export function checkNearMissesForGame({ game, addScore }) {
  const p = game.player;
  for (const ob of game.obstacles) {
    if (ob._nearTagged) continue;
    const ox = ob.x + ((ob.w || 40) * 0.5);
    const oy = ob.y ?? (ob.gapY + ob.gap / 2);
    const dx = Math.abs(ox - p.x);
    const dy = Math.abs(oy - p.y);
    const threshold = ob.type === 'pillar' ? 54 : 42;
    if (dx < 30 && dy < threshold + 12) {
      if (ob.type === 'pillar') {
        const topGap = ob.gapY;
        const botGap = ob.gapY + ob.gap;
        const marginTop = Math.abs(p.y - p.h - topGap);
        const marginBot = Math.abs(p.y + p.h - botGap);
        if (Math.min(marginTop, marginBot) < 12) {
          ob._nearTagged = true;
          game.nearMisses += 1;
          game.combo += 1;
          game.comboPeak = Math.max(game.comboPeak, game.combo);
          game.comboTimer = 1100;
          game.comboMeter = Math.min(1, game.comboMeter + 0.14 + game.relicMods.nearCombo * 0.01);
          addScore(3 + game.relicMods.nearScore, 'near');
        }
      } else if (dy < 22) {
        ob._nearTagged = true;
        game.nearMisses += 1;
        game.combo += 1;
        game.comboPeak = Math.max(game.comboPeak, game.combo);
        game.comboTimer = 1100;
        game.comboMeter = Math.min(1, game.comboMeter + 0.14 + game.relicMods.nearCombo * 0.01);
        addScore(2 + game.relicMods.nearScore, 'near');
      }
    }
  }
}

export function applyPickupForGame({ game, pick, rng, addScore, createParticles, showToast }) {
  if (pick.type === 'crystal') {
    let gain = 1;
    if (rng(0, 1, game.modeConfig.seeded) < game.relicMods.crystalDupChance) gain += 1;
    game.runCrystals += gain;
    game.runStats.crystals += gain;
    createParticles(pick.x, pick.y, 10, '#8fe7ff', [-2, 2], [-2, 2], [1, 4]);
    showToast(`+${gain} Crystal`, 'good');
  } else if (pick.type === 'ember') {
    addScore(4, 'pickup');
    game.comboMeter = Math.min(1, game.comboMeter + 0.1);
    createParticles(pick.x, pick.y, 10, '#ffbe6b', [-2, 2], [-2, 2], [1, 4]);
    showToast('Ember Charge');
  } else if (pick.type === 'mutation') {
    const m = ['fire_cone', 'double_flap', 'scale_shield', 'tail_swipe'][Math.floor(rng(0, 4, game.modeConfig.seeded))];
    const duration = Math.floor(9000 * game.relicMods.mutationMult);
    game.player.mutation = { type: m, until: performance.now() + duration };
    if (m === 'scale_shield') game.player.shieldFrames = Math.max(game.player.shieldFrames, 180);
    showToast(`Mutation: ${m.replace('_', ' ')}`, 'good');
    createParticles(pick.x, pick.y, 18, '#c4b5fd', [-3, 3], [-3, 3], [1, 5]);
  }
}

export function updatePortalsForGame({ game, dt, showToast }) {
  for (const p of game.portals) {
    p.x -= game.speed;
    p.ttl -= dt;
  }
  game.portals = game.portals.filter((p) => p.x > -30 && p.ttl > 0);
  const p = game.player;
  for (const portal of game.portals) {
    if (portal.dead) continue;
    if (Math.hypot(portal.x - p.x, portal.y - p.y) < portal.r + 18) {
      portal.dead = true;
      game.pathMode = portal.path;
      game.pathTimer = 12000;
      showToast(portal.path === 'danger' ? 'Danger Path: Multiplier Up' : 'Safe Path', portal.path === 'danger' ? 'danger' : 'good');
    }
  }
  game.portals = game.portals.filter((x) => !x.dead);
}
