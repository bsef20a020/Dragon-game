extends Node
## Static game configuration, ported verbatim from src/game/constants.ts + types.ts.
## Registered as the "GameData" autoload singleton.

const GAME_WIDTH := 960
const GAME_HEIGHT := 540

## Mode tuning table — identical numbers to the Phaser build (src/game/constants.ts).
const MODES := [
	{
		"key": "classic",
		"label": "Classic",
		"summary": "Balanced speed, health, and scoring.",
		"gravity": 0.00142,
		"flap_velocity": -0.43,
		"speed": 245.0,
		"spawn_ms": 1360.0,
		"gap": 174.0,
		"health": 3,
		"score_multiplier": 1.0,
	},
	{
		"key": "bossrush",
		"label": "Boss Rush",
		"summary": "Faster gates and richer clears.",
		"gravity": 0.00148,
		"flap_velocity": -0.44,
		"speed": 286.0,
		"spawn_ms": 1180.0,
		"gap": 162.0,
		"health": 3,
		"score_multiplier": 1.25,
	},
	{
		"key": "daily",
		"label": "Daily Seed",
		"summary": "A steady seeded-feeling route for practice.",
		"gravity": 0.00142,
		"flap_velocity": -0.43,
		"speed": 254.0,
		"spawn_ms": 1280.0,
		"gap": 168.0,
		"health": 3,
		"score_multiplier": 1.1,
	},
	{
		"key": "zen",
		"label": "Zen",
		"summary": "Wider gaps and soft wall bounces.",
		"gravity": 0.00128,
		"flap_velocity": -0.39,
		"speed": 218.0,
		"spawn_ms": 1500.0,
		"gap": 202.0,
		"health": 5,
		"score_multiplier": 0.75,
	},
	{
		"key": "hardcore",
		"label": "Hardcore",
		"summary": "One mistake ends the run.",
		"gravity": 0.00154,
		"flap_velocity": -0.45,
		"speed": 305.0,
		"spawn_ms": 1080.0,
		"gap": 150.0,
		"health": 1,
		"score_multiplier": 1.6,
	},
]

## --- Transient state passed between scenes (Menu -> Game -> GameOver) ---
var selected_mode_key := "classic"
var last_result := {}

func get_mode(key: String) -> Dictionary:
	for mode in MODES:
		if mode.key == key:
			return mode
	return MODES[0]
