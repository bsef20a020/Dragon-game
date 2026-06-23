/**
 * @param {{ctx:CanvasRenderingContext2D,game:any,W:number,H:number,SKINS:any,activeBiome:()=>any,ghostEnabled:boolean,elementKey:string,rng:(a:number,b:number)=>number}} deps
 */
export function renderFrame(deps) {
  const { ctx, game, W, H, SKINS, activeBiome, ghostEnabled, elementKey, rng } = deps;

  function renderBackground() {
    const biome = activeBiome();
    const element = elementKey || 'fire';
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, biome.sky[0]);
    g.addColorStop(1, biome.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const overlayByElement = {
      fire: 'rgba(255,120,60,0.10)',
      ice: 'rgba(155,235,255,0.12)',
      storm: 'rgba(196,181,253,0.12)',
      shadow: 'rgba(60,45,110,0.18)'
    };
    ctx.fillStyle = overlayByElement[element] || 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.015 + i * 0.01})`;
      const x = (i * 180 + game.distance * 12 * (i + 1)) % (W + 200) - 120;
      ctx.beginPath();
      ctx.ellipse(x, 90 + i * 85, 170 + i * 20, 35 + i * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 26; i++) {
      const x = (i * 73 + game.distance * (biome.id === 'storm' ? 18 : 8)) % W;
      const y = (i * 51) % H;
      ctx.fillStyle = `rgba(255,255,255,${biome.id === 'volcano' ? 0.06 : 0.12})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(10,20,35,${0.2 + i * 0.05})`;
      const shift = (game.distance * (8 + i * 5)) % (W + 220);
      ctx.beginPath();
      ctx.ellipse(W - shift, H - 110 + i * 20, 200 + i * 35, 45 + i * 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (element === 'ice') {
      for (let i = 0; i < 42; i++) {
        const sx = (i * 47 + game.distance * 6 + (i % 5) * 22) % (W + 30) - 15;
        const sy = (i * 63 + game.distance * 14) % (H + 40) - 20;
        ctx.fillStyle = `rgba(230,248,255,${0.18 + (i % 4) * 0.05})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (element === 'storm') {
      for (let i = 0; i < 26; i++) {
        const rx = (i * 61 + game.distance * 20) % (W + 60) - 30;
        const ry = (i * 37 + game.distance * 5) % (H + 60) - 30;
        ctx.strokeStyle = `rgba(210,220,255,${0.12 + (i % 3) * 0.07})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 10, ry + 20);
        ctx.stroke();
      }
      if ((performance.now() % 2400) < 70 && (game.running || !game.started)) {
        ctx.fillStyle = 'rgba(240,245,255,0.06)';
        ctx.fillRect(0, 0, W, H);
      }
    } else if (element === 'fire') {
      for (let i = 0; i < 36; i++) {
        const ex = (i * 53 + game.distance * 16) % (W + 50) - 25;
        const ey = H - ((i * 31 + game.distance * 9) % (H + 80));
        ctx.fillStyle = `rgba(255,170,90,${0.10 + (i % 4) * 0.05})`;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 1.3 + (i % 3), 2.2 + (i % 2), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (element === 'shadow') {
      for (let i = 0; i < 8; i++) {
        const mx = (i * 150 + game.distance * 5 * (i + 1)) % (W + 220) - 110;
        ctx.fillStyle = `rgba(70,56,115,${0.06 + i * 0.02})`;
        ctx.beginPath();
        ctx.ellipse(mx, 90 + i * 55, 120 + i * 25, 18 + i * 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (game.flash > 0.02) {
      ctx.fillStyle = `rgba(255,245,220,${game.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawDragon() {
    const p = game.player;
    const skin = SKINS[p.skin] || SKINS.ember;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.angle * Math.PI) / 180);
    if (p.phaseFrames > 0) ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 70) * 0.15;

    ctx.beginPath();
    ctx.ellipse(0, 0, p.w * 0.62, p.h * 0.86, 0, 0, Math.PI * 2);
    ctx.fillStyle = skin.color;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(8,12,24,0.45)';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-7, 5, p.w * 0.34, p.h * 0.46, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,243,220,0.95)';
    ctx.fill();

    const wingAngle = Math.sin(performance.now() / 95) * 0.6 + p.wing * 0.8;
    ctx.save();
    ctx.translate(-8, -4);
    ctx.rotate(-0.25 + wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-32, -15, -54, 10);
    ctx.quadraticCurveTo(-30, 0, 0, 0);
    ctx.fillStyle = skin.accent;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(p.w * 0.55, 5);
    ctx.quadraticCurveTo(p.w * 0.95, 12, p.w * 1.2, 17);
    ctx.quadraticCurveTo(p.w * 0.98, 7, p.w * 0.7, 5);
    ctx.fillStyle = skin.accent;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-p.w * 0.78, -p.h * 0.2, p.w * 0.28, p.h * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = skin.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-p.w * 0.88, -p.h * 0.28, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();

    ctx.fillStyle = '#fff2cf';
    ctx.beginPath();
    ctx.moveTo(-p.w * 0.92, -p.h * 0.42);
    ctx.lineTo(-p.w * 0.84, -p.h * 0.63);
    ctx.lineTo(-p.w * 0.78, -p.h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-p.w * 0.76, -p.h * 0.4);
    ctx.lineTo(-p.w * 0.68, -p.h * 0.58);
    ctx.lineTo(-p.w * 0.64, -p.h * 0.34);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-p.w * 0.88, -p.h * 0.28, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.sin(performance.now() / 120) * 0.04})`;
    ctx.fill();

    if (p.shieldFrames > 0) {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.w * 0.92, p.h * 1.2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(120,240,164,${0.4 + 0.25 * Math.sin(performance.now() / 90)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (p.mutation.type) {
      ctx.beginPath();
      ctx.arc(p.w * 0.35, -10, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f0abfc';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawObstacles() {
    for (const ob of game.obstacles) {
      if (ob.type === 'pillar') {
        ctx.fillStyle = ob.color;
        ctx.fillRect(ob.x, 0, ob.w, ob.gapY);
        ctx.fillRect(ob.x, ob.gapY + ob.gap, ob.w, H - (ob.gapY + ob.gap));
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(ob.x + ob.w * 0.18, 0, ob.w * 0.16, ob.gapY);
        ctx.fillRect(ob.x + ob.w * 0.18, ob.gapY + ob.gap, ob.w * 0.16, H - (ob.gapY + ob.gap));
      } else {
        ctx.save();
        ctx.translate(ob.x, ob.y || 0);
        if (ob.type === 'hunter') {
          ctx.fillStyle = '#d6a35a';
          ctx.fillRect(-18, -12, 36, 24);
          ctx.fillStyle = '#8b5b2b';
          ctx.fillRect(4, -3, 20, 4);
        } else if (ob.type === 'wyvern') {
          ctx.fillStyle = '#90b8ff';
          ctx.beginPath();
          ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(-6, -1);
          ctx.quadraticCurveTo(-24, -14, -34, 5);
          ctx.quadraticCurveTo(-18, 0, -6, -1);
          ctx.fill();
        } else if (ob.type === 'airship') {
          ctx.fillStyle = '#f59e9e';
          ctx.beginPath();
          ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#6b7280';
          ctx.fillRect(-18, 9, 36, 8);
        } else if (ob.type === 'wizard') {
          ctx.fillStyle = '#b794f4';
          ctx.fillRect(-12, -16, 24, 30);
          ctx.beginPath();
          ctx.arc(0, -18, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (ob.type === 'orb') {
          const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
          grd.addColorStop(0, 'rgba(255,255,255,0.8)');
          grd.addColorStop(1, 'rgba(196,181,253,0.15)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c4b5fd';
          ctx.stroke();
        }
        if (ob.hp && ob.hp < 40 && ob.type !== 'pillar') {
          ctx.fillStyle = 'rgba(0,0,0,.35)';
          ctx.fillRect(-18, -24, 36, 4);
          ctx.fillStyle = '#ff8b8b';
          ctx.fillRect(-18, -24, (36 * Math.max(0, ob.hp)) / (ob.type === 'airship' ? 38 : 24), 4);
        }
        ctx.restore();
      }
    }
  }

  function drawProjectiles() {
    for (const pr of game.projectiles) {
      ctx.save();
      ctx.translate(pr.x, pr.y);
      if (pr.w) {
        ctx.fillStyle = pr.color || '#fff';
        ctx.fillRect(-pr.w / 2, -pr.h / 2, pr.w, pr.h);
      } else {
        const r = pr.r || 6;
        ctx.fillStyle = pr.color || '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        if (pr.aoe) {
          ctx.strokeStyle = 'rgba(255,255,255,.35)';
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const pick of game.pickups) {
      ctx.save();
      ctx.translate(pick.x, pick.y);
      ctx.globalAlpha = 0.95;
      if (pick.type === 'crystal') {
        ctx.fillStyle = '#8fe7ff';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 12);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
      } else if (pick.type === 'ember') {
        ctx.fillStyle = '#ffbe6b';
        ctx.beginPath();
        ctx.arc(0, 0, 7 + Math.sin(pick.pulse) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#c4b5fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawPortals() {
    for (const po of game.portals) {
      ctx.save();
      ctx.translate(po.x, po.y);
      ctx.strokeStyle = po.path === 'danger' ? '#f87171' : '#86efac';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, po.r + Math.sin(performance.now() / 110) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath();
      ctx.arc(0, 0, po.r - 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = po.path === 'danger' ? '#fecaca' : '#dcfce7';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(po.path === 'danger' ? 'DANGER' : 'SAFE', 0, 4);
      ctx.restore();
    }
  }

  function drawBoss() {
    if (!game.boss) return;
    const b = game.boss;
    if (b.introMs > 0) {
      const p = Math.max(0, Math.min(1, b.introMs / 1800));
      ctx.save();
      ctx.globalAlpha = 0.3 + (1 - p) * 0.25;
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(Math.min(W - 180, b.x), b.y, 90 + (1 - p) * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,230,230,${0.14 * (1 - p)})`;
      ctx.fillRect(0, 0, W, 46);
      ctx.fillStyle = '#fee2e2';
      ctx.font = '700 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`BOSS WARNING: ${b.name}`, W / 2, 30);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.id === 'boss_serpent' ? '#9ae6b4' : b.id === 'boss_galleon' ? '#fca5a5' : '#c4b5fd';
    if (b.id === 'boss_serpent') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 62, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-60, 0, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.id === 'boss_galleon') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-24, 28, 48, 12);
    } else {
      ctx.fillRect(-34, -46, 68, 92);
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(0, -56, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    const now = performance.now();
    for (const pt of game.particles) {
      const lifePct = 1 - (now - pt.t) / pt.life;
      if (lifePct <= 0) continue;
      ctx.save();
      ctx.globalAlpha = lifePct;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, pt.size, pt.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFloaters() {
    const now = performance.now();
    for (const f of game.floaters) {
      const p = 1 - (now - f.t) / f.life;
      if (p <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p);
      ctx.font = `700 ${f.size || 14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color || '#fff';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  function drawAbilityFX() {
    const now = performance.now();
    for (const fx of game.abilityFx) {
      const age = now - fx.t;
      const p = Math.max(0, 1 - age / fx.life);
      if (p <= 0) continue;
      ctx.save();
      if (fx.shape === 'beam') {
        const color = fx.kind === 'storm' ? '216,180,254' : '255,192,122';
        const g = ctx.createLinearGradient(fx.x - 24, fx.y, fx.x + fx.w, fx.y);
        g.addColorStop(0, `rgba(${color},${0.0})`);
        g.addColorStop(0.15, `rgba(${color},${0.22 * p})`);
        g.addColorStop(1, `rgba(${color},${0.0})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(fx.x + fx.w * 0.5, fx.y, fx.w * 0.5, fx.h * (0.36 + 0.18 * p), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const stroke = fx.kind === 'ice' ? 'rgba(165,243,252,' : 'rgba(196,181,253,';
        ctx.strokeStyle = `${stroke}${0.45 * p})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, (fx.r || 120) * (0.7 + 0.35 * (1 - p)), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawGhost() {
    if (!ghostEnabled || !game.ghostTrace || !game.ghostTrace.length || game.paused || game.over) return;
    const idx = Math.min(game.ghostFrame, game.ghostTrace.length - 1);
    const p = game.ghostTrace[idx];
    if (!p) return;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#93c5fd';
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  if (game.cameraShake > 0.2) {
    ctx.translate(rng(-game.cameraShake, game.cameraShake), rng(-game.cameraShake, game.cameraShake));
  }
  renderBackground();
  drawPortals();
  drawAbilityFX();
  drawObstacles();
  drawProjectiles();
  drawPickups();
  drawBoss();
  drawGhost();
  drawParticles();
  drawFloaters();
  if (game.player) drawDragon();

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(game.pathMode === 'danger' ? 'Danger Route' : 'Safe Route', W - 12, 22);
  if (game.boss) ctx.fillText(game.boss.name, W - 12, 40);
  if (game.levelTransitionMs > 0 || game.levelLabel) {
    const p = Math.max(0, Math.min(1, game.levelTransitionMs / 2200));
    ctx.fillStyle = `rgba(6,10,22,${0.45 + p * 0.25})`;
    ctx.fillRect(0, H * 0.38, W, 90);
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.levelLabel || `Level ${game.level}`, W * 0.5, H * 0.45);
    ctx.fillStyle = '#dbeafe';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('Next stage difficulty increased', W * 0.5, H * 0.45 + 28);
    ctx.textAlign = 'right';
  }
  ctx.restore();
}
