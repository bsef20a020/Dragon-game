extends Control
## In-run HUD — restyled to match the menu/game-over: a compact accent-barred
## stat panel, heart pips, a glowing fire-charge bar, a distance pill, and a
## full-screen pause overlay. Lives under a CanvasLayer so it ignores shake.

var snapshot := {
	"score": 0, "high_score": 0, "health": 3, "max_health": 3,
	"mode": "classic", "mode_label": "", "distance": 0.0,
	"ability_ratio": 0.0, "paused": false,
}

var _font: Font
var _t := 0.0

# On-screen button geometry — single source of truth for both drawing and
# hit-testing (game.gd queries hits_fire()/hits_pause() instead of hard-coding).
const FIRE_CENTER := Vector2(960 - 82, 540 - 76)  # 960x540 viewport
const FIRE_RADIUS := 44.0
const PAUSE_CENTER := Vector2(960 - 48, 64)
const PAUSE_RADIUS := 24.0


func _ready() -> void:
	_font = ThemeDB.fallback_font
	set_anchors_preset(Control.PRESET_FULL_RECT)


func hits_fire(p: Vector2) -> bool:
	return p.distance_to(FIRE_CENTER) <= FIRE_RADIUS


func hits_pause(p: Vector2) -> bool:
	return p.distance_to(PAUSE_CENTER) <= PAUSE_RADIUS


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func update_hud(snap: Dictionary) -> void:
	snapshot = snap
	queue_redraw()


func _draw() -> void:
	var w := float(GameData.GAME_WIDTH)
	var accent := Gfx.accent_of(snapshot.get("mode", "classic"))
	var ability := clampf(snapshot.ability_ratio, 0.0, 1.0)

	# --- Top-left stat panel ---
	var panel := Rect2(16, 14, 320, 92)
	draw_rect(panel, rgb(0x070f20, 0.62))
	draw_rect(Rect2(panel.position, Vector2(4, panel.size.y)), accent)
	draw_rect(panel, rgb(0xffffff, 0.10), false, 1.0)

	_text("SCORE", Vector2(36, 38), 11, rgb(0x8aa0c8))
	_bold("%d" % int(snapshot.score), Vector2(34, 76), 34, rgb(0xfff3d6), 1.2)
	_text("%s  ·  BEST %d" % [str(snapshot.mode_label).to_upper(), int(snapshot.high_score)], Vector2(150, 38), 12, rgb(0xcbd8f4))

	# Heart pips.
	var max_pips := int(max(1, snapshot.max_health))
	for i in max_pips:
		var on: bool = i < int(snapshot.health)
		_heart(Vector2(156 + i * 20, 56), 6.0, rgb(0xff6d6d) if on else rgb(0x33425e))

	# Fire charge bar.
	var bx := 150.0
	var by := 78.0
	var bw := 168.0
	draw_rect(Rect2(bx, by, bw, 8), rgb(0x0a1424, 0.8))
	var fill := rgb(0xffd36b) if ability >= 1.0 else accent
	draw_rect(Rect2(bx, by, bw * ability, 8), fill)
	if ability >= 1.0:
		var glow := 0.4 + 0.3 * sin(_t * 6.0)
		draw_rect(Rect2(bx - 2, by - 2, bw + 4, 12), rgb(0xffd36b, glow), false, 1.5)
		_text("FIRE READY", Vector2(bx, by - 4), 10, rgb(0xffd36b))
	else:
		_text("FIRE %d%%" % int(round(ability * 100)), Vector2(bx, by - 4), 10, rgb(0x8aa0c8))

	# --- Distance pill (top-right) ---
	var dist := "%d m" % int(snapshot.distance)
	var dw := _font.get_string_size(dist, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x
	var pill := Rect2(w - 150 - dw, 18, dw + 28, 30)
	draw_rect(pill, rgb(0x070f20, 0.55))
	draw_rect(pill, rgb(0xffffff, 0.10), false, 1.0)
	draw_circle(pill.position + Vector2(14, 15), 3, accent)
	_text(dist, pill.position + Vector2(24, 20), 16, rgb(0xe8f0ff))

	# --- On-screen fire ring (bottom-right) + pause button (top-right) ---
	var fire_c := FIRE_CENTER
	draw_circle(fire_c, FIRE_RADIUS, rgb(0x070f20, 0.55))
	draw_arc(fire_c, FIRE_RADIUS, 0, TAU, 32, rgb(0xffffff, 0.14), 3.0)
	draw_arc(fire_c, 37, -PI / 2.0, -PI / 2.0 + TAU * ability, 40, rgb(0xffd36b) if ability >= 1.0 else accent, 6.0)
	draw_circle(fire_c, 29, rgb(0xffd36b) if ability >= 1.0 else rgb(0x1b2c45))
	_center_at("F", fire_c.x, fire_c.y + 8, 24, rgb(0x0a1420) if ability >= 1.0 else rgb(0xdbe7ff))

	var pause_c := PAUSE_CENTER
	draw_circle(pause_c, PAUSE_RADIUS, rgb(0x070f20, 0.55))
	draw_arc(pause_c, PAUSE_RADIUS, 0, TAU, 24, rgb(0xffffff, 0.14), 2.0)
	draw_rect(Rect2(pause_c.x - 6, pause_c.y - 7, 4, 14), rgb(0xe8f0ff))
	draw_rect(Rect2(pause_c.x + 2, pause_c.y - 7, 4, 14), rgb(0xe8f0ff))

	# --- Pause overlay ---
	if snapshot.paused:
		draw_rect(Rect2(0, 0, w, GameData.GAME_HEIGHT), rgb(0x05070f, 0.55))
		_center_at("PAUSED", w / 2.0, GameData.GAME_HEIGHT / 2.0, 52, rgb(0xfff3d6))
		_center_at("Press P or Esc to resume", w / 2.0, GameData.GAME_HEIGHT / 2.0 + 38, 15, rgb(0xcbd8f4))


func _heart(c: Vector2, s: float, col: Color) -> void:
	draw_circle(Vector2(c.x - s * 0.45, c.y - s * 0.25), s * 0.55, col)
	draw_circle(Vector2(c.x + s * 0.45, c.y - s * 0.25), s * 0.55, col)
	Gfx.poly(self, [Vector2(c.x - s * 0.9, c.y - s * 0.05), Vector2(c.x + s * 0.9, c.y - s * 0.05), Vector2(c.x, c.y + s)], col)


func _bold(s: String, pos: Vector2, size: int, color: Color, spread: float) -> void:
	for off in [Vector2(spread, 0), Vector2(-spread, 0), Vector2(0, spread), Vector2(0, -spread)]:
		draw_string(_font, pos + off, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func _center_at(s: String, cx: float, y: float, size: int, color: Color) -> void:
	var width := _font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	draw_string(_font, Vector2(cx - width / 2.0, y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func _text(s: String, pos: Vector2, size: int, color: Color) -> void:
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func rgb(hex: int, alpha := 1.0) -> Color:
	return Gfx.rgb(hex, alpha)
