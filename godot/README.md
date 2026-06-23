# Dragon Flight — Godot 4 edition

An arcade flap-and-dodge game built with **Godot 4** (pure GDScript), for
desktop distribution (Windows / macOS / Linux) and the web.

Five modes, flap physics, sky gates (normal + volatile), pickups (crystal / heart /
shield), the fire-breath ability with its cooldown ring, health/shield/invuln, HUD,
and per-mode high scores.

## Requirements

- [Godot 4.3+](https://godotengine.org/download) (standard build, **not** the .NET/C# build — this project is pure GDScript).

## Run it

```bash
# From this folder, open the project in the editor:
godot --path . --editor

# …or run it directly without opening the editor:
godot --path .
```

Or launch the Godot editor, click **Import**, and select `godot/project.godot`.

### Controls

| Action | Keys / Mouse |
|--------|--------------|
| Flap   | Space · Up · W · Left-click |
| Fire breath | F · Right-click · on-screen fire button |
| Pause  | P · Esc · on-screen pause button |
| Menu: select mode | Arrow keys / click a card |
| Menu: start | Space / Enter / Start button |

## Run the tests

A headless GDScript test suite covers the game logic (mode-table integrity,
high-score persistence, scoring multipliers, gate-collision geometry, the
shared `Gfx` helpers, and the HUD button hit-areas). It exits non-zero on
failure, so it drops straight into CI:

```bash
./run-tests.sh            # from godot/
# or: godot4 --headless --path . res://tests/Tests.tscn
```

## Build desktop binaries

1. In the editor: **Editor ▸ Manage Export Templates ▸ Download and Install**
   (one-time, per Godot version).
2. **Project ▸ Export** — three presets are already defined (Linux, Windows, macOS).
3. Export, or from the CLI:

```bash
godot --path . --headless --export-release "Linux"          # -> ../dist-godot/dragon-flight.x86_64
godot --path . --headless --export-release "Windows Desktop" # -> ../dist-godot/dragon-flight.exe
godot --path . --headless --export-release "macOS"           # -> ../dist-godot/dragon-flight.dmg
```

## Project layout

```
godot/
  project.godot          # engine config, autoloads, input map, 960x540 viewport
  export_presets.cfg     # Linux / Windows / macOS desktop presets
  icon.svg               # app icon
  scenes/
    Menu.tscn            # mode-select menu (main scene)
    Game.tscn            # gameplay + HUD CanvasLayer
    GameOver.tscn        # run summary
  scripts/
    game_data.gd         # MODES table + constants  (autoload "GameData")
    save_data.gd         # high scores -> user://     (autoload "SaveData")
    menu.gd
    game.gd              # core loop, physics, spawning, collision, fire
    hud.gd
    game_over.gd
```

Physics is stepped in milliseconds (`delta_ms = delta * 1000`) to keep the frame
math consistent across refresh rates.
