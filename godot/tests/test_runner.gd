extends Node
## Headless test suite for the game logic. Run with:
##   ./run-tests.sh           (from godot/)
##   godot4 --headless --path godot res://tests/Tests.tscn
## Exits with code 1 if any assertion fails (CI-friendly), 0 otherwise.

var _pass := 0
var _fail := 0
var _failures: Array = []


func _ready() -> void:
	_test_modes()
	_test_save()
	_test_settings()
	_test_scoring()
	_test_collision()
	_test_gfx()
	_test_hud_hit_areas()

	print("\n================ TEST RESULTS ================")
	print("  %d passed, %d failed" % [_pass, _fail])
	for f in _failures:
		print("  ✗ ", f)
	print("==============================================")
	get_tree().quit(1 if _fail > 0 else 0)


# --- assert helpers ----------------------------------------------------------

func ok(cond: bool, msg: String) -> void:
	if cond:
		_pass += 1
	else:
		_fail += 1
		_failures.append(msg)


func eq(actual, expected, msg: String) -> void:
	ok(actual == expected, "%s — got %s, expected %s" % [msg, str(actual), str(expected)])


func approx(actual: float, expected: float, msg: String, eps := 0.001) -> void:
	ok(abs(actual - expected) < eps, "%s — got %s, expected %s" % [msg, str(actual), str(expected)])


# --- tests -------------------------------------------------------------------

func _test_modes() -> void:
	eq(GameData.MODES.size(), 5, "MODES has 5 entries")
	var keys := {}
	var required := ["key", "label", "summary", "gravity", "flap_velocity", "speed", "spawn_ms", "gap", "health", "score_multiplier"]
	for m in GameData.MODES:
		for field in required:
			ok(m.has(field), "mode '%s' has field '%s'" % [m.get("key", "?"), field])
		ok(not keys.has(m.key), "mode key '%s' is unique" % m.key)
		keys[m.key] = true
		ok(m.health >= 1, "mode '%s' health >= 1" % m.key)
		ok(m.gap > 0.0, "mode '%s' gap > 0" % m.key)
		ok(m.speed > 0.0, "mode '%s' speed > 0" % m.key)
		ok(m.score_multiplier > 0.0, "mode '%s' multiplier > 0" % m.key)
	eq(GameData.get_mode("zen").key, "zen", "get_mode returns requested mode")
	eq(GameData.get_mode("does-not-exist").key, "classic", "get_mode falls back to classic")


func _test_save() -> void:
	# Use a throwaway key so real high scores are never clobbered. The save file
	# persists between runs, so assert relative to the current value.
	var k := "__selftest__"
	var base := SaveData.get_high_score(k)
	ok(base >= 0, "get_high_score never negative")
	SaveData.set_high_score(k, base + 100)
	eq(SaveData.get_high_score(k), base + 100, "set_high_score stores a new best")
	SaveData.set_high_score(k, base + 40)
	eq(SaveData.get_high_score(k), base + 100, "set_high_score is monotonic (lower ignored)")
	SaveData.set_high_score(k, base + 250)
	eq(SaveData.get_high_score(k), base + 250, "set_high_score raises to a higher best")
	# Float scores are floored.
	var cur := SaveData.get_high_score(k)
	SaveData.set_high_score(k, cur + 10.9)
	eq(SaveData.get_high_score(k), cur + 10, "high score is floored to int")


func _test_settings() -> void:
	# Generic settings store round-trips and defaults correctly.
	eq(SaveData.get_setting("__nope__", "fallback"), "fallback", "get_setting returns default for missing key")
	SaveData.set_setting("__selftest_setting__", 42)
	eq(SaveData.get_setting("__selftest_setting__", 0), 42, "set_setting round-trips")

	# Muting persists through SaveData and is restorable (snapshot/restore real value).
	var original := bool(SaveData.get_setting("muted", false))
	Audio.set_muted(true)
	ok(Audio.is_muted(), "Audio reports muted after set_muted(true)")
	eq(SaveData.get_setting("muted", false), true, "mute preference is persisted")
	Audio.set_muted(false)
	ok(not Audio.is_muted(), "Audio reports unmuted after set_muted(false)")
	eq(SaveData.get_setting("muted", true), false, "unmute preference is persisted")
	Audio.set_muted(original)  # leave the user's real preference untouched


