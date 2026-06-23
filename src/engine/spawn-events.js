function collidesEllipse(ax, ay, aw, ah, bx, by, bw, bh) {
  const dx = (ax - bx) / (aw + bw);
  const dy = (ay - by) / (ah + bh);
  return dx * dx + dy * dy < 1;
}

export function maybeSpawnPickupForGame({ game, x, y, useSeed, chance, W, H, rng, biome }) {
  const roll = rng(0, 1, useSeed);
  if (roll > chance * game.relicMods.crystalMult) return;
  const type = roll < 0.08 ? 'mutation' : (roll < 0.16 ? 'ember' : 'crystal');
  let px = x;
  let py = y;
  let vy = rng(-0.2, 0.2, useSeed);
  if (type === 'mutation') {
    px = Math.max(x + 80, W + 160);
    const targetY = game.player ? game.player.y : H * 0.5;
    py = Math.max(86, Math.min(H - 86, targetY + rng(-38, 38, useSeed)));
    vy = rng(-0.08, 0.08, useSeed);
    game.safePickupMs = Math.max(game.safePickupMs, 1800);
  }
  game.pickups.push({ x: px, y: py, r: 10, type, tint: biome.fog, vy, pulse: rng(0, 6, useSeed) });
}

export function spawnObstacleForGame({ game, W, H, activeBiome, rng }) {
  const biome = activeBiome();
  const useSeed = !!game.modeConfig.seeded;
  let types = biome.hazardBias.slice();
  if (game.modeKey === 'bossrush') types = game.level <= 1 ? ['wyvern', 'hunter', 'airship'] : ['wyvern', 'airship', 'hunter', 'orb'];
  if (game.level === 1) types = types.filter((t) => t === 'pillar' || t === 'hunter' || t === 'wyvern');
  if (game.level === 2) types = types.filter((t) => t !== 'wizard');
  if (!types.length) types = ['pillar', 'hunter'];
  const pick = types[Math.floor(rng(0, types.length, useSeed))];
  const hpScale = 1 + Math.max(0, game.level - 1) * 0.18;

  if (pick === 'pillar') {
    const gapBase = game.modeKey === 'hardcore' ? 120 : 150;
    const gap = Math.max(98, gapBase - Math.floor(game.score / 12) - Math.floor((game.level - 1) * 6));
    const gapY = rng(90, H - 90 - gap, useSeed);
    const w = rng(48, 70, useSeed);
    game.obstacles.push({ type: 'pillar', x: W + 20, y: gapY + gap / 2, w, gapY, gap, hp: 999, passed: false, color: biome.fog, scoreValue: 1 + Math.floor((game.level - 1) * 0.25) });
    maybeSpawnPickupForGame({ game, x: W + 70, y: gapY + gap / 2, useSeed, chance: 0.22, W, H, rng, biome });
    return;
  }
  if (pick === 'hunter') {
    const y = rng(80, H - 120, useSeed);
    game.obstacles.push({ type: 'hunter', x: W + 40, y, w: 42, h: 28, hp: Math.round(24 * hpScale), shootCd: rng(500, 1200, useSeed), t: 0, passed: false, color: '#ffd08a', scoreValue: 2 + Math.floor(game.level * 0.2) });
    return;
  }
  if (pick === 'wyvern') {
    const y = rng(80, H - 80, useSeed);
    game.obstacles.push({ type: 'wyvern', x: W + 30, y, w: 52, h: 28, hp: Math.round(22 * hpScale), wave: rng(0, 10, useSeed), passed: false, color: '#8ab4ff', scoreValue: 2 + Math.floor(game.level * 0.2) });
    return;
  }
  if (pick === 'airship') {
    const y = rng(70, H - 130, useSeed);
    game.obstacles.push({ type: 'airship', x: W + 60, y, w: 72, h: 34, hp: Math.round(38 * hpScale), shootCd: rng(700, 1300, useSeed), t: 0, passed: false, color: '#f59e9e', scoreValue: 3 + Math.floor(game.level * 0.3) });
    maybeSpawnPickupForGame({ game, x: W + 110, y, useSeed, chance: 0.35, W, H, rng, biome });
    return;
  }
  if (pick === 'wizard') {
    const y = rng(100, H - 100, useSeed);
    game.obstacles.push({ type: 'wizard', x: W + 20, y, w: 34, h: 34, hp: Math.round(18 * hpScale), castCd: rng(700, 1400, useSeed), t: 0, passed: false, color: '#c4b5fd', scoreValue: 2 + Math.floor(game.level * 0.2) });
    return;
  }
  if (pick === 'orb') {
    const y = rng(90, H - 90, useSeed);
    game.obstacles.push({ type: 'orb', x: W + 20, y, w: 30, h: 30, hp: Math.round(14 * hpScale), passed: false, orbit: rng(0, 6, useSeed), color: '#b8b5ff', scoreValue: 2 + Math.floor(game.level * 0.2) });
  }
}

