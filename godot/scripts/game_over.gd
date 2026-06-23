extends Control
## Run summary — redesigned to match the menu: living background, animated
## hero dragon, polished stat cards, and Retry / Menu CTAs. New-best runs
## celebrate with confetti.

const W := 960
const H := 540

var data := {}
var _font: Font
var _t := 0.0
var _appear := 0.0
var _is_new_best := false
var _accent := Color.WHITE

var stars: Array = []
var clouds: Array = []
var embers: Array = []
var confetti: Array = []

var _retry_rect := Rect2(W / 2.0 - 220, 392, 200, 56)
var _menu_rect := Rect2(W / 2.0 + 20, 392, 200, 56)
var _hero := Vector2(818, 96)


func _ready() -> void:
	_font = ThemeDB.fallback_font
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	data = GameData.last_result if not GameData.last_result.is_empty() else {
		"mode": "classic", "mode_label": "Classic", "score": 0,
		"previous_high_score": 0, "high_score": 0, "distance": 0.0,
		"survived_seconds": 0.0, "cause": "Run complete.",
	}
	_is_new_best = int(data.score) > int(data.previous_high_score)
	_accent = Gfx.accent_of(data.get("mode", "classic"))

	for i in 90:
		stars.append({"pos": Vector2(float((i * 71) % W), float((i * 47) % H)), "spd": 4.0 + (i % 6) * 4.0, "r": 0.6 + (i % 3) * 0.5})
	for i in 6:
		clouds.append({"pos": Vector2(float((i * 167) % W), 50.0 + (i * 53) % 180), "spd": 6.0 + (i % 4) * 5.0, "sc": 0.7 + (i % 3) * 0.4})
	if _is_new_best:
		for i in 70:
			confetti.append({"pos": Vector2(randf_range(0, W), randf_range(-H, 0)), "vel": Vector2(randf_range(-20, 20), randf_range(80, 180)), "spin": randf_range(-4, 4), "rot": randf_range(0, TAU), "hue": i % 5})


func _process(delta: float) -> void:
	_t += delta
	_appear = minf(1.0, _appear + delta / 0.6)
	for s in stars:
		s.pos.x -= s.spd * delta
		if s.pos.x < -2.0:
			s.pos.x = W + 2.0
	for c in clouds:
		c.pos.x -= c.spd * delta
		if c.pos.x < -120.0:
			c.pos.x = W + 120.0

	var hp := _hero + Vector2(0, sin(_t * 1.5) * 8.0)
	if randf() < 0.5:
		embers.append({"pos": hp + Vector2(-44, randf_range(-4, 12)), "vel": Vector2(-randf_range(40, 90), randf_range(-12, 12)), "hot": randf() < 0.4, "life": randf_range(0.3, 0.55), "age": 0.0})
	var live: Array = []
	for e in embers:
		e.age += delta
		if e.age < e.life:
			e.pos += e.vel * delta
			live.append(e)
	embers = live

	for cf in confetti:
		cf.pos += cf.vel * delta
		cf.rot += cf.spin * delta
		if cf.pos.y > H + 10:
			cf.pos.y = randf_range(-40, -10)
			cf.pos.x = randf_range(0, W)
	queue_redraw()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept_run"):
		retry()
	elif event.is_action_pressed("pause_toggle"):  # Esc is bound here
		_to_menu()
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var pos := (event as InputEventMouseButton).position
		if _retry_rect.has_point(pos):
			retry()
		elif _menu_rect.has_point(pos):
			_to_menu()


func retry() -> void:
	GameData.selected_mode_key = data.get("mode", "classic")
	Audio.play("pickup", -6.0)
	get_tree().change_scene_to_file("res://scenes/Game.tscn")


func _to_menu() -> void:
	Audio.play("flap", -12.0)
	get_tree().change_scene_to_file("res://scenes/Menu.tscn")


# =============================================================================
# Rendering
# =============================================================================

func _draw() -> void:
	_draw_background()
	_draw_hero()
	_draw_confetti()
	_draw_header()
	_draw_stat_cards()
	_draw_buttons()
	_draw_footer()


