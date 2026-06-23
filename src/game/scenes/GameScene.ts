import Phaser from 'phaser';
import { DEPTHS, EVENTS, GAME_HEIGHT, GAME_WIDTH, MODES } from '../constants';
import { getHighScore, setHighScore } from '../persistence';
import type { GameOverPayload, GameSceneData, ModeConfig, PickupKind } from '../types';

interface PillarPair {
  parts: Phaser.GameObjects.Rectangle[];
  x: number;
  width: number;
  scored: boolean;
  danger: boolean;
}

interface PickupItem {
  sprite: Phaser.GameObjects.Image;
  kind: PickupKind;
}

interface Star {
  dot: Phaser.GameObjects.Arc;
  speed: number;
}

export class GameScene extends Phaser.Scene {
  private mode: ModeConfig = MODES[0];
  private highScore = 0;
  private score = 0;
  private distance = 0;
  private health = 3;
  private maxHealth = 3;
  private velocity = 0;
  private speed = 0;
  private spawnTimer = 0;
  private timeAlive = 0;
  private fireCooldown = 0;
  private readonly fireCooldownMax = 1650;
  private lastCooldownHintAt = 0;
  private invulnerableMs = 0;
  private shieldMs = 0;
  private pausedRun = false;
  private gameEnded = false;

  private dragon?: Phaser.GameObjects.Container;
  private wing?: Phaser.GameObjects.Triangle;
  private pillars: PillarPair[] = [];
  private pickups: PickupItem[] = [];
  private stars: Star[] = [];
  private horizon?: Phaser.GameObjects.TileSprite;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private touchControlGraphics?: Phaser.GameObjects.Graphics;
  private fireButtonLabel?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;

