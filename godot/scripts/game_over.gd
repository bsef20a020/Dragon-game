extends Control
## Run summary — port of src/game/scenes/GameOverScene.ts.

const W := 960
const H := 540

var data := {}
var _font: Font
var _t := 0.0
var _retry_rect := Rect2(W / 2.0 - 178, 364, 120, 40)
var _menu_rect := Rect2(W / 2.0 + 58, 364, 100, 40)


func _ready() -> void:
	_font = ThemeDB.fallback_font
	set_anchors_preset(Control.PRESET_FULL_RECT)
	data = GameData.last_result if not GameData.last_result.is_empty() else {
		"mode": "classic", "mode_label": "Classic", "score": 0,
		"previous_high_score": 0, "high_score": 0, "distance": 0.0,
		"survived_seconds": 0.0, "cause": "Run complete.",
	}


func _process(delta: float) -> void:
	_t += delta
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
	get_tree().change_scene_to_file("res://scenes/Game.tscn")


func _to_menu() -> void:
	get_tree().change_scene_to_file("res://scenes/Menu.tscn")


func _draw() -> void:
	_draw_backdrop()
	var is_new_best: bool = data.score > data.previous_high_score
	var title := "New Best Run" if is_new_best else "Run Complete"
	_center(title, 116, 52, rgb(0xfff3d6))

	var next_goal: String
	if is_new_best:
		next_goal = "Best improved by %d." % (int(data.score) - int(data.previous_high_score))
	else:
		next_goal = "%d points to beat your best." % int(max(1, int(data.high_score) - int(data.score) + 1))
	_center("%s  |  %s" % [data.mode_label, next_goal], 157, 16, rgb(0xcbd8f4))
	_center(str(data.cause), 190, 14, rgb(0xffb3b3))

	_stat_card(192, 260, "Score", str(int(data.score)), rgb(0xffd36b))
	_stat_card(384, 260, "Best", str(int(data.high_score)), rgb(0x7dd3fc))
	_stat_card(576, 260, "Distance", "%dm" % int(data.distance), rgb(0x78f0a4))
	_stat_card(768, 260, "Time", _format_time(data.survived_seconds), rgb(0xc4b5fd))

	var lift := sin(_t * 3.5) * 2.0
	draw_rect(Rect2(_retry_rect.position + Vector2(0, lift), _retry_rect.size), rgb(0xffd36b))
	_text("Retry", _retry_rect.position + Vector2(30, 27 + lift), 20, rgb(0x142033))
	draw_rect(Rect2(_menu_rect.position + Vector2(0, lift), _menu_rect.size), rgb(0x13213a))
	_text("Menu", _menu_rect.position + Vector2(24, 27 + lift), 20, rgb(0xe8f0ff))

	_center("Enter retries. Esc returns to menu.", 450, 14, rgb(0x94a3b8))


func _draw_backdrop() -> void:
	var top := rgb(0x050812)
	var bot := rgb(0x102844)
	draw_polygon(
		PackedVector2Array([Vector2(0, 0), Vector2(W, 0), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([top, top, bot, bot])
	)
	draw_circle(Vector2(230, 140), 210, rgb(0xff8b49, 0.13))
	draw_circle(Vector2(752, 160), 250, rgb(0x7dd3fc, 0.11))
	for i in 70:
		draw_circle(Vector2(float((i * 89) % W), float((i * 47) % H)), 1.2, rgb(0xffffff, 0.08 + (i % 5) * 0.03))


func _stat_card(cx: float, cy: float, label: String, value: String, color: Color) -> void:
	var r := Rect2(cx - 78, cy - 52, 156, 104)
	draw_rect(r, rgb(0x0b1020, 0.72))
	draw_rect(r, rgb(0xffffff, 0.12), false, 1.0)
	_center_at(label, cx, cy - 18, 13, rgb(0x94a3b8))
	_center_at(value, cx, cy + 22, 30, color)


func _format_time(seconds: float) -> String:
	var s := int(max(0, floor(seconds)))
	return "%d:%02d" % [s / 60, s % 60]


func _center(s: String, y: float, size: int, color: Color) -> void:
	_center_at(s, W / 2.0, y, size, color)


func _center_at(s: String, cx: float, y: float, size: int, color: Color) -> void:
	var width := _font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	draw_string(_font, Vector2(cx - width / 2.0, y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func _text(s: String, pos: Vector2, size: int, color: Color) -> void:
	draw_string(_font, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)


func rgb(hex: int, alpha := 1.0) -> Color:
	return Color(((hex >> 16) & 0xff) / 255.0, ((hex >> 8) & 0xff) / 255.0, (hex & 0xff) / 255.0, alpha)
