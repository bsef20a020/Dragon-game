class_name Gfx
extends RefCounted
## Shared drawing helpers — single source of truth for the dragon art, the
## colour helper, and the vector primitives used across every screen.
## All functions are static and take the target CanvasItem to draw onto.


## Per-mode accent colours, shared by every screen.
const MODE_ACCENT := {
	"classic": 0x7dd3fc, "bossrush": 0xff8b49, "daily": 0xffd36b,
	"zen": 0x78f0a4, "hardcore": 0xff6d6d,
}


static func accent_of(mode_key: String) -> Color:
	return rgb(MODE_ACCENT.get(mode_key, 0x7dd3fc))


static func rgb(hex: int, alpha := 1.0) -> Color:
	return Color(((hex >> 16) & 0xff) / 255.0, ((hex >> 8) & 0xff) / 255.0, (hex & 0xff) / 255.0, alpha)


static func ellipse(ci: CanvasItem, center: Vector2, rx: float, ry: float, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in 24:
		var t := TAU * i / 24.0
		pts.append(center + Vector2(cos(t) * rx, sin(t) * ry))
	ci.draw_colored_polygon(pts, color)


static func poly(ci: CanvasItem, pts: Array, color: Color) -> void:
	var p := PackedVector2Array()
	for v in pts:
		p.append(v)
	ci.draw_colored_polygon(p, color)


static func wing(ci: CanvasItem, pivot: Vector2, ang: float, fill: Color) -> void:
	# Scalloped three-fingered dragon wing, rotated about the shoulder pivot.
	var local := [
		Vector2(0, 2), Vector2(13, -28), Vector2(5, -25), Vector2(2, -45),
		Vector2(-7, -29), Vector2(-17, -39), Vector2(-13, -23), Vector2(-24, -21), Vector2(-9, -6)
	]
	var poly_pts := PackedVector2Array()
	for q in local:
		poly_pts.append(pivot + (q as Vector2).rotated(ang))
	ci.draw_colored_polygon(poly_pts, fill)
	for tip in [Vector2(13, -28), Vector2(2, -45), Vector2(-17, -39), Vector2(-24, -21)]:
		ci.draw_line(pivot, pivot + (tip as Vector2).rotated(ang), Color(fill, 0.6), 1.4)


## Draw the dragon facing right, centred at `pos`.
##   fire: -1.0 = idle mouth flame; 0..1 = active fire-breath progress.
static func dragon(ci: CanvasItem, pos: Vector2, scale: float, rot: float, alpha: float,
		wing_ang: float, tail_wag: float, t: float, fire := -1.0, glow := true) -> void:
	var a := alpha
	if glow:
		ci.draw_set_transform(pos, 0.0, Vector2(scale, scale))
		ci.draw_circle(Vector2.ZERO, 50, rgb(0xff8b49, 0.05 * a))
		ci.draw_circle(Vector2.ZERO, 34, rgb(0xff8b49, 0.06 * a))

	ci.draw_set_transform(pos, rot, Vector2(scale, scale))
	var c_body := rgb(0xe2502f, a)
	var c_top := rgb(0xff7a4d, 0.85 * a)
	var c_belly := rgb(0xffd9a0, 0.95 * a)
	var c_dark := rgb(0xc8541f, a)
	var c_horn := rgb(0xffe6a8, a)

	wing(ci, Vector2(-2, -8), wing_ang * 0.85 - 0.15, rgb(0x9c3f18, 0.8 * a))
	poly(ci, [Vector2(-22, -9), Vector2(-44, -6 + tail_wag * 0.5), Vector2(-64, -13 + tail_wag),
		Vector2(-54, -2 + tail_wag), Vector2(-68, 5 + tail_wag), Vector2(-48, 8 + tail_wag * 0.5), Vector2(-22, 11)], c_body)
	poly(ci, [Vector2(-58, -2 + tail_wag), Vector2(-74, 1 + tail_wag), Vector2(-58, 7 + tail_wag), Vector2(-64, 2 + tail_wag)], c_horn)
	for i in 4:
		var sx := -18.0 + i * 11.0
		poly(ci, [Vector2(sx, -13), Vector2(sx + 5, -22), Vector2(sx + 9, -12)], c_horn)
	ellipse(ci, Vector2(-2, 0), 30, 18, c_body)
	ellipse(ci, Vector2(-4, -4), 24, 11, c_top)
	ellipse(ci, Vector2(-4, 8), 21, 9, c_belly)
	poly(ci, [Vector2(-2, 13), Vector2(8, 13), Vector2(11, 23), Vector2(1, 21)], c_dark)
	ci.draw_circle(Vector2(11, 23), 1.4, c_horn)
	ci.draw_circle(Vector2(7, 24), 1.4, c_horn)
	poly(ci, [Vector2(12, -10), Vector2(34, -16), Vector2(42, -3), Vector2(20, 3)], c_body)
	ellipse(ci, Vector2(43, -9), 14, 11, c_body)
	ellipse(ci, Vector2(43, -13), 11, 6, c_top)
	poly(ci, [Vector2(50, -13), Vector2(67, -7), Vector2(65, -1), Vector2(50, -2)], c_body)
	poly(ci, [Vector2(50, 0), Vector2(63, 0), Vector2(50, 4)], c_dark)
	poly(ci, [Vector2(40, -18), Vector2(28, -32), Vector2(37, -18)], c_horn)
	poly(ci, [Vector2(46, -17), Vector2(38, -30), Vector2(50, -16)], c_horn)
	ci.draw_circle(Vector2(49, -11), 3.8, rgb(0xfff6e6, a))
	ci.draw_circle(Vector2(50, -11), 1.9, rgb(0x101826, a))
	ci.draw_circle(Vector2(48, -12), 0.9, rgb(0xffffff, a))
	ci.draw_circle(Vector2(63, -5), 1.0, rgb(0x101826, a))

	if fire >= 0.0:
		var fk := sin(clampf(fire, 0.0, 1.0) * PI)
		var ln := 70.0 * fk
		poly(ci, [Vector2(64, -8), Vector2(64 + ln, -2 - 8 * fk), Vector2(64 + ln + 14, -2),
			Vector2(64 + ln, -2 + 8 * fk), Vector2(64, 4)], rgb(0xff7a1e, 0.8 * fk * a))
		poly(ci, [Vector2(64, -4), Vector2(64 + ln * 0.7, -2), Vector2(64, 2)], rgb(0xffe070, 0.9 * fk * a))
	else:
		var fl := 1.0 + sin(t * 9.0) * 0.28
		poly(ci, [Vector2(65, -8), Vector2(66 + 10 * fl, -3), Vector2(65, 3), Vector2(70, -3)], rgb(0xff7a1e, 0.85 * a))
		poly(ci, [Vector2(67, -6), Vector2(66 + 7 * fl, -3), Vector2(67, 0)], rgb(0xffe070, 0.9 * a))

	ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
