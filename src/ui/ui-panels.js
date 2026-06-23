/**
 * @param {{ui:any,game:any,meta:any,ghostEnabled:boolean,activeBiome:()=>any,MODES:any,ELEMENTS:any,getCooldownPct:()=>number,formatMs:(ms:number)=>string}} deps
 */
export function updateHUD(deps) {
  const { ui, game, meta, ghostEnabled, activeBiome, MODES, ELEMENTS, getCooldownPct, formatMs } = deps;
  const biome = activeBiome();
  const scoreInt = Math.floor(game.score);
  ui.hudScore.textContent = scoreInt;
  ui.hudHigh.textContent = Math.floor(game.high || 0);
  ui.hudMode.textContent = game.modeKey;
  ui.hudBiome.textContent = biome.name;
  ui.hudElement.textContent = ELEMENTS[game.elementKey].name;
  ui.hudCombo.textContent = game.combo;
  ui.hudNear.textContent = game.nearMisses;
  ui.multTag.textContent = `x${game.scoreMultiplier.toFixed(1)}`;
  ui.hudLevel.textContent = game.level;
  ui.hudLevelTimer.textContent = formatMs(game.levelTimeMs);

  ui.sideScore.textContent = scoreInt;
  ui.sideHigh.textContent = Math.floor(game.high || 0);
  ui.sideCombo.textContent = game.combo;
  ui.sideMode.textContent = MODES[game.modeKey].name;
  ui.sideElement.textContent = ELEMENTS[game.elementKey].name;
  ui.sideBiome.textContent = biome.name;
  ui.sideBoss.textContent = game.boss ? game.boss.name : 'None';
  ui.dangerPathBadge.textContent = game.pathMode === 'danger' ? 'Danger Path' : 'Safe Path';
  ui.dangerPathBadge.style.color = game.pathMode === 'danger' ? '#fecaca' : '#dcfce7';

  ui.comboBar.style.transform = `scaleX(${Math.max(0, Math.min(1, game.comboMeter))})`;
  ui.comboText.textContent = `${Math.round(game.comboMeter * 100)}%`;
  ui.nearMissCount.textContent = game.nearMisses;
  ui.finisherCount.textContent = game.finisherCount;
  ui.runCrystals.textContent = game.runCrystals;

  const pct = getCooldownPct();
  ui.fireBar.style.transform = `scaleX(${pct})`;
  ui.firePct.textContent = pct >= 1 ? 'Ready' : `${Math.round(pct * 100)}%`;
  ui.abilityName.textContent = ELEMENTS[game.elementKey].ability;

  const hpPct = game.player ? Math.max(0, game.player.hp / Math.max(1, game.player.maxHp)) : 1;
  ui.hpBar.style.transform = `scaleX(${hpPct})`;
  ui.hpText.textContent = game.player
    ? `${game.player.hp}/${game.player.maxHp}${game.player.shieldFrames > 0 ? ' +shield' : ''}${game.player.phaseFrames > 0 ? ' +phase' : ''}`
    : '-';
  ui.mutationText.textContent = game.player?.mutation?.type ? game.player.mutation.type.replace('_', ' ') : 'None';

  if (game.boss) {
    ui.hudBossLine.style.display = 'block';
    ui.hudBossName.textContent = game.boss.name;
    ui.bossBar.style.transform = `scaleX(${Math.max(0, game.boss.hp / game.boss.maxHp)})`;
    ui.bossHpText.textContent = `${Math.ceil(game.boss.hp)} / ${game.boss.maxHp}`;
  } else {
    ui.hudBossLine.style.display = 'none';
    ui.bossBar.style.transform = 'scaleX(0)';
    ui.bossHpText.textContent = '-';
  }

  ui.lastRunScore.textContent = meta.lastRunScore || 0;
  ui.bestLevel.textContent = Math.max(1, Number(meta.highestLevelCleared || 1));
  ui.ghostStatus.textContent = ghostEnabled ? (meta.ghostTrace?.length ? `Loaded (${meta.ghostTrace.length} frames)` : 'No trace yet') : 'Off';
  ui.ghostBtn.textContent = `Ghost: ${ghostEnabled ? 'On' : 'Off'}`;
  ui.ghostBtn.dataset.active = ghostEnabled ? 'true' : 'false';
}