export function spawnPortalChoiceForGame({ game, W, H, showToast }) {
  const highY = Math.max(80, H * 0.28);
  const lowY = Math.min(H - 80, H * 0.72);
  game.portals.push(
    { x: W + 50, y: highY, r: 20, path: 'danger', ttl: 2600 },
    { x: W + 50, y: lowY, r: 20, path: 'safe', ttl: 2600 }
  );
  showToast('Path Portal: High = Danger Multiplier', 'warn');
}

export function spawnBossForGame({ game, W, H, activeBiome, registerBestiary, showToast }) {
  if (game.boss) return;
  const biome = activeBiome();
  const variants = [
    { id: 'boss_serpent', name: 'Sky Serpent', hp: 90, w: 150, h: 70, attack: 'snakeshot' },
    { id: 'boss_galleon', name: 'Ballista Galleon', hp: 120, w: 170, h: 80, attack: 'barrage' },
    { id: 'boss_titan', name: 'Thunder Titan', hp: 140, w: 130, h: 120, attack: 'pulse' }
  ];
  const v = variants[((game.score / Math.max(1, game.modeConfig.bossEvery)) % variants.length) | 0];
  game.boss = { ...v, x: W + 200, y: H / 2, vx: -1.1, phase: 0, t: 0, maxHp: v.hp, color: biome.fog, introMs: 1800 };
  registerBestiary(v.id);
  showToast(`Boss Incoming: ${v.name}`, 'danger');
}

export function updateBossForGame({ game, meta, dt, W, H, rng, registerBestiary, addScore, createParticles, showToast, damagePlayer }) {
  if (!game.boss) return;
  const b = game.boss;
  b.t += dt;
  if (b.introMs > 0) b.introMs -= dt;
  if (b.x > W - 180) b.x += b.vx;
  b.phase += dt * 0.002;
  b.y = H * 0.5 + Math.sin(b.phase) * 120;

  if (b.introMs > 0) {
    b.t = 0;
  } else if (b.attack === 'snakeshot' && b.t > 850) {
    b.t = 0;
    game.projectiles.push({ type: 'venom', x: b.x - 20, y: b.y + rng(-25, 25, game.modeConfig.seeded), vx: -4.2, vy: rng(-0.8, 0.8), r: 8, dead: false, color: '#c7ff96' });
  } else if (b.attack === 'barrage' && b.t > 720) {
    b.t = 0;
    for (let i = 0; i < 3; i++) game.projectiles.push({ type: 'bolt', x: b.x - 30, y: b.y + (i - 1) * 24, vx: -5, vy: (i - 1) * 0.6, r: 6, dead: false, color: '#ffd2a6' });
  } else if (b.attack === 'pulse' && b.t > 1100) {
    b.t = 0;
    game.projectiles.push({ type: 'pulse', x: b.x - 20, y: b.y, vx: -3.3, vy: 0, r: 14, dead: false, color: '#c4b5fd', aoe: true });
    game.cameraShake += 3;
  }

  if (b.hp <= 0) {
    game.runStats.bossesDefeated += 1;
    meta.skillPoints += 1;
    game.rewards.push('+1 Skill Point (Boss defeated)');
    registerBestiary(b.id);
    if (!meta.unlockedSkins.includes('tempest')) meta.unlockedSkins.push('tempest');
    addScore(25, 'boss');
    createParticles(b.x, b.y, 60, '#f0abfc', [-4, 4], [-4, 4], [2, 6]);
    showToast(`${b.name} defeated`, 'good');
    game.boss = null;
    return;
  }

  if (collidesEllipse(game.player.x, game.player.y, 18, 16, b.x, b.y, b.w * 0.35, b.h * 0.35)) damagePlayer(1, 'boss');
}

export function spawnEventsForGame({ game, dt, rng, onSpawnPortalChoice, onSpawnBoss }) {
  game.eventTimer += dt;
  const portalRate = 15000 * game.relicMods.portalRate * (game.level <= 1 ? 1.2 : 1);
  if (game.eventTimer > portalRate) {
    game.eventTimer = 0;
    onSpawnPortalChoice();
  }
  if (game.level >= 2 && !game.boss && game.score >= game.bossCheckScore + game.modeConfig.bossEvery && !game.modeConfig.zen) {
    game.bossCheckScore = Math.floor(game.score);
    onSpawnBoss();
  }
  if (game.level >= 2 && game.modeKey === 'bossrush' && !game.boss && rng(0, 1, game.modeConfig.seeded) < 0.0025) onSpawnBoss();
}
