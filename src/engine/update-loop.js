export function runUpdateFrame(deps) {
  const {
    game,
    dtRaw,
    H,
    W,
    audio,
    rng,
    activeBiome,
    levelScale,
    spawnObstacle,
    shadowSlash,
    addScore,
    registerBestiary,
    damageObstacle,
    damagePlayer,
    registerKillScore,
    createParticles,
    applyPickup,
    updatePortals,
    updateBoss,
    spawnEvents,
    checkNearMiss,
    castBeam,
    updateHUD,
    syncQuestProgressLive,
    showToast,
    advanceLevel
  } = deps;

  let dt = dtRaw;
  if (game.hitStop > 0) { game.hitStop--; return; }
  if (game.slowTimeMs > 0) { game.slowTimeMs -= dt; dt *= 0.35; }
  if (game.levelTransitionMs > 0) {
    game.levelTransitionMs -= dtRaw;
    if (game.levelTransitionMs <= 0) {
      game.levelTransitionMs = 0;
      game.levelLabel = '';
      showToast(`Level ${game.level} Start`, 'warn');
    }
    updateHUD();
    return;
  }

  game.levelTimeMs -= dtRaw;
  if (game.levelTimeMs <= 0) {
    advanceLevel();
    updateHUD();
    return;
  }

  if (game.safePickupMs > 0) game.safePickupMs = Math.max(0, game.safePickupMs - dtRaw);

  game.distance += dt * 0.01;
  const lvlScale = levelScale();
  game.speed += (game.baseSpeed * lvlScale + Math.min(2.2 + game.level * 0.15, game.score * 0.02) - game.speed) * 0.004;
  if (game.pathMode === 'danger') game.speed += 0.002;
  if (game.modeKey === 'zen') game.speed *= 0.999;

  game.obstacleTimer += dt;
  const spawnMod = game.boss ? 1.5 : 1;
  game.obstacleInterval = Math.max(520, 1350 - game.speed * 85 - (game.level - 1) * 70) * spawnMod;
  if (game.obstacleTimer > game.obstacleInterval && game.safePickupMs <= 0) {
    game.obstacleTimer = 0;
    spawnObstacle();
  }

  const p = game.player;
  p.vy += game.gravity + activeBiome().wind * 0.1;
  if (p.mutation.type === 'double_flap' && p.wing > 0.9) p.vy -= 0.03;
  p.y += p.vy;
  p.angle = Math.max(-28, Math.min(55, p.vy * 5));
  p.wing *= 0.9;
  if (p.invulnFrames > 0) p.invulnFrames--;
  if (p.shieldFrames > 0) p.shieldFrames--;
  if (p.phaseFrames > 0) p.phaseFrames--;
  if (p.shadowAuraCd > 0) p.shadowAuraCd -= dt;
  if (p.mutation.type && performance.now() > p.mutation.until) p.mutation = { type: null, until: 0 };
  if (game.elementKey === 'shadow' && p.phaseFrames > 0 && p.shadowAuraCd <= 0) {
    p.shadowAuraCd = 170;
    shadowSlash(95);
  }

  if (game.pathTimer > 0) { game.pathTimer -= dt; if (game.pathTimer <= 0) game.pathMode = 'safe'; }

  for (const ob of game.obstacles) {
    if (ob.type === 'pillar') {
      ob.x -= game.speed;
      if (!ob.passed && ob.x + ob.w < p.x - 5) {
        ob.passed = true;
        addScore(ob.scoreValue, 'pass');
      }
    } else if (ob.type === 'hunter') {
      ob.x -= game.speed + 0.4;
      ob.t += dt;
      if (ob.t > ob.shootCd && ob.x < W - 40) {
        ob.t = 0;
        game.projectiles.push({ type: 'arrow', x: ob.x, y: ob.y, vx: -5.2, vy: 0.2 * Math.sin(performance.now() / 200), w: 16, h: 4, dead: false, color: '#ffd08a' });
        registerBestiary('arrow');
      }
    } else if (ob.type === 'wyvern') {
      ob.x -= game.speed + 0.8;
      ob.wave += dt * 0.004;
      ob.y += Math.sin(ob.wave) * 1.7;
    } else if (ob.type === 'airship') {
      ob.x -= game.speed + 0.2;
      ob.t += dt;
      if (ob.t > ob.shootCd && ob.x < W - 40) {
        ob.t = 0;
        game.projectiles.push({ type: 'bolt', x: ob.x - 10, y: ob.y + 6, vx: -4.3, vy: rng(-0.6, 0.6), r: 5, dead: false, color: '#ffcaa8' });
      }
    } else if (ob.type === 'wizard') {
      ob.x -= game.speed + 0.3;
      ob.t += dt;
      if (ob.t > ob.castCd && ob.x < W - 60) {
        ob.t = 0;
        game.projectiles.push({ type: 'rune', x: ob.x - 16, y: ob.y, vx: -3.2, vy: Math.sin(performance.now() / 240) * 0.3, r: 10, dead: false, color: '#c4b5fd', aoe: true });
      }
    } else if (ob.type === 'orb') {
      ob.x -= game.speed + 1.2;
      ob.orbit += dt * 0.005;
      ob.y += Math.sin(ob.orbit) * 2.2;
    }

    if (!ob.passed && ob.x + (ob.w || 20) < p.x - 8) {
      ob.passed = true;
      addScore(ob.scoreValue || 1, 'pass');
    }
  }

  const nextObstacles = [];
  for (const ob of game.obstacles) {
    if (ob.dead || (ob.hp !== undefined && ob.hp <= 0)) {
      registerKillScore(1, false);
      continue;
    }
    if (ob.type === 'pillar') {
      const hitX = p.x + p.w * 0.1 > ob.x && p.x - p.w * 0.45 < ob.x + ob.w;
      if (hitX && (p.y - p.h * 0.7 < ob.gapY || p.y + p.h * 0.7 > ob.gapY + ob.gap)) {
        if (p.mutation.type === 'tail_swipe') {
          damageObstacle(ob, 999, 'ability');
          registerKillScore(1, true);
        } else {
          damagePlayer(game.modeConfig.hardcore ? 99 : 1, 'crash');
        }
      }
    } else if (Math.abs((ob.x + (ob.w || 20) / 2) - p.x) < ((ob.w || 30) / 2 + 18) && Math.abs((ob.y || 0) - p.y) < ((ob.h || 28) / 2 + 16)) {
      if (p.mutation.type === 'tail_swipe') {
        damageObstacle(ob, 999, 'ability');
      } else {
        damagePlayer(1, 'hit');
      }
    }
    if (ob.x + (ob.w || 20) > -40 && !ob.dead) nextObstacles.push(ob);
  }
  game.obstacles = nextObstacles;

  const nextProj = [];
  for (const pr of game.projectiles) {
    pr.x += pr.vx;
    pr.y += pr.vy || 0;
    if (pr.aoe) pr.r += 0.02;
    const pw = pr.w || pr.r * 2 || 12;
    const ph = pr.h || pr.r * 2 || 12;
    if (Math.abs(pr.x - p.x) < pw * 0.5 + 16 && Math.abs(pr.y - p.y) < ph * 0.5 + 16) {
      if (p.mutation.type === 'tail_swipe') {
        pr.dead = true;
        createParticles(pr.x, pr.y, 8, '#ffe7aa', [-2, 2], [-2, 2], [1, 3]);
      } else {
        damagePlayer(pr.type === 'pulse' ? 2 : 1, 'projectile');
        pr.dead = true;
      }
    }
    if (!pr.dead && pr.x > -40 && pr.y > -40 && pr.y < H + 40) nextProj.push(pr);
  }
  game.projectiles = nextProj;

  const nextPickups = [];
  for (const pick of game.pickups) {
    pick.x -= game.speed - 0.3;
    pick.pulse += dt * 0.004;
    pick.y += Math.sin(pick.pulse) * 0.4 + pick.vy;
    if (Math.hypot(pick.x - p.x, pick.y - p.y) < 24) {
      applyPickup(pick);
      continue;
    }
    if (pick.x > -20) nextPickups.push(pick);
  }
  game.pickups = nextPickups;

  updatePortals(dt);
  updateBoss(dt);
  spawnEvents(dt);
  checkNearMiss();

  if (p.y - p.h < 8 || p.y + p.h > H - 8) {
    if (game.modeConfig.zen) {
      p.y = Math.min(H - 20, Math.max(20, p.y));
      p.vy *= -0.25;
      damagePlayer(0, 'wall');
    } else if (p.phaseFrames > 0) {
      p.y = Math.min(H - 20, Math.max(20, p.y));
      p.vy *= -0.2;
    } else {
      damagePlayer(game.modeConfig.hardcore ? 99 : 1, 'crash');
    }
  }

  const now = performance.now();
  game.particles = game.particles.filter((pt) => {
    if (now - pt.t > pt.life) return false;
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vx *= 0.99;
    pt.vy *= 0.99;
    return true;
  });
  game.floaters = game.floaters.filter((f) => {
    const age = now - f.t;
    if (age > f.life) return false;
    f.y += f.vy;
    return true;
  });
  game.abilityFx = game.abilityFx.filter((fx) => now - fx.t < fx.life);

  if (game.comboTimer > 0) game.comboTimer -= dt;
  else if (game.combo > 0) {
    game.combo = Math.max(0, game.combo - 1);
    game.comboMeter = Math.max(0, game.comboMeter - 0.025);
    game.comboTimer = 260;
  }
  game.comboMeter = Math.max(0, game.comboMeter - 0.00035 * dt);

  if (p.mutation.type === 'fire_cone' && rng(0, 1, game.modeConfig.seeded) < 0.03) castBeam('fire');
  if (p.mutation.type === 'scale_shield' && p.shieldFrames < 10 && rng(0, 1, game.modeConfig.seeded) < 0.004) p.shieldFrames = 60;

  game.trail.push({ x: p.x, y: p.y });
  if (game.trail.length > 6000) game.trail.shift();
  if (game.ghostTrace.length) game.ghostFrame = Math.min(game.ghostTrace.length - 1, game.ghostFrame + 1);

  addScore(0.01 * dt / 100, 'drift');

  game.cameraShake *= 0.88;
  game.flash *= 0.92;

  if (audio && !audio.disabled && audio.baseG) {
    const intensity = Math.min(1, game.comboMeter * 0.6 + (game.boss ? 0.35 : 0) + (game.pathMode === 'danger' ? 0.2 : 0));
    const t = audio.ac.currentTime;
    audio.baseG.gain.setTargetAtTime(0.02 + intensity * 0.02, t, 0.08);
    audio.layerG.gain.setTargetAtTime(intensity * 0.018, t, 0.08);
    audio.pulseG.gain.setTargetAtTime(game.boss ? 0.012 : 0.004, t, 0.08);
  }

  updateHUD();
  syncQuestProgressLive();
}
