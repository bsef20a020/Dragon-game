export type ModeKey = 'classic' | 'bossrush' | 'daily' | 'zen' | 'hardcore';

export interface ModeConfig {
  key: ModeKey;
  label: string;
  summary: string;
  gravity: number;
  flapVelocity: number;
  speed: number;
  spawnMs: number;
  gap: number;
  health: number;
  scoreMultiplier: number;
}

export interface HudSnapshot {
  score: number;
  highScore: number;
  health: number;
  maxHealth: number;
  modeLabel: string;
  distance: number;
  abilityRatio: number;
  paused: boolean;
}

export interface GameOverPayload {
  mode: ModeKey;
  modeLabel: string;
  score: number;
  previousHighScore: number;
  highScore: number;
  distance: number;
  survivedSeconds: number;
  cause: string;
}

export interface GameSceneData {
  mode?: ModeKey;
}

export type PickupKind = 'crystal' | 'heart' | 'shield';
