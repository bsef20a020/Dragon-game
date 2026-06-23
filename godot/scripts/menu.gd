extends Control
## Mode-select menu — redesigned with a living background, an animated hero
## dragon, rich mode cards, a selected-mode detail panel, and a PLAY CTA.

const W := 960
const H := 540

# Per-mode presentation (accent colour + difficulty rating 1-5).
const ACCENT := {
	"classic": 0x7dd3fc, "bossrush": 0xff8b49, "daily": 0xffd36b,
	"zen": 0x78f0a4, "hardcore": 0xff6d6d,
}
const DIFFICULTY := {
	"classic": 2, "bossrush": 4, "daily": 2, "zen": 1, "hardcore": 5,
}

var selected_index := 0
var hover_index := -1
var _t := 0.0
var _appear := 0.0
var _font: Font

var stars: Array = []
var clouds: Array = []
var embers: Array = []      # hero dragon ember trail
var _fire_cd := 1.5         # seconds until hero breathes fire
var _fire_age := -1.0       # >=0 while a breath is playing

var _card_rects: Array = []
var _play_rect := Rect2(556, 446, 356, 60)
var _mute_rect := Rect2(W - 84, H - 34, 26, 26)
var _quit_rect := Rect2(W - 46, H - 34, 26, 26)

const CARD_X := 40.0
const CARD_W := 392.0
const CARD_H := 52.0
const CARD_GAP := 60.0
const CARD_Y0 := 168.0

var _hero := Vector2(706, 226)


func _ready() -> void:
	_font = ThemeDB.fallback_font
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	for i in GameData.MODES.size():
		_card_rects.append(Rect2(CARD_X, CARD_Y0 + i * CARD_GAP, CARD_W, CARD_H))
	for i in 90:
		stars.append({"pos": Vector2(float((i * 71) % W), float((i * 47) % H)), "spd": 4.0 + (i % 6) * 4.0, "r": 0.6 + (i % 3) * 0.5})
	for i in 6:
		clouds.append({"pos": Vector2(float((i * 173) % W), 50.0 + (i * 53) % 180), "spd": 6.0 + (i % 4) * 5.0, "sc": 0.7 + (i % 3) * 0.4})


func _process(delta: float) -> void:
	_t += delta
	_appear = minf(1.0, _appear + delta / 0.6)

	for s in stars:
		s.pos.x -= s.spd * delta
		if s.pos.x < -2.0:
			s.pos.x = W + 2.0
			s.pos.y = randf_range(0.0, H)
	for c in clouds:
		c.pos.x -= c.spd * delta
		if c.pos.x < -120.0:
			c.pos.x = W + 120.0
			c.pos.y = randf_range(40.0, 230.0)

	# Hero dragon trail + periodic fire breath.
	var hp := _hero + Vector2(0, sin(_t * 1.5) * 12.0)
	if randf() < 0.5:
		embers.append({"pos": hp + Vector2(-58, randf_range(-6, 16)), "vel": Vector2(-randf_range(40, 90), randf_range(-14, 14)), "hot": randf() < 0.4, "life": randf_range(0.3, 0.6), "age": 0.0})
	var live: Array = []
	for e in embers:
		e.age += delta
		if e.age < e.life:
			e.pos += e.vel * delta
			live.append(e)
	embers = live
	_fire_cd -= delta
	if _fire_cd <= 0.0 and _fire_age < 0.0:
		_fire_age = 0.0
	if _fire_age >= 0.0:
		_fire_age += delta
		if _fire_age > 0.7:
			_fire_age = -1.0
			_fire_cd = randf_range(2.5, 4.5)

	# Mouse hover over cards.
	hover_index = -1
	var m := get_global_mouse_position()
	for i in _card_rects.size():
		if (_card_rects[i] as Rect2).has_point(m):
			hover_index = i
	queue_redraw()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_up") or event.is_action_pressed("ui_left"):
		_select(selected_index - 1)
	elif event.is_action_pressed("ui_down") or event.is_action_pressed("ui_right"):
		_select(selected_index + 1)
	elif event.is_action_pressed("ui_accept_run"):
		start_run()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var pos := (event as InputEventMouseButton).position
		for i in _card_rects.size():
			if (_card_rects[i] as Rect2).has_point(pos):
				if i == selected_index:
					start_run()      # click selected card again to start
				else:
					_select(i)
				return
		if _play_rect.has_point(pos):
			start_run()
		elif _mute_rect.has_point(pos):
			Audio.toggle_mute()
		elif _quit_rect.has_point(pos):
			get_tree().quit()


