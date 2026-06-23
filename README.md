# Dragon Flight

[![CI](https://github.com/bsef20a020/Dragon-game/actions/workflows/ci.yml/badge.svg)](https://github.com/bsef20a020/Dragon-game/actions/workflows/ci.yml)

A fast, arcade flap-and-dodge game — fly a dragon through sky gates, grab
pickups, and breathe fire to clear your path. Five tuned game modes, a shared
**Daily Seed** challenge, and per-mode high scores. Built with **Godot 4**
(pure GDScript) and playable on desktop or in the browser.

## Play the game

Requires [Godot 4.3+](https://godotengine.org/download) (standard build — pure
GDScript, no C#). From the `godot/` folder:

```bash
./play.sh                 # run the game
./play.sh --editor        # open it in the Godot editor
```

…or open `godot/project.godot` from the Godot project manager.

### Run it in a browser

```bash
./build-web.sh            # export a WebAssembly build to dist-web/
./serve-web.sh            # serve it + open http://localhost:8060
```

### Controls

| Action | Keys / Mouse |
|--------|--------------|
| Flap   | Space · W · ↑ · left-click |
| Fire breath | F · right-click · on-screen button |
| Pause / menu | P · Esc (Resume · Restart · Quit) |
| Menu select | arrows / click a card · Enter to start |

### Modes

| Mode | Feel |
|------|------|
| **Classic** | Balanced speed, health, and scoring |
| **Boss Rush** | Faster gates, richer clears |
| **Daily Seed** | Same route for everyone each day (seeded by date) |
| **Zen** | Wider gaps, soft wall bounces |
| **Hardcore** | One mistake ends the run |

## Tests

A dependency-free headless GDScript suite covers the game logic (mode data,
persistence, scoring, collision geometry, the shared `Gfx` helpers, HUD
hit-areas, and Daily-Seed determinism). It runs in CI on every push.

```bash
cd godot && ./run-tests.sh
```

## Project layout

```
godot/                 Godot 4 game (current)
  project.godot        engine config, autoloads, input map
  scripts/             game logic — game, hud, menu, game_over, gfx, audio,
                       game_data, save_data
  scenes/              Menu / Game / GameOver scenes
  tests/               headless test suite
  play.sh build-web.sh serve-web.sh run-tests.sh
.github/workflows/     CI (runs the test suite)
```

See [`godot/README.md`](godot/README.md) for engine-specific details and
desktop export instructions.
