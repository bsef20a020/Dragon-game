/**
 * @param {{game:any,kind:string,damageObstacle:(ob:any,dmg:number,source:string)=>void,createParticles:Function,registerKillScore:(count:number,fromAbility:boolean)=>void,showToast:(text:string,kind?:string)=>void,spawnFloater:Function,ELEMENTS:any}} deps
 */
export function castBeamAbility(deps) {
  const { game, kind, damageObstacle, createParticles, registerKillScore, showToast, spawnFloater, ELEMENTS } = deps;
  const p = game.player;
  let hits = 0;
  game.abilityFx.push({ kind, shape: 'beam', x: p.x + 26, y: p.y, w: 360, h: 170, t: performance.now(), life: 180 });
  game.obstacles = game.obstacles.filter((ob) => {
    const obCx = ob.x + ((ob.w || 20) * 0.5);
    if (obCx < p.x + 360 && obCx > p.x - 30 && Math.abs((ob.y || (ob.gapY + ob.gap / 2)) - p.y) < 155) {
      damageObstacle(ob, 999, kind);
      hits += 1;
      return ob.hp > 0 && !ob.dead;
    }
    return !ob.dead;
  });
  game.projectiles = game.projectiles.filter((pr) => {
    if (pr.x < p.x + 360 && pr.x > p.x - 10 && Math.abs(pr.y - p.y) < 150) {
      pr.dead = true;
      hits += 1;
      createParticles(pr.x, pr.y, 8, '#fff1a8', [-2, 2], [-2, 2], [1, 4]);
    }
    return !pr.dead;
  });
  if (game.boss && hits) {
    if (Math.abs(game.boss.y - p.y) < 130 && game.boss.x < p.x + 300) {
      const bossDmg = kind === 'fire' ? 8 : 5;
      game.boss.hp = Math.max(0, game.boss.hp - bossDmg);
      game.flash = 0.15;
      spawnFloater(game.boss.x, game.boss.y - 44, `-${bossDmg}`, kind === 'storm' ? '#e9d5ff' : '#ffd57e', 15);
    }
  }
  if (hits) {
    registerKillScore(hits, true);
    showToast(`${ELEMENTS[game.elementKey].ability} x${hits}`, 'good');
  }
  createParticles(p.x + 28, p.y, 22, kind === 'storm' ? '#d8b4fe' : '#ffb86b', [1.5, 6], [-1.8, 1.8], [2, 6]);
}

/**
 * @param {{game:any,chains:number,damageObstacle:Function,createParticles:Function,registerKillScore:(count:number,fromAbility:boolean)=>void}} deps
 */
export function chainZapAbility(deps) {
  const { game, chains, damageObstacle, createParticles, registerKillScore } = deps;
  const p = game.player;
  const targets = [];
  for (const ob of game.obstacles) {
    const oy = ob.y ?? (ob.gapY + ob.gap / 2);
    if (ob.x > p.x - 10 && ob.x < p.x + 340) targets.push({ type: 'ob', dist: Math.hypot(ob.x - p.x, oy - p.y), ref: ob, y: oy });
  }
  for (const pr of game.projectiles) {
    if (pr.x > p.x && pr.x < p.x + 340) targets.push({ type: 'pr', dist: Math.hypot(pr.x - p.x, pr.y - p.y), ref: pr, y: pr.y });
  }
  targets.sort((a, b) => a.dist - b.dist);
  let used = 0;
  for (const t of targets) {
    if (used >= chains) break;
    if (t.type === 'ob') damageObstacle(t.ref, 40, 'storm');
    else t.ref.dead = true;
    createParticles(t.ref.x, t.y, 10, '#d8b4fe', [-2, 2], [-2, 2], [1, 3]);
    used++;
  }
  if (used) registerKillScore(used, true);
  game.obstacles = game.obstacles.filter((o) => !o.dead && o.hp > 0);
  game.projectiles = game.projectiles.filter((pj) => !pj.dead);
}

/**
 * @param {{game:any,damageObstacle:Function,createParticles:Function,registerKillScore:(count:number,fromAbility:boolean)=>void,showToast:(text:string,kind?:string)=>void,spawnFloater:Function}} deps
 */