func _select(next_index: int) -> void:
	selected_index = wrapi(next_index, 0, GameData.MODES.size())
	Audio.play("flap", -16.0)


func start_run() -> void:
	GameData.selected_mode_key = GameData.MODES[selected_index].key
	Audio.play("pickup", -6.0)
	get_tree().change_scene_to_file("res://scenes/Game.tscn")


# =============================================================================
# Rendering
# =============================================================================

func _draw() -> void:
	_draw_background()
	_draw_hero()
	_draw_title()
	_draw_cards()
	_draw_detail_panel()
	_draw_play_button()
	_draw_footer()


func _draw_background() -> void:
	# Sky gradient.
	draw_polygon(
		PackedVector2Array([Vector2(0, 0), Vector2(W, 0), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([rgb(0x0a1730), rgb(0x0a1730), rgb(0x152a48), rgb(0x152a48)])
	)
	# Glowing moon behind the hero.
	draw_circle(_hero + Vector2(40, -10), 150, rgb(0x9fc6ff, 0.05))
	draw_circle(_hero + Vector2(40, -10), 110, rgb(0xbcd8ff, 0.07))
	draw_circle(_hero + Vector2(40, -10), 86, rgb(0xdfe9ff, 0.9))
	draw_circle(_hero + Vector2(18, -28), 18, rgb(0xcdd8f0, 0.5))
	draw_circle(_hero + Vector2(64, 18), 12, rgb(0xcdd8f0, 0.4))

	for s in stars:
		var tw: float = 0.5 + 0.5 * sin(_t * 2.0 + s.pos.x)
		draw_circle(s.pos, s.r, rgb(0xffffff, 0.10 + 0.18 * tw))
	for c in clouds:
		var p: Vector2 = c.pos
		var sc: float = c.sc
		draw_circle(p, 26 * sc, rgb(0x1a2c4a, 0.45))
		draw_circle(p + Vector2(28 * sc, 6 * sc), 20 * sc, rgb(0x1a2c4a, 0.45))
		draw_circle(p + Vector2(-26 * sc, 8 * sc), 18 * sc, rgb(0x1a2c4a, 0.45))

	# Layered parallax mountains.
	_mountain_row(H - 70, 0x122644, 0.5, fmod(_t * 8.0, 260.0))
	_mountain_row(H - 40, 0x0d1d36, 0.7, fmod(_t * 14.0, 220.0))
	# Bottom vignette.
	draw_polygon(
		PackedVector2Array([Vector2(0, H - 80), Vector2(W, H - 80), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([rgb(0x060d1c, 0.0), rgb(0x060d1c, 0.0), rgb(0x060d1c, 0.75), rgb(0x060d1c, 0.75)])
	)


func _mountain_row(base_y: float, hex: int, alpha: float, off: float) -> void:
	var span := 220.0
	var x := -off - span
	while x < W + span:
		draw_colored_polygon(PackedVector2Array([
			Vector2(x, base_y + 80), Vector2(x + 60, base_y), Vector2(x + 130, base_y + 80)
		]), rgb(hex, alpha))
		draw_colored_polygon(PackedVector2Array([
			Vector2(x + 90, base_y + 80), Vector2(x + 160, base_y + 18), Vector2(x + 240, base_y + 80)
		]), rgb(hex, alpha))
		x += span


func _draw_title() -> void:
	var e := _ease(_appear)
	var y := 84.0 - (1.0 - e) * 16.0
	# Warm glow halo.
	for r in [3.0, 2.0]:
		_bold("DRAGON FLIGHT", Vector2(46, y), 60, rgb(0xff8b49, 0.06 * e), r)
	_bold("DRAGON FLIGHT", Vector2(46, y), 60, rgb(0xfff3d6, e), 1.4)
	# Small flame accent before the subtitle.
	_text("Godot Edition  ·  Skyforge Studio", Vector2(50, y + 30), 16, rgb(0x9fd2ff, 0.9 * e))
	_text("SELECT YOUR FLIGHT", Vector2(CARD_X + 8, CARD_Y0 - 16), 14, rgb(0x8aa0c8, e))


func _draw_cards() -> void:
	for i in GameData.MODES.size():
		var mode = GameData.MODES[i]
		var base: Rect2 = _card_rects[i]
		var ce := _ease(clampf(_appear * 1.5 - i * 0.1, 0.0, 1.0))
		if ce <= 0.001:
			continue
		var sel := i == selected_index
		var hov := i == hover_index
		var slide := (1.0 - ce) * -70.0
		var lift := -6.0 if (sel or hov) else 0.0
		var r := Rect2(base.position + Vector2(slide, lift), base.size)
		var accent := rgb(ACCENT[mode.key])

		# Card body + selection accent bar.
		if sel:
			draw_rect(Rect2(r.position - Vector2(3, 3), r.size + Vector2(6, 6)), rgb(ACCENT[mode.key], 0.25 * ce))
		draw_rect(r, rgb(0x13233f, (0.95 if sel else 0.8) * ce))
		draw_rect(r, rgb(ACCENT[mode.key], (0.85 if (sel or hov) else 0.18) * ce), false, 2.0 if sel else 1.0)
		draw_rect(Rect2(r.position, Vector2(5, r.size.y)), rgb(ACCENT[mode.key], (1.0 if sel else 0.5) * ce))

		# Icon emblem.
		_mode_icon(mode.key, r.position + Vector2(34, 26), accent, ce)

		# Label + difficulty flames.
		var txt := rgb(0xffffff, ce) if (sel or hov) else rgb(0xd7e2f5, 0.92 * ce)
		_text(str(mode.label), r.position + Vector2(62, 24), 17, txt)
		_difficulty(r.position + Vector2(64, 38), DIFFICULTY[mode.key], accent, ce)

		# Score multiplier badge + best score (right side).
		var badge := Rect2(r.position + Vector2(r.size.x - 132, 12), Vector2(58, 28))
		draw_rect(badge, rgb(ACCENT[mode.key], 0.16 * ce))
		_text("x%.2f" % mode.score_multiplier, badge.position + Vector2(8, 19), 13, rgb(ACCENT[mode.key], ce))
		_text("BEST %d" % SaveData.get_high_score(mode.key), r.position + Vector2(r.size.x - 68, 31), 12, rgb(0x9fb0d0, ce))


func _draw_detail_panel() -> void:
	var e := _ease(clampf(_appear * 1.4 - 0.3, 0.0, 1.0))
	if e <= 0.001:
		return
	var mode = GameData.MODES[selected_index]
	var accent := rgb(ACCENT[mode.key])
	var x := 556.0
	var y := 312.0
	_text(str(mode.label).to_upper(), Vector2(x, y), 22, rgb(ACCENT[mode.key], e))
	_text(str(mode.summary), Vector2(x, y + 24), 14, rgb(0xcbd8f4, 0.92 * e), 350)

	# Stat bars: Speed, Health, Calm (wider gaps = calmer).
	var sy := y + 48.0
	_stat_bar(x, sy, "SPEED", inverse_lerp(210.0, 310.0, mode.speed), accent, e)
	_stat_bar(x + 180, sy, "HEALTH", inverse_lerp(1.0, 5.0, float(mode.health)), accent, e)
	_stat_bar(x, sy + 26, "CALM", inverse_lerp(150.0, 205.0, mode.gap), accent, e)
	_stat_bar(x + 180, sy + 26, "REWARD", inverse_lerp(0.75, 1.6, mode.score_multiplier), accent, e)


func _stat_bar(x: float, y: float, label: String, ratio: float, accent: Color, e: float) -> void:
	ratio = clampf(ratio, 0.05, 1.0)
	_text(label, Vector2(x, y), 11, rgb(0x9fb0d0, e))
	var bx := x + 60.0
	draw_rect(Rect2(bx, y - 9, 90, 7), rgb(0x0a1424, 0.7 * e))
	draw_rect(Rect2(bx, y - 9, 90 * ratio, 7), Color(accent.r, accent.g, accent.b, e))


func _draw_play_button() -> void:
	var e := _ease(clampf(_appear * 1.4 - 0.4, 0.0, 1.0))
	if e <= 0.001:
		return
	var mode = GameData.MODES[selected_index]
	var accent := rgb(ACCENT[mode.key])
	var hov := _play_rect.has_point(get_global_mouse_position())
	var pulse := 0.5 + 0.5 * sin(_t * 3.0)
	var r := _play_rect
	var rise := (1.0 - e) * 24.0
	r = Rect2(r.position + Vector2(0, rise), r.size)
	# Glow.
	draw_rect(Rect2(r.position - Vector2(6, 6), r.size + Vector2(12, 12)), Color(accent.r, accent.g, accent.b, (0.18 + 0.16 * pulse) * e))
	draw_rect(r, Color(accent.r, accent.g, accent.b, e) if hov else Color(accent.r * 0.92, accent.g * 0.92, accent.b * 0.92, e))
	var label := "▶  PLAY  %s" % str(mode.label).to_upper()
	var tw := _font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 22).x
	_text(label, r.position + Vector2((r.size.x - tw) / 2.0, 39), 22, rgb(0x0a1420, e))


func _draw_footer() -> void:
	var e := _ease(_appear)
	draw_rect(Rect2(0, H - 40, W, 40), rgb(0x060d1c, 0.55 * e))
	_text("↑↓ Select     Enter / Click  Play     F  Fire     P  Pause", Vector2(40, H - 15), 13, rgb(0x8aa0c8, e))
	_text("v1.0", Vector2(W - 150, H - 15), 12, rgb(0x5f7194, e))
	# Mute icon.
	var muted := Audio.is_muted()
	draw_rect(_mute_rect, rgb(0x9fb0d0, 0.0))
	_text("MUTE" if not muted else "MUTED", _mute_rect.position + Vector2(-26, 19), 11, rgb(0xff9a9a if muted else 0x9fb0d0, e))
	# Quit (drawn as an X).
	var q := _quit_rect
	draw_line(q.position + Vector2(6, 6), q.position + Vector2(20, 20), rgb(0x9fb0d0, e), 2.0)
	draw_line(q.position + Vector2(20, 6), q.position + Vector2(6, 20), rgb(0x9fb0d0, e), 2.0)


# --- Hero dragon -------------------------------------------------------------

func _draw_hero() -> void:
	var e := _ease(_appear)
	var bob := sin(_t * 1.5) * 12.0
	var pos := _hero + Vector2(0, bob)

	for em in embers:
		var k: float = 1.0 - em.age / em.life
		var col := rgb(0xffd24a) if em.hot else rgb(0xff7a1e)
		draw_circle(em.pos, 3.5 * k, Color(col.r, col.g, col.b, 0.8 * k * e))

	var wing_ang := sin(_t * 5.0) * 0.32 - 0.1
	var tail_wag := sin(_t * 3.0) * 5.0
	var fire := clampf(_fire_age / 0.7, 0.0, 1.0) if _fire_age >= 0.0 else -1.0
	Gfx.dragon(self, pos, 2.0, 0.0, e, wing_ang, tail_wag, _t, fire)


# --- Icons / glyphs ----------------------------------------------------------

func _mode_icon(key: String, c: Vector2, accent: Color, e: float) -> void:
	var col := Color(accent.r, accent.g, accent.b, e)
	match key:
		"classic":     # gate pair
			draw_rect(Rect2(c.x - 7, c.y - 11, 5, 8), col)
			draw_rect(Rect2(c.x + 2, c.y + 3, 5, 8), col)
		"bossrush":    # crown
			_draw_poly([c + Vector2(-9, 6), c + Vector2(-9, -4), c + Vector2(-4, 1), c + Vector2(0, -7), c + Vector2(4, 1), c + Vector2(9, -4), c + Vector2(9, 6)], col)
		"daily":       # sun
			draw_circle(c, 5, col)
			for i in 8:
				var d := Vector2(cos(TAU * i / 8.0), sin(TAU * i / 8.0))
				draw_line(c + d * 7, c + d * 10, col, 1.5)
		"zen":         # leaf
			_draw_poly([c + Vector2(-8, 6), c + Vector2(0, -9), c + Vector2(8, 6), c + Vector2(0, 2)], col)
		"hardcore":    # flame
			_draw_poly([c + Vector2(0, -10), c + Vector2(6, 0), c + Vector2(3, 8), c + Vector2(-3, 8), c + Vector2(-6, 0)], col)


func _difficulty(at: Vector2, level: int, accent: Color, e: float) -> void:
	for i in 5:
		var on := i < level
		var col := Color(accent.r, accent.g, accent.b, e) if on else rgb(0x3a4a66, e)
		var x := at.x + i * 11.0
		_draw_poly([Vector2(x, at.y - 5), Vector2(x + 3, at.y), Vector2(x + 1.5, at.y + 4), Vector2(x - 1.5, at.y + 4), Vector2(x - 3, at.y)], col)


# --- Draw helpers ------------------------------------------------------------

func _ease(t: float) -> float:
	t = clampf(t, 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)


func _bold(s: String, pos: Vector2, size: int, color: Color, spread: float) -> void:
	for off in [Vector2(spread, 0), Vector2(-spread, 0), Vector2(0, spread), Vector2(0, -spread)]:
		draw_string(_font, pos + off, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func _draw_poly(pts: Array, color: Color) -> void:
	Gfx.poly(self, pts, color)


func _text(s: String, pos: Vector2, size: int, color: Color, wrap_w := -1.0) -> void:
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, wrap_w, size, color)


func rgb(hex: int, alpha := 1.0) -> Color:
	return Gfx.rgb(hex, alpha)
