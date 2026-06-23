extends Node
## High-score persistence — the Godot equivalent of src/game/persistence.ts.
## The browser build used localStorage; here we write a JSON file to user://
## (a per-platform, per-user app data dir), registered as the "SaveData" autoload.

const SAVE_PATH := "user://dragon_flight_save.json"

var _high_scores := {}

func _ready() -> void:
	_load()

func _load() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		_high_scores = {}
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		_high_scores = {}
		return
	var raw := f.get_as_text()
	f.close()
	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) == TYPE_DICTIONARY and parsed.has("high_scores"):
		_high_scores = parsed["high_scores"]
	else:
		_high_scores = {}

func _save() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		# Storage can fail (read-only fs); the game stays playable, just unsaved.
		return
	f.store_string(JSON.stringify({"high_scores": _high_scores}))
	f.close()

func get_high_score(mode_key: String) -> int:
	return int(max(0, floor(_high_scores.get(mode_key, 0))))

func set_high_score(mode_key: String, score: float) -> int:
	var next := int(max(get_high_score(mode_key), floor(score)))
	_high_scores[mode_key] = next
	_save()
	return next