func _draw_background() -> void:
	draw_polygon(
		PackedVector2Array([Vector2(0, 0), Vector2(W, 0), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([rgb(0x080f22), rgb(0x080f22), rgb(0x152a48), rgb(0x152a48)])
	)
	draw_circle(Vector2(760, 150), 220, rgb(0xff8b49, 0.05))
	draw_circle(Vector2(220, 360), 240, Color(_accent.r, _accent.g, _accent.b, 0.05))
	for s in stars:
		var tw: float = 0.5 + 0.5 * sin(_t * 2.0 + s.pos.x)
		draw_circle(s.pos, s.r, rgb(0xffffff, 0.08 + 0.16 * tw))
	for c in clouds:
		var p: Vector2 = c.pos
		var sc: float = c.sc
		draw_circle(p, 26 * sc, rgb(0x1a2c4a, 0.4))
		draw_circle(p + Vector2(28 * sc, 6 * sc), 20 * sc, rgb(0x1a2c4a, 0.4))
		draw_circle(p + Vector2(-26 * sc, 8 * sc), 18 * sc, rgb(0x1a2c4a, 0.4))
	_mountains(H - 60, 0x0d1d36, 0.7, fmod(_t * 12.0, 220.0))
	draw_polygon(
		PackedVector2Array([Vector2(0, H - 90), Vector2(W, H - 90), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([rgb(0x060d1c, 0.0), rgb(0x060d1c, 0.0), rgb(0x060d1c, 0.7), rgb(0x060d1c, 0.7)])
	)


func _mountains(base_y: float, hex: int, alpha: float, off: float) -> void:
	var span := 220.0
	var x := -off - span
	while x < W + span:
		Gfx.poly(self, [Vector2(x, base_y + 80), Vector2(x + 60, base_y), Vector2(x + 130, base_y + 80)], rgb(hex, alpha))
		Gfx.poly(self, [Vector2(x + 90, base_y + 80), Vector2(x + 160, base_y + 18), Vector2(x + 240, base_y + 80)], rgb(hex, alpha))
		x += span


func _draw_hero() -> void:
	var e := _ease(_appear)
	var bob := sin(_t * 1.5) * 8.0
	var pos := _hero + Vector2(0, bob)
	for em in embers:
		var k: float = 1.0 - em.age / em.life
		var col := rgb(0xffd24a) if em.hot else rgb(0xff7a1e)
		draw_circle(em.pos, 3.0 * k, Color(col.r, col.g, col.b, 0.7 * k * e))
	var wing_ang := sin(_t * 5.0) * 0.32 - 0.1
	var tail_wag := sin(_t * 3.0) * 5.0
	Gfx.dragon(self, pos, 1.25, 0.0, e, wing_ang, tail_wag, _t)


func _draw_confetti() -> void:
	if not _is_new_best:
		return
	var palette := [0xff6d6d, 0xffd36b, 0x7dd3fc, 0x78f0a4, 0xc4b5fd]
	for cf in confetti:
		var col := rgb(palette[cf.hue])
		var p: Vector2 = cf.pos
		var d := Vector2(4, 2).rotated(cf.rot)
		Gfx.poly(self, [p - d, p + Vector2(d.y, -d.x), p + d, p + Vector2(-d.y, d.x)], col)


func _draw_header() -> void:
	var e := _ease(_appear)
	var y := 104.0 - (1.0 - e) * 16.0
	var title := "NEW BEST RUN!" if _is_new_best else "RUN COMPLETE"
	var col := _accent if _is_new_best else rgb(0xfff3d6)
	var tw := _font.get_string_size(title, HORIZONTAL_ALIGNMENT_LEFT, -1, 54).x
	for r in [3.0, 2.0]:
		_bold(title, Vector2((W - tw) / 2.0, y), 54, Color(col.r, col.g, col.b, 0.06 * e), r)
	_bold(title, Vector2((W - tw) / 2.0, y), 54, Color(col.r, col.g, col.b, e), 1.4)

	var goal: String
	if _is_new_best:
		goal = "Best improved by %d" % (int(data.score) - int(data.previous_high_score))
	else:
		goal = "%d points to beat your best" % int(max(1, int(data.high_score) - int(data.score) + 1))
	_center("%s   ·   %s" % [str(data.mode_label), goal], y + 28, 16, rgb(0xcbd8f4, e))
	# Cause chip.
	var cause := str(data.cause)
	var cw := _font.get_string_size(cause, HORIZONTAL_ALIGNMENT_LEFT, -1, 14).x
	draw_rect(Rect2((W - cw) / 2.0 - 12, y + 42, cw + 24, 26), rgb(0x2a1018, 0.7 * e))
	_center(cause, y + 60, 14, rgb(0xffb3b3, e))


func _draw_stat_cards() -> void:
	var e := _ease(clampf(_appear * 1.4 - 0.2, 0.0, 1.0))
	if e <= 0.001:
		return
	var cards := [
		{"label": "SCORE", "value": str(int(data.score)), "hex": 0xffd36b},
		{"label": "BEST", "value": str(int(data.high_score)), "hex": 0x7dd3fc},
		{"label": "DISTANCE", "value": "%dm" % int(data.distance), "hex": 0x78f0a4},
		{"label": "TIME", "value": _format_time(data.survived_seconds), "hex": 0xc4b5fd},
	]
	var cw := 168.0
	var gap := 18.0
	var total := cards.size() * cw + (cards.size() - 1) * gap
	var x0 := (W - total) / 2.0
	for i in cards.size():
		var card = cards[i]
		var ce := _ease(clampf(_appear * 1.5 - 0.2 - i * 0.08, 0.0, 1.0))
		var r := Rect2(x0 + i * (cw + gap), 246 + (1.0 - ce) * 18.0, cw, 104)
		var ac := rgb(card.hex)
		draw_rect(r, rgb(0x0b1426, 0.82 * ce))
		draw_rect(Rect2(r.position, Vector2(r.size.x, 4)), Color(ac.r, ac.g, ac.b, ce))
		draw_rect(r, rgb(0xffffff, 0.08 * ce), false, 1.0)
		_center_at(str(card.label), r.position.x + cw / 2.0, r.position.y + 38, 13, rgb(0x9fb0d0, ce))
		_center_at(str(card.value), r.position.x + cw / 2.0, r.position.y + 76, 32, Color(ac.r, ac.g, ac.b, ce))


func _draw_buttons() -> void:
	var e := _ease(clampf(_appear * 1.4 - 0.4, 0.0, 1.0))
	if e <= 0.001:
		return
	var m := get_global_mouse_position()
	var pulse := 0.5 + 0.5 * sin(_t * 3.0)
	# Retry (primary, accent).
	var rh := _retry_rect.has_point(m)
	draw_rect(Rect2(_retry_rect.position - Vector2(5, 5), _retry_rect.size + Vector2(10, 10)), Color(_accent.r, _accent.g, _accent.b, (0.16 + 0.16 * pulse) * e))
	draw_rect(_retry_rect, Color(_accent.r, _accent.g, _accent.b, e) if rh else Color(_accent.r * 0.92, _accent.g * 0.92, _accent.b * 0.92, e))
	_btn_label("↻  RETRY", _retry_rect, rgb(0x0a1420, e))
	# Menu (secondary, outline).
	var mh := _menu_rect.has_point(m)
	draw_rect(_menu_rect, rgb(0x16263f, (0.95 if mh else 0.8) * e))
	draw_rect(_menu_rect, rgb(0xffffff, (0.4 if mh else 0.15) * e), false, 1.5)
	_btn_label("☰  MENU", _menu_rect, rgb(0xe8f0ff, e))


func _draw_footer() -> void:
	var e := _ease(_appear)
	_center("Enter / click Retry      Esc  Menu", H - 26, 13, rgb(0x8aa0c8, e))


# --- helpers -----------------------------------------------------------------

func _btn_label(s: String, r: Rect2, col: Color) -> void:
	var tw := _font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, 20).x
	draw_string(_font, r.position + Vector2((r.size.x - tw) / 2.0, 36), s, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, col)


func _format_time(seconds: float) -> String:
	var s := int(max(0, floor(seconds)))
	return "%d:%02d" % [s / 60, s % 60]


func _ease(t: float) -> float:
	t = clampf(t, 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)


func _bold(s: String, pos: Vector2, size: int, color: Color, spread: float) -> void:
	for off in [Vector2(spread, 0), Vector2(-spread, 0), Vector2(0, spread), Vector2(0, -spread)]:
		draw_string(_font, pos + off, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func _center(s: String, y: float, size: int, color: Color) -> void:
	_center_at(s, W / 2.0, y, size, color)


func _center_at(s: String, cx: float, y: float, size: int, color: Color) -> void:
	var width := _font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	draw_string(_font, Vector2(cx - width / 2.0, y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func rgb(hex: int, alpha := 1.0) -> Color:
	return Gfx.rgb(hex, alpha)
