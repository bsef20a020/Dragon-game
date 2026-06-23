extends Node
## High-score persistence — the Godot equivalent of src/game/persistence.ts.
## The browser build used localStorage; here we write a JSON file to user://
## (a per-platform, per-user app data dir), registered as the "SaveData" autoload.

const SAVE_PATH := "user://dragon_flight_save.json"

var _high_scores := {}
var _settings := {}

func _ready() -> void:
	_load()

func _load() -> void:
	_high_scores = {}
	_settings = {}
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return
	var raw := f.get_as_text()
	f.close()
	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	if typeof(parsed.get("high_scores")) == TYPE_DICTIONARY:
		_high_scores = parsed["high_scores"]
	if typeof(parsed.get("settings")) == TYPE_DICTIONARY:
		_settings = parsed["settings"]

func _save() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		# Storage can fail (read-only fs); the game stays playable, just unsaved.
		return
	f.store_string(JSON.stringify({"high_scores": _high_scores, "settings": _settings}))
	f.close()

func get_high_score(mode_key: String) -> int:
	return int(max(0, floor(_high_scores.get(mode_key, 0))))

func set_high_score(mode_key: String, score: float) -> int:
	var next := int(max(get_high_score(mode_key), floor(score)))
	_high_scores[mode_key] = next
	_save()
	return next

func get_setting(key: String, default_value: Variant) -> Variant:
	return _settings.get(key, default_value)

func set_setting(key: String, value: Variant) -> void:
	_settings[key] = value
	_save()
