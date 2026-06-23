import type { ModeConfig } from './types';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const EVENTS = {
  hud: 'dragon:hud'
} as const;

export const MODES: ModeConfig[] = [
  {
    key: 'classic',
    label: 'Classic',
    summary: 'Balanced speed, health, and scoring.',
    gravity: 0.00142,
    flapVelocity: -0.43,
    speed: 245,
    spawnMs: 1360,
    gap: 174,
    health: 3,
    scoreMultiplier: 1
  },
  {
    key: 'bossrush',
    label: 'Boss Rush',
    summary: 'Faster gates and richer clears.',
    gravity: 0.00148,
    flapVelocity: -0.44,
    speed: 286,
    spawnMs: 1180,
    gap: 162,
    health: 3,
    scoreMultiplier: 1.25
  },
  {
    key: 'daily',
    label: 'Daily Seed',
    summary: 'A steady seeded-feeling route for practice.',
    gravity: 0.00142,
    flapVelocity: -0.43,
    speed: 254,
    spawnMs: 1280,
    gap: 168,
    health: 3,
    scoreMultiplier: 1.1
  },
  {
    key: 'zen',
    label: 'Zen',
    summary: 'Wider gaps and soft wall bounces.',
    gravity: 0.00128,
    flapVelocity: -0.39,
    speed: 218,
    spawnMs: 1500,
    gap: 202,
    health: 5,
    scoreMultiplier: 0.75
  },
  {
    key: 'hardcore',
    label: 'Hardcore',
    summary: 'One mistake ends the run.',
    gravity: 0.00154,
    flapVelocity: -0.45,
    speed: 305,
    spawnMs: 1080,
    gap: 150,
    health: 1,
    scoreMultiplier: 1.6
  }
];

export const DEPTHS = {
  background: 0,
  world: 10,
  dragon: 20,
  effects: 30,
  overlay: 40
} as const;
