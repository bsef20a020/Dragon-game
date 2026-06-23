import Phaser from 'phaser';
import { DEPTHS, EVENTS, GAME_WIDTH } from '../constants';
import type { HudSnapshot } from '../types';

export class HudScene extends Phaser.Scene {
  private scoreText?: Phaser.GameObjects.Text;
  private metaText?: Phaser.GameObjects.Text;
  private healthText?: Phaser.GameObjects.Text;
  private fireText?: Phaser.GameObjects.Text;
  private distanceText?: Phaser.GameObjects.Text;
  private pauseText?: Phaser.GameObjects.Text;
  private bars?: Phaser.GameObjects.Graphics;

  private readonly handleHud = (snapshot: HudSnapshot) => {
    this.renderHud(snapshot);
  };

  constructor() {
    super('HudScene');
  }

  create() {
    const panel = this.add.rectangle(18, 16, 386, 128, 0x050812, 0.62)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.overlay);
    panel.setStrokeStyle(1, 0xffffff, 0.16);

    this.scoreText = this.add.text(34, 28, 'Score 0', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '27px',
      color: '#fff3d6'
    }).setDepth(DEPTHS.overlay);

    this.metaText = this.add.text(36, 62, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: '#cbd8f4'
    }).setDepth(DEPTHS.overlay);

    this.healthText = this.add.text(36, 92, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: '#e8f0ff'
    }).setDepth(DEPTHS.overlay);

    this.fireText = this.add.text(204, 92, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: '#e8f0ff'
    }).setDepth(DEPTHS.overlay);

    this.distanceText = this.add.text(GAME_WIDTH - 34, 30, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#cbd8f4'
    }).setOrigin(1, 0).setDepth(DEPTHS.overlay);

    this.pauseText = this.add.text(GAME_WIDTH / 2, 32, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '15px',
      color: '#fff3d6',
      backgroundColor: '#0b1020',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5, 0).setDepth(DEPTHS.overlay);

    this.bars = this.add.graphics().setDepth(DEPTHS.overlay);

    this.game.events.on(EVENTS.hud, this.handleHud);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(EVENTS.hud, this.handleHud);
    });
  }

  private renderHud(snapshot: HudSnapshot) {
    this.scoreText?.setText(`Score ${Math.floor(snapshot.score)}`);
    this.metaText?.setText(`${snapshot.modeLabel}  |  Best ${snapshot.highScore}`);
    this.healthText?.setText(`HP ${snapshot.health}/${snapshot.maxHealth}`);
    this.fireText?.setText(snapshot.abilityRatio >= 1 ? 'FIRE READY' : `FIRE ${Math.round(snapshot.abilityRatio * 100)}%`);
    this.distanceText?.setText(`${Math.floor(snapshot.distance)}m`);
    this.pauseText?.setText(snapshot.paused ? 'Paused' : '');

    const healthRatio = Phaser.Math.Clamp(snapshot.health / snapshot.maxHealth, 0, 1);
    const abilityRatio = Phaser.Math.Clamp(snapshot.abilityRatio, 0, 1);
    const g = this.bars;
    if (!g) return;

    g.clear();
    g.fillStyle(0x000000, 0.32);
    g.fillRoundedRect(204, 116, 158, 9, 5);

    const maxPips = Math.max(1, snapshot.maxHealth);
    for (let i = 0; i < maxPips; i++) {
      const x = 52 + i * 20;
      g.fillStyle(i < snapshot.health ? 0xff7f7f : 0x263247, 1);
      g.fillCircle(x, 120, 6);
      g.lineStyle(1, 0xffffff, i < snapshot.health ? 0.28 : 0.12);
      g.strokeCircle(x, 120, 6);
    }

    g.fillStyle(abilityRatio >= 1 ? 0xffd36b : 0x7dd3fc, 1);
    g.fillRoundedRect(204, 116, 158 * abilityRatio, 9, 5);

    if (abilityRatio >= 1) {
      g.lineStyle(2, 0xffd36b, 0.45 + Math.sin(this.time.now / 120) * 0.16);
      g.strokeRoundedRect(200, 112, 166, 17, 8);
    }
  }
}
