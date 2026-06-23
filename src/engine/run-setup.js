export function freshPlayerState(H) {
  return {
    x: 140, y: H / 2, w: 62, h: 38, vy: 0, angle: 0, wing: 0,
    hp: 3, maxHp: 3, shieldFrames: 0, phaseFrames: 0, invulnFrames: 0,
    shadowAuraCd: 0,
    mutation: { type: null, until: 0 },
    skin: 'ember'
  };
}

export function preferredBiomeIndex(elementKey, ELEMENT_START_BIOME, BIOMES) {
  const want = ELEMENT_START_BIOME[elementKey];
  const idx = BIOMES.findIndex((b) => b.id === want);
  return idx >= 0 ? idx : 0;
}

export function baseRelicModifiers() {
  return {
    cooldownMult: 1,
    flap: 0,
    hp: 0,
    shieldFrames: 0,
    crystalMult: 1,
    mutationMult: 1,
    portalRate: 1,
    dangerBonus: 0,
    nearCombo: 0,
    nearScore: 0,
    finisherBonus: 0,
    crystalDupChance: 0,
    windFang: false
  };
}

export function applySkillTreeBonuses({ game, meta }) {
  game.bonuses = {
    abilityPlus: meta.skills.ember,
    flapPlus: meta.skills.aerodynamics * 0.12,
    shieldChance: meta.skills.warding * 0.08,
    scoreBoost: meta.skills.greed * 0.04
  };
}

export function selectLoadoutFromUI(ui) {
  const r1 = ui.relic1Select.value;
  const r2 = ui.relic2Select.value === r1 ? 'scale_mail' : ui.relic2Select.value;
  return {
    modeKey: ui.modeSelect.value,
    elementKey: ui.elementSelect.value,
    startBiome: ui.biomeSelect.value,
    relics: [r1, r2],
    skin: ui.skinSelect.value,
    pet: ui.petSelect.value
  };
}

export function resetGameState(deps) {
  const {
    game,
    meta,
    ui,
    MODES,
    BIOMES,
    ELEMENTS,
    ELEMENT_START_BIOME,
    RELICS,
    PETS,
    todayKey,
    saveMeta,
    levelDurationFor,
    activeBiome,
    rng,
    hashString,
    seeded,
    ghostEnabled,
    updateHUD,
    updateQuestUI,
    freshPlayer,
    baseRelicMods,
    applySkillTree,
    preferredBiomeIndexForElement
  } = deps;

  const loadout = selectLoadoutFromUI(ui);
  meta.selectedSkin = loadout.skin;
  meta.selectedPet = loadout.pet;
  saveMeta();

  game.modeKey = loadout.modeKey;
  game.modeConfig = MODES[game.modeKey];
  game.elementKey = loadout.elementKey;
  const chosenBiomeIdx = BIOMES.findIndex((b) => b.id === loadout.startBiome);
  game.biomeIndex = loadout.startBiome === 'auto'
    ? preferredBiomeIndexForElement(game.elementKey, ELEMENT_START_BIOME, BIOMES)
    : (chosenBiomeIdx >= 0 ? chosenBiomeIdx : preferredBiomeIndexForElement(game.elementKey, ELEMENT_START_BIOME, BIOMES));
  game.score = 0;
  game.distance = 0;
  game.baseSpeed = (game.modeConfig.speed || 1) * 2.2;
  game.speed = game.baseSpeed;
  game.gravity = game.modeKey === 'hardcore' ? 0.4 : 0.36;
  game.flapPower = game.modeKey === 'hardcore' ? -7.7 : -7.35;
  game.obstacles = [];
  game.projectiles = [];
  game.pickups = [];
  game.particles = [];
  game.portals = [];
  game.abilityFx = [];
  game.floaters = [];
  game.boss = null;
  game.obstacleTimer = 0;
  game.biomeTimer = 0;
  game.eventTimer = 0;
  game.cameraShake = 0;
  game.hitStop = 0;
  game.flash = 0;
  game.bossCheckScore = 0;
  game.pathMode = 'safe';
  game.pathTimer = 0;
  game.safePickupMs = 0;
  game.slowTimeMs = 0;
  game.level = 1;
  game.levelTimeMs = levelDurationFor(1);
  game.levelTransitionMs = 0;
  game.levelLabel = '';
  game.levelClears = 0;
  game.combo = 0;
  game.comboPeak = 0;
  game.comboTimer = 0;
  game.comboMeter = 0;
  game.nearMisses = 0;
  game.finisherCount = 0;
  game.scoreMultiplier = 1;
  game.runCrystals = 0;
  game.runStats = { kills: 0, bossesDefeated: 0, abilitiesUsed: 0, usedAbility: false, biomeReached: activeBiome().name, crystals: 0, finishers: 0 };
  game.rewards = [];
  game.relics = loadout.relics;
  game.relicMods = baseRelicMods();
  applySkillTree({ game, meta });
  for (const id of game.relics) RELICS[id]?.apply(game);
  PETS[loadout.pet]?.apply(game);

  game.player = freshPlayer();
  game.player.skin = loadout.skin;
  game.player.maxHp = Math.max(game.modeKey === 'hardcore' ? 1 : 2, 3 + game.relicMods.hp + (game.modeKey === 'hardcore' ? -2 : 0));
  game.player.hp = game.player.maxHp;
  if (rng(0, 1, game.modeConfig.seeded) < game.bonuses.shieldChance) game.player.shieldFrames = 90;

  game.fireCooldown = Math.floor(ELEMENTS[game.elementKey].cooldown * game.relicMods.cooldownMult * (1 - meta.skills.ember * 0.04));
  game.fireLast = performance.now() - game.fireCooldown;

  if (game.modeConfig.seeded) seeded.set(hashString(`${todayKey}:${game.elementKey}:${game.relics.join(',')}`));
  else seeded.set((Math.random() * 1e9) >>> 0);

  game.ghostTrace = (ghostEnabled && Array.isArray(meta.ghostTrace)) ? meta.ghostTrace.slice(0, 6000) : [];
  game.ghostMeta = meta.ghostMeta || null;
  game.ghostFrame = 0;
  game.trail = [];
  game.high = game.modeKey === 'daily' ? Number(meta.dailyBestByDate[todayKey] || 0) : Number(meta.bestScores[game.modeKey] || 0);

  updateHUD();
  updateQuestUI();
  ui.runStatePill.textContent = 'Running';
  ui.runStatePill.className = 'pill';
}