  private spaceKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private wKey?: Phaser.Input.Keyboard.Key;
  private fKey?: Phaser.Input.Keyboard.Key;
  private pKey?: Phaser.Input.Keyboard.Key;
  private escKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('GameScene');
  }

  create(data: GameSceneData) {
    this.mode = MODES.find((mode) => mode.key === data.mode) ?? MODES[0];
    this.highScore = getHighScore(this.mode.key);
    this.score = 0;
    this.distance = 0;
    this.health = this.mode.health;
    this.maxHealth = this.mode.health;
    this.velocity = 0;
    this.speed = this.mode.speed;
    this.spawnTimer = this.mode.spawnMs * 0.55;
    this.timeAlive = 0;
    this.fireCooldown = 0;
    this.lastCooldownHintAt = 0;
    this.invulnerableMs = 0;
    this.shieldMs = 0;
    this.pausedRun = false;
    this.gameEnded = false;
    this.pillars = [];
    this.pickups = [];
    this.stars = [];

    this.drawWorld();
    this.createDragon();
    this.createInput();
    this.createPauseOverlay();
    this.createTouchControls();
    this.createRunHint();

    this.scene.stop('HudScene');
    this.scene.launch('HudScene');
    this.emitHud();
  }

  update(_: number, delta: number) {
    if (!this.dragon || this.gameEnded) return;
    this.readInput();

    if (this.pausedRun) {
      this.emitHud();
      return;
    }

    const seconds = delta / 1000;
    this.timeAlive += seconds;
    this.spawnTimer += delta;
    const wasFireCooling = this.fireCooldown > 0;
    this.invulnerableMs = Math.max(0, this.invulnerableMs - delta);
    this.shieldMs = Math.max(0, this.shieldMs - delta);
    this.fireCooldown = Math.max(0, this.fireCooldown - delta);
    if (wasFireCooling && this.fireCooldown === 0) {
      this.showFloatText('Fire ready', this.dragon.x + 58, this.dragon.y - 40, '#ffd36b');
    }

    this.speed = this.mode.speed + Math.min(150, this.timeAlive * 4.5 + this.score * 0.22);
    this.distance += (this.speed * seconds) / 8;
    this.addScore(seconds * 1.8, false);

    this.velocity += this.mode.gravity * delta;
    this.dragon.y += this.velocity * delta;
    this.dragon.angle = Phaser.Math.Clamp(this.velocity * 110, -28, 58);
    this.dragon.alpha = this.invulnerableMs > 0 && Math.floor(this.time.now / 80) % 2 === 0 ? 0.48 : 1;

    this.animateWorld(seconds);
    this.updateObstacles(seconds, delta);
    this.updatePickups(seconds);
    this.updateTouchControls();
    this.updateRunHint();
    this.checkWorldBounds();
    this.emitHud();
  }

  private drawWorld() {
    const g = this.add.graphics().setDepth(DEPTHS.background);
    g.fillGradientStyle(0x071428, 0x071428, 0x122844, 0x122844, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xff8b49, 0.08);
    g.fillCircle(110, 60, 210);
    g.fillStyle(0x7dd3fc, 0.08);
    g.fillCircle(860, 120, 280);

    for (let i = 0; i < 84; i++) {
      const dot = this.add.circle((i * 67) % GAME_WIDTH, (i * 43) % (GAME_HEIGHT - 60), 1 + (i % 3) * 0.35, 0xffffff, 0.12 + (i % 4) * 0.04)
        .setDepth(DEPTHS.background);
      this.stars.push({ dot, speed: 12 + (i % 6) * 6 });
    }

    const mountainTexture = this.createMountainTexture();
    this.horizon = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT - 54, GAME_WIDTH, 108, mountainTexture)
      .setDepth(DEPTHS.background);
  }

  private createMountainTexture(): string {
    const key = 'mountain-band';
    if (this.textures.exists(key)) return key;

    const g = this.add.graphics();
    g.fillStyle(0x091221, 0.88);
    g.fillRect(0, 76, 320, 44);
    g.fillStyle(0x0f1f35, 0.94);
    g.fillTriangle(0, 120, 70, 34, 150, 120);
    g.fillTriangle(92, 120, 180, 24, 292, 120);
    g.fillStyle(0x142a45, 0.95);
    g.fillTriangle(190, 120, 250, 52, 340, 120);
    g.generateTexture(key, 320, 120);
    g.destroy();
    return key;
  }

  private createDragon() {
    const dragon = this.add.container(176, GAME_HEIGHT / 2).setDepth(DEPTHS.dragon);
    const wing = this.add.triangle(-8, -4, 0, 0, -52, -22, -30, 18, 0xffb15d, 0.92);
    const tail = this.add.triangle(31, 6, 0, 0, 40, 12, 20, 18, 0xffb15d, 1);
    const body = this.add.ellipse(0, 0, 56, 36, 0xff704d, 1);
    const belly = this.add.ellipse(-5, 7, 31, 17, 0xfff0cb, 0.95);
    const head = this.add.ellipse(-35, -9, 25, 23, 0xff704d, 1);
    const eye = this.add.circle(-42, -13, 2.7, 0x111827, 1);
    const hornA = this.add.triangle(-42, -22, 0, 0, 5, -13, 10, 0, 0xfff2cf, 1);
    const hornB = this.add.triangle(-30, -20, 0, 0, 5, -12, 10, 0, 0xfff2cf, 1);
    dragon.add([wing, tail, body, belly, head, eye, hornA, hornB]);
    this.dragon = dragon;
    this.wing = wing;

    this.tweens.add({
      targets: wing,
      angle: -24,
      duration: 160,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  private createInput() {
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.wKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.fKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.pKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.castFire();
      else this.flap();
    });
  }

  private createPauseOverlay() {
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0.42);
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Paused', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#fff3d6'
    }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 52, 'Press P or Esc to resume', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '15px',
      color: '#cbd8f4'
    }).setOrigin(0.5);
    this.pauseOverlay = this.add.container(0, 0, [shade, text, hint])
      .setDepth(DEPTHS.overlay)
      .setVisible(false);
  }

  private createTouchControls() {
    this.touchControlGraphics = this.add.graphics().setDepth(DEPTHS.overlay);

    const fireHit = this.add.circle(GAME_WIDTH - 82, GAME_HEIGHT - 76, 44, 0xffffff, 0.001)
      .setDepth(DEPTHS.overlay)
      .setInteractive({ useHandCursor: true });
    fireHit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.castFire();
    });

    this.fireButtonLabel = this.add.text(GAME_WIDTH - 82, GAME_HEIGHT - 76, 'F', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '25px',
      color: '#142033'
    }).setOrigin(0.5).setDepth(DEPTHS.overlay);

    const pauseHit = this.add.circle(GAME_WIDTH - 48, 46, 28, 0xffffff, 0.001)
      .setDepth(DEPTHS.overlay)
      .setInteractive({ useHandCursor: true });
    pauseHit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.togglePause();
    });

    this.add.text(GAME_WIDTH - 48, 45, 'II', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#e8f0ff'
    }).setOrigin(0.5).setDepth(DEPTHS.overlay);

    this.updateTouchControls();
  }

  private createRunHint() {
    this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Tap / Space to flap    F / fire button to breathe', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#dbe7ff',
      backgroundColor: '#050812',
      padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(DEPTHS.overlay);
  }

  private readInput() {
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.flap();
    if (this.upKey && Phaser.Input.Keyboard.JustDown(this.upKey)) this.flap();
    if (this.wKey && Phaser.Input.Keyboard.JustDown(this.wKey)) this.flap();
    if (this.fKey && Phaser.Input.Keyboard.JustDown(this.fKey)) this.castFire();
    if (this.pKey && Phaser.Input.Keyboard.JustDown(this.pKey)) this.togglePause();
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) this.togglePause();
  }

  private flap() {
    if (this.pausedRun || this.gameEnded) return;
    this.velocity = this.mode.flapVelocity;
    this.wing?.setScale(1.12);
    this.tweens.add({
      targets: this.wing,
      scaleX: 1,
      scaleY: 1,
      duration: 90,
      ease: 'Sine.out'
    });
    this.spawnBurst(this.dragon?.x ?? 176, (this.dragon?.y ?? GAME_HEIGHT / 2) + 18, 0x7dd3fc, 5);
  }

  private togglePause() {
    if (this.gameEnded) return;
    this.pausedRun = !this.pausedRun;
    this.pauseOverlay?.setVisible(this.pausedRun);
  }

  private animateWorld(seconds: number) {
    for (const star of this.stars) {
      star.dot.x -= star.speed * seconds;
      if (star.dot.x < -4) {
        star.dot.x = GAME_WIDTH + 4;
        star.dot.y = Phaser.Math.Between(6, GAME_HEIGHT - 82);
      }
    }
    if (this.horizon) this.horizon.tilePositionX += this.speed * seconds * 0.18;
  }

  private updateObstacles(seconds: number, delta: number) {
    const difficultyMs = Math.min(360, this.timeAlive * 8);
    const interval = Math.max(760, this.mode.spawnMs - difficultyMs);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnPillar();
    }

    const moveBy = this.speed * seconds;
    for (const pillar of this.pillars) {
      pillar.x -= moveBy;
      for (const part of pillar.parts) part.x -= moveBy;
    }

    this.resolvePillarCollision();

    const live: PillarPair[] = [];
    for (const pillar of this.pillars) {
      if (!pillar.scored && pillar.x + pillar.width / 2 < 176) {
        pillar.scored = true;
        this.addScore(pillar.danger ? 12 : 7);
      }
      if (pillar.x > -110) live.push(pillar);
      else this.destroyPillar(pillar);
    }
    this.pillars = live;

    if (this.shieldMs > 0 && this.dragon) {
      this.dragon.setScale(1 + Math.sin(this.time.now / 90) * 0.02);
    } else {
      this.dragon?.setScale(1);
    }

    if (this.invulnerableMs <= 0 && delta > 0) this.dragon?.setAlpha(1);
  }

  private spawnPillar() {
    const danger = Phaser.Math.Between(0, 100) > 72;
    const gap = this.mode.gap + (danger ? -14 : 0);
    const margin = 64;
    const gapY = Phaser.Math.Between(margin, GAME_HEIGHT - margin - gap);
    const width = danger ? 84 : 74;
    const x = GAME_WIDTH + 74;
    const topHeight = gapY;
    const bottomY = gapY + gap;
    const bottomHeight = GAME_HEIGHT - bottomY;
    const color = danger ? 0x4c1d4f : 0x173759;
    const edge = danger ? 0xff8b49 : 0x7dd3fc;

    const top = this.add.rectangle(x, topHeight / 2, width, topHeight, color, 0.98).setDepth(DEPTHS.world);
    const bottom = this.add.rectangle(x, bottomY + bottomHeight / 2, width, bottomHeight, color, 0.98).setDepth(DEPTHS.world);
    const topCap = this.add.rectangle(x, topHeight, width + 16, 14, edge, 0.88).setDepth(DEPTHS.world);
    const bottomCap = this.add.rectangle(x, bottomY, width + 16, 14, edge, 0.88).setDepth(DEPTHS.world);
    const pillar: PillarPair = { parts: [top, bottom, topCap, bottomCap], x, width: width + 16, scored: false, danger };
    this.pillars.push(pillar);

    if (Phaser.Math.Between(0, 100) > 42) {
      const kind = this.pickPickupKind();
      const pickupY = Phaser.Math.Clamp(gapY + gap / 2 + Phaser.Math.Between(-44, 44), 48, GAME_HEIGHT - 48);
      const sprite = this.add.image(x + Phaser.Math.Between(72, 126), pickupY, kind)
        .setDepth(DEPTHS.world)
        .setScale(kind === 'heart' ? 1.25 : 1);
      this.pickups.push({ sprite, kind });
      this.tweens.add({
        targets: sprite,
        y: pickupY + 10,
        duration: 620,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private pickPickupKind(): PickupKind {
    const roll = Phaser.Math.Between(1, 100);
    if (roll > 91 && this.health < this.maxHealth) return 'heart';
    if (roll > 82) return 'shield';
    return 'crystal';
  }

  private resolvePillarCollision() {
    if (!this.dragon || this.invulnerableMs > 0) return;
    const dragonRect = this.dragonBounds();
    for (const pillar of this.pillars) {
      for (const part of pillar.parts) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(dragonRect, part.getBounds())) {
          this.takeDamage(pillar.danger ? 'Clipped a volatile gate.' : 'Clipped a sky gate.');
          return;
        }
      }
    }
  }

  private updatePickups(seconds: number) {
    if (!this.dragon) return;
    const moveBy = this.speed * seconds;
    const dragonRect = this.dragonBounds();
    const live: PickupItem[] = [];

    for (const pickup of this.pickups) {
      pickup.sprite.x -= moveBy;
      pickup.sprite.rotation += seconds * 2.4;
      if (Phaser.Geom.Intersects.RectangleToRectangle(dragonRect, pickup.sprite.getBounds())) {
        this.collectPickup(pickup);
      } else if (pickup.sprite.x > -40) {
        live.push(pickup);
      } else {
        pickup.sprite.destroy();
      }
    }

    this.pickups = live;
  }

  private collectPickup(pickup: PickupItem) {
    const { x, y } = pickup.sprite;
    pickup.sprite.destroy();
    if (pickup.kind === 'heart') {
      this.health = Math.min(this.maxHealth, this.health + 1);
      this.spawnBurst(x, y, 0xff7f7f, 12);
      this.showFloatText('HP +1', x, y - 20, '#ffb3b3');
    } else if (pickup.kind === 'shield') {
      this.shieldMs = 4200;
      this.spawnBurst(x, y, 0x78f0a4, 14);
      this.showFloatText('Shield', x, y - 20, '#a2f7be');
    } else {
      this.addScore(18);
      this.spawnBurst(x, y, 0x7dd3fc, 10);
      this.showFloatText('+18', x, y - 20, '#7dd3fc');
    }
  }

  private castFire() {
    if (!this.dragon || this.pausedRun || this.gameEnded) return;
    if (this.fireCooldown > 0) {
      if (this.time.now - this.lastCooldownHintAt > 650) {
        this.lastCooldownHintAt = this.time.now;
        this.showFloatText('Cooling', this.dragon.x + 70, this.dragon.y - 36, '#7dd3fc');
      }
      return;
    }
    this.fireCooldown = this.fireCooldownMax;
    const beamX = this.dragon.x + 232;
    const beamY = this.dragon.y;
    const glow = this.add.rectangle(beamX, beamY, 440, 42, 0xff8b49, 0.34).setDepth(DEPTHS.effects);
    const core = this.add.rectangle(beamX, beamY, 390, 16, 0xfff2b8, 0.82).setDepth(DEPTHS.effects);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    core.setBlendMode(Phaser.BlendModes.ADD);
    this.cameras.main.shake(90, 0.003);

    let cleared = 0;
    const beamRect = new Phaser.Geom.Rectangle(this.dragon.x + 20, this.dragon.y - 34, 440, 68);
    const live: PillarPair[] = [];
    for (const pillar of this.pillars) {
      const inBeam = pillar.parts.some((part) => Phaser.Geom.Intersects.RectangleToRectangle(beamRect, part.getBounds()));
      if (inBeam) {
        cleared += 1;
        this.spawnBurst(pillar.x, this.dragon.y, 0xffc968, 14);
        this.destroyPillar(pillar);
      } else {
        live.push(pillar);
      }
    }
    this.pillars = live;
    if (cleared > 0) {
      this.addScore(cleared * 15);
      this.showFloatText(`+${cleared * 15}`, this.dragon.x + 120, this.dragon.y - 48, '#ffd36b');
    } else {
      this.showFloatText('Fire', this.dragon.x + 86, this.dragon.y - 46, '#ffd36b');
    }

    this.tweens.add({
      targets: [glow, core],
      alpha: 0,
      scaleX: 1.1,
      duration: 190,
      ease: 'Sine.out',
      onComplete: () => {
        glow.destroy();
        core.destroy();
      }
    });
  }

  private takeDamage(cause: string) {
    if (!this.dragon || this.invulnerableMs > 0) return;
    if (this.shieldMs > 0) {
      this.shieldMs = 0;
      this.invulnerableMs = 620;
      this.spawnBurst(this.dragon.x, this.dragon.y, 0x78f0a4, 16);
      this.showFloatText('Shielded', this.dragon.x + 34, this.dragon.y - 38, '#a2f7be');
      this.cameras.main.flash(120, 120, 240, 164);
      return;
    }

    this.health -= 1;
    this.invulnerableMs = 980;
    this.cameras.main.shake(130, 0.006);
    this.cameras.main.flash(130, 255, 127, 127);
    this.spawnBurst(this.dragon.x, this.dragon.y, 0xff7f7f, 12);
    this.showFloatText('-1 HP', this.dragon.x + 32, this.dragon.y - 38, '#ffb3b3');
    if (this.health <= 0) this.endRun(cause);
  }

  private checkWorldBounds() {
    if (!this.dragon) return;
    if (this.dragon.y < 24) {
      if (this.mode.key === 'zen') {
        this.dragon.y = 24;
        this.velocity = Math.abs(this.velocity) * 0.45;
      } else {
        this.takeDamage('Flew above the safe current.');
        this.dragon.y = 26;
        this.velocity = 0.08;
      }
    } else if (this.dragon.y > GAME_HEIGHT - 26) {
      if (this.mode.key === 'zen') {
        this.dragon.y = GAME_HEIGHT - 26;
        this.velocity = -Math.abs(this.velocity) * 0.45;
      } else {
        this.takeDamage('Hit the lower cloudbreak.');
        this.dragon.y = GAME_HEIGHT - 28;
        this.velocity = -0.08;
      }
    }
  }

  private addScore(amount: number, useMultiplier = true) {
    this.score += amount * (useMultiplier ? this.mode.scoreMultiplier : 1);
  }

  private dragonBounds(): Phaser.Geom.Rectangle {
    const dragon = this.dragon;
    if (!dragon) return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    return new Phaser.Geom.Rectangle(dragon.x - 31, dragon.y - 23, 58, 43);
  }

  private spawnBurst(x: number, y: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const spark = this.add.image(x, y, 'spark')
        .setDepth(DEPTHS.effects)
        .setTint(color)
        .setAlpha(0.86)
        .setScale(Phaser.Math.FloatBetween(0.6, 1.3));
      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-40, 40),
        y: y + Phaser.Math.Between(-34, 34),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(280, 520),
        ease: 'Sine.out',
        onComplete: () => spark.destroy()
      });
    }
  }

  private updateTouchControls() {
    const g = this.touchControlGraphics;
    if (!g) return;

    const ratio = Phaser.Math.Clamp(1 - this.fireCooldown / this.fireCooldownMax, 0, 1);
    const fireX = GAME_WIDTH - 82;
    const fireY = GAME_HEIGHT - 76;

    g.clear();
    g.fillStyle(0x050812, 0.58);
    g.fillCircle(fireX, fireY, 44);
    g.lineStyle(3, 0xffffff, 0.16);
    g.strokeCircle(fireX, fireY, 44);
    g.beginPath();
    g.slice(fireX, fireY, 37, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio, false);
    g.lineStyle(6, ratio >= 1 ? 0xffd36b : 0x7dd3fc, 0.96);
    g.strokePath();
    g.fillStyle(ratio >= 1 ? 0xffd36b : 0x263247, 1);
    g.fillCircle(fireX, fireY, 29);
    this.fireButtonLabel?.setColor(ratio >= 1 ? '#142033' : '#dbe7ff');

    g.fillStyle(0x050812, 0.58);
    g.fillCircle(GAME_WIDTH - 48, 46, 28);
    g.lineStyle(2, 0xffffff, 0.16);
    g.strokeCircle(GAME_WIDTH - 48, 46, 28);
  }

  private updateRunHint() {
    if (!this.hintText || this.timeAlive <= 5.2) return;

    const hint = this.hintText;
    this.hintText = undefined;
    this.tweens.add({
      targets: hint,
      alpha: 0,
      y: GAME_HEIGHT - 42,
      duration: 260,
      ease: 'Sine.out',
      onComplete: () => hint.destroy()
    });
  }

  private showFloatText(text: string, x: number, y: number, color: string) {
    const floater = this.add.text(x, y, text, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '15px',
      color,
      backgroundColor: '#050812',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(DEPTHS.effects);

    this.tweens.add({
      targets: floater,
      y: y - 34,
      alpha: 0,
      duration: 760,
      ease: 'Sine.out',
      onComplete: () => floater.destroy()
    });
  }

  private destroyPillar(pillar: PillarPair) {
    for (const part of pillar.parts) part.destroy();
  }

  private endRun(cause: string) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    const finalScore = Math.floor(this.score);
    const previousHighScore = this.highScore;
    this.highScore = setHighScore(this.mode.key, finalScore);
    const payload: GameOverPayload = {
      mode: this.mode.key,
      modeLabel: this.mode.label,
      score: finalScore,
      previousHighScore,
      highScore: this.highScore,
      distance: this.distance,
      survivedSeconds: this.timeAlive,
      cause
    };
    this.emitHud();
    this.scene.stop('HudScene');
    this.scene.start('GameOverScene', payload);
  }

  private emitHud() {
    this.game.events.emit(EVENTS.hud, {
      score: Math.floor(this.score),
      highScore: Math.max(this.highScore, Math.floor(this.score)),
      health: this.health,
      maxHealth: this.maxHealth,
      modeLabel: this.mode.label,
      distance: this.distance,
      abilityRatio: 1 - this.fireCooldown / this.fireCooldownMax,
      paused: this.pausedRun
    });
  }
}
