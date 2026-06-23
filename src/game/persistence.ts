import type { ModeKey } from './types';

const STORAGE_KEY = 'dragon_flight_phaser_v1';

interface SaveState {
  highScores: Partial<Record<ModeKey, number>>;
}

function defaultState(): SaveState {
  return {
    highScores: {}
  };
}

function readState(): SaveState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      highScores: parsed.highScores ?? {}
    };
  } catch {
    return defaultState();
  }
}

function writeState(state: SaveState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail in private windows; the game remains playable.
  }
}

export function getHighScore(mode: ModeKey): number {
  return Math.max(0, Math.floor(readState().highScores[mode] ?? 0));
}

export function setHighScore(mode: ModeKey, score: number): number {
  const state = readState();
  const next = Math.max(getHighScore(mode), Math.floor(score));
  state.highScores[mode] = next;
  writeState(state);
  return next;
}