export function frostBlastAbility(deps) {
  const { game, damageObstacle, createParticles, registerKillScore, showToast, spawnFloater } = deps;
  const p = game.player;
  let hits = 0;
  game.abilityFx.push({ kind: 'ice', shape: 'nova', x: p.x, y: p.y, r: 210, t: performance.now(), life: 220 });
  for (const ob of game.obstacles) {
    const oy = ob.y ?? (ob.gapY + ob.gap / 2);
    const d = Math.hypot((ob.x + (ob.w || 20) * 0.5) - p.x, oy - p.y);
    if (d < 165) {
      damageObstacle(ob, ob.type === 'pillar' ? 999 : 26, 'ice');
      hits++;
      createParticles(ob.x, oy, 8, '#bff6ff', [-2, 2], [-2, 2], [1, 4]);
    }
  }
  for (const pr of game.projectiles) {
    if (Math.hypot(pr.x - p.x, pr.y - p.y) < 185) {
      pr.dead = true;
      hits++;
      createParticles(pr.x, pr.y, 8, '#e0fbff', [-2, 2], [-2, 2], [1, 4]);
    }
  }
  if (game.boss && Math.hypot(game.boss.x - p.x, game.boss.y - p.y) < 260) {
    game.boss.hp = Math.max(0, game.boss.hp - 6);
    spawnFloater(game.boss.x, game.boss.y - 44, '-6', '#bff6ff', 15);
    hits++;
  }
  game.obstacles = game.obstacles.filter((o) => !o.dead && o.hp > 0);
  game.projectiles = game.projectiles.filter((pr) => !pr.dead);
  if (hits) {
    registerKillScore(Math.min(hits, 4), true);
    showToast(`Frost Shatter x${hits}`, 'good');
  } else {
    showToast('Frost Time', 'good');
  }
}

/**
 * @param {{game:any,radius:number,damageObstacle:Function,createParticles:Function,registerKillScore:(count:number,fromAbility:boolean)=>void,showToast:(text:string,kind?:string)=>void,spawnFloater:Function}} deps
 */
export function shadowSlashAbility(deps) {
  const { game, radius, damageObstacle, createParticles, registerKillScore, showToast, spawnFloater } = deps;
  const p = game.player;
  let hits = 0;
  game.abilityFx.push({ kind: 'shadow', shape: 'ring', x: p.x, y: p.y, r: radius + 25, t: performance.now(), life: 220 });
  for (const ob of game.obstacles) {
    const ox = ob.x + (ob.w || 20) * 0.5;
    const oy = ob.y ?? (ob.gapY + ob.gap / 2);
    if (Math.hypot(ox - p.x, oy - p.y) < radius) {
      damageObstacle(ob, ob.type === 'pillar' ? 999 : 18, 'shadow');
      hits++;
      createParticles(ox, oy, 10, '#d8b4fe', [-3, 3], [-3, 3], [1, 4]);
    }
  }
  for (const pr of game.projectiles) {
    if (Math.hypot(pr.x - p.x, pr.y - p.y) < radius + 25) {
      pr.dead = true;
      hits++;
      createParticles(pr.x, pr.y, 8, '#ede9fe', [-2, 2], [-2, 2], [1, 3]);
    }
  }
  if (game.boss && Math.hypot(game.boss.x - p.x, game.boss.y - p.y) < radius + 120) {
    game.boss.hp = Math.max(0, game.boss.hp - 4);
    spawnFloater(game.boss.x, game.boss.y - 44, '-4', '#ddd6fe', 15);
    hits++;
  }
  game.obstacles = game.obstacles.filter((o) => !o.dead && o.hp > 0);
  game.projectiles = game.projectiles.filter((pr) => !pr.dead);
  if (hits) {
    registerKillScore(Math.min(hits, 3), true);
    game.cameraShake += 2;
    showToast(`Shadow Slash x${hits}`, 'good');
  }
}

/**
 * @param {{game:any,ELEMENTS:any,showToast:(text:string,kind?:string)=>void}} deps
 */
export function doAbilityCast(deps) {
  const { game, ELEMENTS, showToast } = deps;
  if (!game.running || game.paused || game.over) return;
  if (game.levelTransitionMs > 0) return;
  const now = performance.now();
  if (now - game.fireLast < game.fireCooldown) {
    const leftMs = Math.max(0, game.fireCooldown - (now - game.fireLast));
    showToast(`${ELEMENTS[game.elementKey].ability} in ${(leftMs / 1000).toFixed(1)}s`, 'warn');
    return;
  }
  game.fireLast = now;
  game.runStats.usedAbility = true;
  game.runStats.abilitiesUsed += 1;
  game.hitStop = 1;
  ELEMENTS[game.elementKey].onCast(game);
}
