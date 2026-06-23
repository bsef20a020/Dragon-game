import Phaser from 'phaser';
import { DEPTHS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { GameOverPayload } from '../types';

export class GameOverScene extends Phaser.Scene {
  private payload?: GameOverPayload;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverPayload) {
    this.payload = data;
    this.drawBackdrop();

    const isNewBest = data.score > data.previousHighScore;
    const title = isNewBest ? 'New Best Run' : 'Run Complete';
    this.add.text(GAME_WIDTH / 2, 98, title, {
      fontFamily: 'Georgia, serif',
      fontSize: '52px',
      color: '#fff3d6'
    }).setOrigin(0.5);

    const nextGoal = isNewBest
      ? `Best improved by ${data.score - data.previousHighScore}.`
      : `${Math.max(1, data.highScore - data.score + 1)} points to beat your best.`;

    this.add.text(GAME_WIDTH / 2, 151, `${data.modeLabel}  |  ${nextGoal}`, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      color: '#cbd8f4'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 184, data.cause, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#ffb3b3',
      backgroundColor: '#150b12',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5);

    this.createStatCard(192, 260, 'Score', Math.floor(data.score).toString(), '#ffd36b');
    this.createStatCard(384, 260, 'Best', data.highScore.toString(), '#7dd3fc');
    this.createStatCard(576, 260, 'Distance', `${Math.floor(data.distance)}m`, '#78f0a4');
    this.createStatCard(768, 260, 'Time', this.formatTime(data.survivedSeconds), '#c4b5fd');

    const retry = this.add.text(GAME_WIDTH / 2 - 118, 382, 'Retry', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '20px',
      color: '#142033',
      backgroundColor: '#ffd36b',
      padding: { x: 28, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.retry());

    const menu = this.add.text(GAME_WIDTH / 2 + 104, 382, 'Menu', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '20px',
      color: '#e8f0ff',
      backgroundColor: '#13213a',
      padding: { x: 28, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MenuScene'));

    this.add.text(GAME_WIDTH / 2, 446, 'Enter retries. Esc returns to menu.', {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ENTER', () => this.retry());
    this.input.keyboard?.on('keydown-SPACE', () => this.retry());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));

    this.tweens.add({
      targets: [retry, menu],
      y: '+=4',
      duration: 900,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  private drawBackdrop() {
    const g = this.add.graphics().setDepth(DEPTHS.background);
    g.fillGradientStyle(0x050812, 0x050812, 0x102844, 0x102844, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xff8b49, 0.13);
    g.fillCircle(230, 140, 210);
    g.fillStyle(0x7dd3fc, 0.11);
    g.fillCircle(752, 160, 250);

    for (let i = 0; i < 70; i++) {
      g.fillStyle(0xffffff, 0.08 + (i % 5) * 0.03);
      g.fillCircle((i * 89) % GAME_WIDTH, (i * 47) % GAME_HEIGHT, 1.2);
    }
  }

  private createStatCard(x: number, y: number, label: string, value: string, color: string) {
    const card = this.add.rectangle(x, y, 156, 104, 0x0b1020, 0.72).setDepth(DEPTHS.overlay);
    card.setStrokeStyle(1, 0xffffff, 0.12);
    this.add.text(x, y - 28, label, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5).setDepth(DEPTHS.overlay);
    this.add.text(x, y + 10, value, {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '30px',
      color
    }).setOrigin(0.5).setDepth(DEPTHS.overlay);
  }

  private retry() {
    const mode = this.payload?.mode ?? 'classic';
    this.scene.start('GameScene', { mode });
  }

  private formatTime(seconds: number) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remaining = safeSeconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  }
}