/**
 * @param {{ui:any,meta:any,SKINS:any,PETS:any,ACHIEVEMENTS:any,onUpgradeSkill:(key:string)=>void}} deps
 */
export function renderMetaPanels(deps) {
  const { ui, meta, SKINS, PETS, ACHIEVEMENTS, onUpgradeSkill } = deps;
  ui.metaCrystals.textContent = meta.crystals;
  ui.metaPoints.textContent = `${meta.skillPoints} SP`;
  ui.achCount.textContent = Object.keys(meta.achievements || {}).length;
  ui.bestiaryCount.textContent = Object.keys(meta.bestiary || {}).length;

  ui.skillTree.innerHTML = '';
  const skillDefs = [
    ['ember', 'Ember Mastery', 'Ability cooldown / strength'],
    ['aerodynamics', 'Aerodynamics', 'Flap control and glide'],
    ['warding', 'Warding Scales', 'Start-run shield chance'],
    ['greed', 'Golden Hoard', 'Score multiplier and run rewards']
  ];
  for (const [key, name, desc] of skillDefs) {
    const wrap = document.createElement('div');
    wrap.className = 'item';
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div><div>${name}</div><div class="small">${desc}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn slim';
    btn.textContent = `Lv ${meta.skills[key]} • +`;
    btn.disabled = meta.skillPoints <= 0 || meta.skills[key] >= 5;
    btn.addEventListener('click', () => onUpgradeSkill(key));
    row.appendChild(btn);
    wrap.appendChild(row);
    ui.skillTree.appendChild(wrap);
  }

  ui.unlockList.innerHTML = '';
  const unlockItems = [];
  for (const key of meta.unlockedSkins) unlockItems.push(`Skin: ${SKINS[key]?.name || key}`);
  for (const key of meta.unlockedPets) unlockItems.push(`Pet: ${PETS[key]?.name || key}`);
  unlockItems.slice(0, 8).forEach((text) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = text;
    ui.unlockList.appendChild(div);
  });

  ui.achievementList.innerHTML = '';
  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    const unlocked = !!meta.achievements[id];
    const div = document.createElement('div');
    div.className = 'item' + (unlocked ? ' done' : '');
    div.innerHTML = `<div class="row"><strong>${ach.name}</strong><span class="pill">${unlocked ? 'Unlocked' : 'Locked'}</span></div><div class="small">${ach.desc}</div>`;
    ui.achievementList.appendChild(div);
  }
}

/**
 * @param {{ui:any,meta:any}} deps
 */
export function updateQuestUI(deps) {
  const { ui, meta } = deps;
  ui.questList.innerHTML = '';
  for (const q of meta.quests || []) {
    const div = document.createElement('div');
    div.className = 'item' + (q.done ? ' done' : '');
    div.innerHTML = `<div class="row"><strong>${q.title}</strong><span class="pill">${q.progress}/${q.goal}</span></div><div class="small">${q.claimed ? 'Reward claimed' : (q.done ? 'Completed' : 'In progress')}</div>`;
    ui.questList.appendChild(div);
  }
}

/**
 * @param {{ui:any,ELEMENTS:any}} deps
 */
export function updateElementGuide(deps) {
  const { ui, ELEMENTS } = deps;
  const key = ui.elementSelect.value;
  const el = ELEMENTS[key];
  const sceneMap = {
    fire: 'Volcanic embers / heat glow',
    ice: 'Winter snow / frost particles',
    storm: 'Wind rain / lightning sky',
    shadow: 'Dark mist / shadow haze'
  };
  ui.abilityTag.textContent = `F (${el.ability})`;
  if (ui.elementGuide) {
    ui.elementGuide.innerHTML =
      `<div class="row"><strong>Element Power</strong><span class="pill">${el.name}</span></div>` +
      `<div class="small">${el.desc} Background: ${sceneMap[key]}.</div>`;
  }
}