func _test_scoring() -> void:
	var g = load("res://scripts/game.gd").new()
	g.mode = GameData.get_mode("classic")
	g.score = 0.0
	g.add_score(10.0)
	approx(g.score, 10.0, "classic x1.0 multiplier")
	g.mode = GameData.get_mode("bossrush")
	g.score = 0.0
	g.add_score(10.0)
	approx(g.score, 12.5, "bossrush x1.25 multiplier")
	g.score = 0.0
	g.add_score(10.0, false)
	approx(g.score, 10.0, "drift score ignores the multiplier")
	g.free()


func _test_collision() -> void:
	var g = load("res://scripts/game.gd").new()
	g.dragon_pos = Vector2(176, 270)
	eq(g.dragon_bounds(), Rect2(145, 247, 58, 43), "dragon_bounds AABB")

	# A gate aligned with the dragon's x but with a gap nowhere near y=270 must hit.
	var blocking := {"x": 176.0, "body_w": 74.0, "cap_w": 90.0, "gap_y": 0.0, "gap": 60.0, "danger": false, "scored": false}
	var hit := false
	for r in g._pillar_rects(blocking):
		if g.dragon_bounds().intersects(r):
			hit = true
	ok(hit, "dragon collides with a misaligned gate")

	# A gate far to the right must not hit.
	var far := {"x": 900.0, "body_w": 74.0, "cap_w": 90.0, "gap_y": 0.0, "gap": 60.0, "danger": false, "scored": false}
	var miss := false
	for r in g._pillar_rects(far):
		if g.dragon_bounds().intersects(r):
			miss = true
	ok(not miss, "dragon does not collide with a distant gate")

	# A gate whose gap surrounds the dragon must not hit (clear passage).
	var clear := {"x": 176.0, "body_w": 74.0, "cap_w": 90.0, "gap_y": 210.0, "gap": 120.0, "danger": false, "scored": false}
	var clear_hit := false
	for r in g._pillar_rects(clear):
		if g.dragon_bounds().intersects(r):
			clear_hit = true
	ok(not clear_hit, "dragon passes cleanly through an aligned gap")
	g.free()


func _test_gfx() -> void:
	eq(Gfx.rgb(0xffffff), Color(1, 1, 1, 1), "rgb white")
	eq(Gfx.rgb(0x000000), Color(0, 0, 0, 1), "rgb black")
	approx(Gfx.rgb(0xff0000).r, 1.0, "rgb red channel")
	approx(Gfx.rgb(0x7dd3fc, 0.5).a, 0.5, "rgb alpha passthrough")
	eq(Gfx.accent_of("zen"), Gfx.rgb(0x78f0a4), "accent_of known mode")
	eq(Gfx.accent_of("nope"), Gfx.rgb(0x7dd3fc), "accent_of unknown falls back")


func _test_hud_hit_areas() -> void:
	# Regression guard: the on-screen buttons' hit-test must match their drawn
	# geometry (this is what drifted and broke the pause button previously).
	var hud = load("res://scripts/hud.gd").new()
	ok(hud.hits_fire(hud.FIRE_CENTER), "fire button hit at its centre")
	ok(hud.hits_pause(hud.PAUSE_CENTER), "pause button hit at its centre")
	ok(not hud.hits_pause(hud.FIRE_CENTER), "pause button not hit at the fire centre")
	ok(not hud.hits_fire(Vector2(0, 0)), "fire button not hit at the origin")
	# A click just inside the pause radius hits; just outside misses.
	ok(hud.hits_pause(hud.PAUSE_CENTER + Vector2(hud.PAUSE_RADIUS - 1, 0)), "pause hit just inside radius")
	ok(not hud.hits_pause(hud.PAUSE_CENTER + Vector2(hud.PAUSE_RADIUS + 2, 0)), "pause miss just outside radius")

	# Pause-menu buttons are only live while paused.
	hud.snapshot = {"paused": false}
	ok(not hud.hits_resume(hud.RESUME_RECT.get_center()), "resume inert when not paused")
	hud.snapshot = {"paused": true}
	ok(hud.hits_resume(hud.RESUME_RECT.get_center()), "resume hit while paused")
	ok(hud.hits_restart(hud.RESTART_RECT.get_center()), "restart hit while paused")
	ok(hud.hits_menu(hud.MENU_RECT.get_center()), "menu hit while paused")
	ok(not hud.hits_resume(hud.MENU_RECT.get_center()), "pause-menu buttons do not overlap")
	hud.free()

	# The game exposes the pause-menu actions the HUD routes to.
	var g = load("res://scripts/game.gd").new()
	ok(g.has_method("restart"), "game has restart()")
	ok(g.has_method("quit_to_menu"), "game has quit_to_menu()")
	g.free()
