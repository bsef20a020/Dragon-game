import { computeScoreDelta, computeScoreMultiplier } from './scoring.js';

export function createParticlesForGame({ game, rng, x, y, count, color, vx = [-1, 1], vy = [-1, 1], size = [1, 4] }) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x: x + rng(-6, 6),
      y: y + rng(-6, 6),
      vx: rng(vx[0], vx[1]),
      vy: rng(vy[0], vy[1]),
      life: rng(250, 900),
      t: performance.now(),
      size: rng(size[0], size[1]),
      color
    });
  }
}

export function spawnFloaterForGame({ game, x, y, text, color = '#fff', size = 14 }) {
  game.floaters.push({ x, y, text, color, size, t: performance.now(), life: 760, vy: -0.5 });
}

export function spawnBurstForGame({ createParticles, x, y, kind }) {
  const c = kind === 'ice' ? '#a5f3fc' : (kind === 'shadow' ? '#c4b5fd' : '#ffcf7b');
  createParticles(x, y, 26, c, [-3, 3], [-3, 3], [1, 5]);
}

export function registerBestiaryForMeta({ meta, type, BESTIARY_NAMES, showToast, saveMeta, renderMetaPanels }) {
  if (!meta.bestiary[type]) {
    meta.bestiary[type] = { seen: 1 };
    showToast(`Bestiary: ${BESTIARY_NAMES[type] || type}`, 'good');
    saveMeta();
    renderMetaPanels();
  }
}

export function addScoreForGame({ game, skills, amount, reason = '', showToast }) {
  const mult = computeScoreMultiplier(skills, game.relicMods, game);
  game.scoreMultiplier = mult;
  game.score += computeScoreDelta(amount, mult);
  if (reason === 'near') showToast(`Near Miss +${Math.round(amount * mult)}`, 'good');
}

export function registerKillScoreForGame({ game, count = 1, fromAbility = false, addScore }) {
  game.runStats.kills += count;
  game.combo += count;
  game.comboPeak = Math.max(game.comboPeak, game.combo);
  game.comboTimer = 1200;
  game.comboMeter = Math.min(1, game.comboMeter + 0.16 * count);
  let bonus = count * (fromAbility ? 2 : 1);
  bonus += game.relicMods.finisherBonus * count;
  addScore(bonus, 'kill');
}

export function damageObstacleForGame({ game, ob, dmg, source = 'ability', spawnFloater, registerBestiary, createParticles, showToast }) {
  const hitX = ob.x + (ob.w || 20) / 2;
  const hitY = ob.y || (ob.gapY + ob.gap / 2);
  if (ob.type === 'pillar') {
    ob.dead = true;
    ob.hp = 0;
  } else {
    ob.hp = (ob.hp ?? 10) - dmg;
    if (ob.hp <= 0) ob.dead = true;
  }
  spawnFloater(hitX, hitY - 10, ob.dead ? 'KILL' : `-${Math.max(1, Math.round(dmg))}`, source === 'ice' ? '#bff6ff' : source === 'storm' ? '#e9d5ff' : source === 'shadow' ? '#ddd6fe' : '#ffd57e', ob.dead ? 16 : 13);
  if (ob.dead) {
    registerBestiary(ob.type);
    const hitColor = source === 'storm' ? '#d8b4fe' : source === 'ice' ? '#bff6ff' : source === 'shadow' ? '#ddd6fe' : '#ffd57e';
    createParticles(hitX, hitY, 16, hitColor, [-3, 3], [-3, 3], [1, 5]);
    if (source === 'fire' || source === 'ability' || source === 'storm' || source === 'ice' || source === 'shadow') {
      game.finisherCount += 1;
      game.runStats.finishers += 1;
      game.flash = 0.12;
      game.cameraShake += 4;
      showToast('Finisher!', 'good');
    }
  }
}

export function damagePlayerForGame({ game, amount, reason = 'hit', spawnFloater, createParticles, showToast, endGame }) {
  if (game.modeConfig.zen) {
    game.cameraShake += 2;
    game.player.invulnFrames = 35;
    game.combo = 0;
    showToast('Zen Glide', 'warn');
    return;
  }
  if (game.player.phaseFrames > 0) return;
  if (game.player.invulnFrames > 0) return;
  if (game.player.shieldFrames > 0) {
    game.player.shieldFrames = 0;
    game.player.invulnFrames = 30 + game.relicMods.shieldFrames;
    showToast('Shield Broken', 'warn');
    game.cameraShake += 5;
    return;
  }
  game.player.hp -= amount;
  spawnFloater(game.player.x, game.player.y - 26, `-${amount}`, '#ffb3b3', 15);
  game.player.invulnFrames = 45;
  game.cameraShake += 7;
  game.hitStop = 2;
  createParticles(game.player.x, game.player.y, 28, '#ff8f8f', [-3, 3], [-3, 3], [1, 5]);
  if (game.player.hp <= 0) endGame(reason === 'crash' ? 'Crash' : 'Defeated');
}
