extends Control
## In-run HUD — port of src/game/scenes/HudScene.ts.
## Lives under a CanvasLayer so it stays fixed while the world camera shakes.

var snapshot := {
	"score": 0,
	"high_score": 0,
	"health": 3,
	"max_health": 3,
	"mode_label": "",
	"distance": 0.0,
	"ability_ratio": 0.0,
	"paused": false,
}

var _font: Font
var _t := 0.0


func _ready() -> void:
	_font = ThemeDB.fallback_font
	set_anchors_preset(Control.PRESET_FULL_RECT)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func update_hud(snap: Dictionary) -> void:
	snapshot = snap
	queue_redraw()


func _draw() -> void:
	var w := float(GameData.GAME_WIDTH)

	# Top-left info panel.
	_panel(Rect2(18, 16, 386, 128))
	_text("Score %d" % int(snapshot.score), Vector2(34, 52), 27, rgb(0xfff3d6))
	_text("%s  |  Best %d" % [snapshot.mode_label, int(snapshot.high_score)], Vector2(36, 78), 13, rgb(0xcbd8f4))
	_text("HP %d/%d" % [int(snapshot.health), int(snapshot.max_health)], Vector2(36, 108), 13, rgb(0xe8f0ff))

	var ability_ratio := clampf(snapshot.ability_ratio, 0.0, 1.0)
	_text("FIRE READY" if ability_ratio >= 1.0 else "FIRE %d%%" % int(round(ability_ratio * 100)),
		Vector2(204, 108), 13, rgb(0xe8f0ff))

	# Distance (top-right) and pause banner (top-center).
	_text("%dm" % int(snapshot.distance), Vector2(w - 110, 44), 14, rgb(0xcbd8f4))
	if snapshot.paused:
		_panel(Rect2(w / 2.0 - 48, 22, 96, 30))
		_text("Paused", Vector2(w / 2.0 - 28, 44), 15, rgb(0xfff3d6))

	# Health pips.
	var max_pips := int(max(1, snapshot.max_health))
	for i in max_pips:
		var x := 52 + i * 20
		var on: bool = i < int(snapshot.health)
		draw_circle(Vector2(x, 120), 6, rgb(0xff7f7f) if on else rgb(0x263247))
		draw_arc(Vector2(x, 120), 6, 0, TAU, 16, rgb(0xffffff, 0.28 if on else 0.12), 1.0)

	# Fire charge bar.
	draw_rect(Rect2(204, 116, 158, 9), Color(0, 0, 0, 0.32))
	draw_rect(Rect2(204, 116, 158 * ability_ratio, 9), rgb(0xffd36b) if ability_ratio >= 1.0 else rgb(0x7dd3fc))

	# On-screen fire cooldown ring (bottom-right) + pause button (top-right).
	var fire_c := Vector2(w - 82, float(GameData.GAME_HEIGHT) - 76)
	draw_circle(fire_c, 44, Color(5 / 255.0, 8 / 255.0, 18 / 255.0, 0.58))
	draw_arc(fire_c, 44, 0, TAU, 32, rgb(0xffffff, 0.16), 3.0)
	draw_arc(fire_c, 37, -PI / 2.0, -PI / 2.0 + TAU * ability_ratio, 32,
		rgb(0xffd36b) if ability_ratio >= 1.0 else rgb(0x7dd3fc), 6.0)
	draw_circle(fire_c, 29, rgb(0xffd36b) if ability_ratio >= 1.0 else rgb(0x263247))
	_text("F", fire_c + Vector2(-5, 8), 25, rgb(0x142033) if ability_ratio >= 1.0 else rgb(0xdbe7ff))

	var pause_c := Vector2(w - 48, 46)
	draw_circle(pause_c, 28, Color(5 / 255.0, 8 / 255.0, 18 / 255.0, 0.58))
	draw_arc(pause_c, 28, 0, TAU, 24, rgb(0xffffff, 0.16), 2.0)
	_text("II", pause_c + Vector2(-6, 6), 16, rgb(0xe8f0ff))


func _panel(r: Rect2) -> void:
	draw_rect(r, Color(5 / 255.0, 8 / 255.0, 18 / 255.0, 0.62))
	draw_rect(r, rgb(0xffffff, 0.16), false, 1.0)


func _text(s: String, pos: Vector2, size: int, color: Color) -> void:
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func rgb(hex: int, alpha := 1.0) -> Color:
	return Color(((hex >> 16) & 0xff) / 255.0, ((hex >> 8) & 0xff) / 255.0, (hex & 0xff) / 255.0, alpha)
