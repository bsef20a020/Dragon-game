import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('spark', 8, 8);
    graphics.clear();

    graphics.fillStyle(0x80eaff, 1);
    graphics.fillTriangle(12, 0, 24, 12, 12, 24);
    graphics.fillStyle(0x35aee2, 1);
    graphics.fillTriangle(12, 0, 0, 12, 12, 24);
    graphics.fillStyle(0xe6fbff, 0.8);
    graphics.fillTriangle(12, 3, 18, 12, 12, 21);
    graphics.generateTexture('crystal', 24, 24);
    graphics.clear();

    graphics.fillStyle(0xfff2b8, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.fillStyle(0xff6d6d, 1);
    graphics.fillCircle(5, 6, 4);
    graphics.fillCircle(11, 6, 4);
    graphics.fillTriangle(2, 8, 14, 8, 8, 16);
    graphics.generateTexture('heart', 16, 16);
    graphics.clear();

    graphics.fillStyle(0x78f0a4, 0.9);
    graphics.fillCircle(12, 12, 12);
    graphics.lineStyle(2, 0xffffff, 0.7);
    graphics.strokeCircle(12, 12, 9);
    graphics.generateTexture('shield', 24, 24);
    graphics.destroy();

    this.scene.start('MenuScene');
  }
}
