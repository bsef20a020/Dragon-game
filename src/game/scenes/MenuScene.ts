import Phaser from 'phaser';
import { DEPTHS, GAME_HEIGHT, GAME_WIDTH, MODES } from '../constants';
import { getHighScore } from '../persistence';
import type { ModeConfig } from '../types';

export class MenuScene extends Phaser.Scene {
  private selectedIndex = 0;
  private modeCards: Phaser.GameObjects.Container[] = [];
  private startText?: Phaser.GameObjects.Text;
  private startButtonBg?: Phaser.GameObjects.Rectangle;
  private bestText?: Phaser.GameObjects.Text;
  private summaryText?: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  create() {
    this.drawBackdrop();

    this.add.text(48, 42, 'Dragon Flight', {
      fontFamily: 'Georgia, serif',
      fontSize: '58px',
      color: '#fff3d6'
    }).setDepth(DEPTHS.overlay);

    this.add.text(52, 112, 'Phaser Edition', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '18px',
      color: '#92d8ff'
    }).setDepth(DEPTHS.overlay);

    this.add.text(52, 168, 'Choose a run mode', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '22px',
      color: '#e8f0ff'
    });

    this.createModeCards();
    this.createDragonPreview();

    this.summaryText = this.add.text(52, 404, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '15px',
      color: '#cbd8f4',
      wordWrap: { width: 430 }
    });

    this.bestText = this.add.text(52, 454, '', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#fff3d6'
    });

    const startButton = this.add.container(52, 474)
      .setSize(238, 52)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 238, 52), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => this.startRun())
      .on('pointerover', () => this.startButtonBg?.setFillStyle(0xffdf82, 1))
      .on('pointerout', () => this.startButtonBg?.setFillStyle(0xffd36b, 1));

    this.startButtonBg = this.add.rectangle(0, 0, 238, 52, 0xffd36b, 1).setOrigin(0, 0);
    this.startButtonBg.setStrokeStyle(2, 0xffffff, 0.4);
    this.startText = this.add.text(20, 13, 'Start Run', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '20px',
      color: '#142033'
    });
    startButton.add([this.startButtonBg, this.startText]);

    this.add.text(306, 493, 'Space / Enter', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    });

    this.input.keyboard?.on('keydown-LEFT', () => this.selectMode(this.selectedIndex - 1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.selectMode(this.selectedIndex + 1));
    this.input.keyboard?.on('keydown-UP', () => this.selectMode(this.selectedIndex - 1));
    this.input.keyboard?.on('keydown-DOWN', () => this.selectMode(this.selectedIndex + 1));
    this.input.keyboard?.on('keydown-SPACE', () => this.startRun());
    this.input.keyboard?.on('keydown-ENTER', () => this.startRun());

    this.selectMode(this.selectedIndex);
  }

  private drawBackdrop() {
    const g = this.add.graphics().setDepth(DEPTHS.background);
    g.fillGradientStyle(0x071428, 0x071428, 0x102844, 0x102844, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    g.fillStyle(0xff8b49, 0.11);
    g.fillCircle(125, 42, 230);
    g.fillStyle(0x7dd3fc, 0.11);
    g.fillCircle(870, 94, 250);

    for (let i = 0; i < 80; i++) {
      const x = (i * 73) % GAME_WIDTH;
      const y = (i * 41) % GAME_HEIGHT;
      const alpha = 0.12 + (i % 5) * 0.035;
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, 1 + (i % 3) * 0.35);
    }

    g.fillStyle(0x0b1020, 0.54);
    g.fillRoundedRect(28, 24, 474, 506, 18);
    g.lineStyle(1, 0xffffff, 0.1);
    g.strokeRoundedRect(28, 24, 474, 506, 18);
  }

  private createModeCards() {
    MODES.forEach((mode, index) => {
      const x = 52 + (index % 2) * 214;
      const y = 216 + Math.floor(index / 2) * 58;
      const card = this.add.container(x, y).setSize(196, 46).setInteractive({ useHandCursor: true });
      const bg = this.add.rectangle(0, 0, 196, 46, 0x13213a, 0.82).setOrigin(0, 0);
      bg.setStrokeStyle(1, 0xffffff, 0.08);
      const label = this.add.text(14, 8, mode.label, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '15px',
        color: '#e8f0ff'
      });
      const detail = this.add.text(14, 27, `x${mode.scoreMultiplier.toFixed(2)} score`, {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '11px',
        color: '#9fb0d0'
      });
      card.add([bg, label, detail]);
      card.on('pointerdown', () => this.selectMode(index));
      this.modeCards.push(card);
    });
  }

  private createDragonPreview() {
    const dragon = this.add.container(705, 270);
    const wing = this.add.triangle(-8, -4, 0, 0, -72, -26, -42, 20, 0xffb15d, 0.9);
    const body = this.add.ellipse(0, 0, 98, 56, 0xff6f4d, 1);
    const belly = this.add.ellipse(-8, 10, 54, 25, 0xfff0cb, 0.95);
    const head = this.add.ellipse(-55, -13, 36, 32, 0xff6f4d, 1);
    const eye = this.add.circle(-64, -18, 4, 0x111827, 1);
    const tail = this.add.triangle(50, 7, 0, 0, 62, 18, 34, 26, 0xffb15d, 1);
    dragon.add([wing, tail, body, belly, head, eye]);
    this.tweens.add({
      targets: dragon,
      y: 250,
      duration: 1100,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
    this.tweens.add({
      targets: wing,
      angle: -18,
      duration: 220,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });

    this.add.text(604, 348, 'Fast runs. Sharp gates. Fire on command.', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '17px',
      color: '#dbe7ff'
    }).setOrigin(0, 0.5);
  }

  private selectMode(nextIndex: number) {
    const normalized = Phaser.Math.Wrap(nextIndex, 0, MODES.length);
    this.selectedIndex = normalized;

    this.modeCards.forEach((card, index) => {
      const bg = card.list[0] as Phaser.GameObjects.Rectangle;
      if (index === normalized) {
        bg.setFillStyle(0xffc968, 1);
        bg.setStrokeStyle(2, 0xffffff, 0.55);
        (card.list[1] as Phaser.GameObjects.Text).setColor('#142033');
        (card.list[2] as Phaser.GameObjects.Text).setColor('#334155');
      } else {
        bg.setFillStyle(0x13213a, 0.82);
        bg.setStrokeStyle(1, 0xffffff, 0.08);
        (card.list[1] as Phaser.GameObjects.Text).setColor('#e8f0ff');
        (card.list[2] as Phaser.GameObjects.Text).setColor('#9fb0d0');
      }
    });

    const mode = this.currentMode();
    this.summaryText?.setText(mode.summary);
    this.bestText?.setText(`Best ${mode.label}: ${getHighScore(mode.key)}`);
    this.startText?.setText(`Start ${mode.label}`);
  }

  private currentMode(): ModeConfig {
    return MODES[this.selectedIndex] ?? MODES[0];
  }

  private startRun() {
    this.scene.start('GameScene', { mode: this.currentMode().key });
  }
}
