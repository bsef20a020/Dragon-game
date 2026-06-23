# Dragon Flight Phaser Migration Design

## Goal

Move Dragon Flight from a single HTML canvas implementation toward a maintainable Phaser + TypeScript + Vite game while preserving the existing `dragon-flight.html` version as a legacy backup.

## Approach

Use an incremental migration. The new app becomes the default `index.html` entry, and the original game remains available at `dragon-flight.html`. The first Phaser version should be fully playable before porting every advanced system.

## Stack

- Vite for local development and production builds.
- TypeScript for game code.
- Phaser for scenes, rendering, input, physics, and the game loop.
- Browser `localStorage` for high score and lightweight progression.
- Existing Node test runner for current pure JavaScript tests.

## New Game Shape

- `BootScene`: sets shared constants and starts the menu.
- `MenuScene`: title screen, mode selection, best score display, and start controls.
- `GameScene`: dragon movement, obstacles, pickups, collision, scoring, pause, and run completion.
- `HudScene`: score, high score, health, mode, and ability cooldown display.
- `GameOverScene`: final score, best score, restart, and legacy-game link.

## Scope For First Implementation

The first Phaser implementation includes the core arcade loop: flap controls, scrolling obstacles, pickups, fire ability, score, high score persistence, health, game over, and restart. Advanced systems from the old game, such as quests, bosses, biomes, relics, pets, achievements, and daily replay, stay in the legacy version until they are ported deliberately.

## Testing

Keep existing `npm test` working for the pure logic tests. Add `npm run build` for TypeScript and Vite verification once dependencies are installed.

## Rollback

If the new app needs more work, open `dragon-flight.html` directly. No legacy code is removed in this migration step.
