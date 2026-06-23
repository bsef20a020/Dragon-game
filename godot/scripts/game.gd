extends Node2D
## Core gameplay — a faithful port of src/game/scenes/GameScene.ts.
## The Phaser version stepped physics in milliseconds, so we keep delta in ms
## (delta_ms = delta * 1000) and reuse the exact same tuning constants/formulas.

const W := 960
const H := 540
const DRAGON_X := 176.0
const FIRE_COOLDOWN_MAX := 1650.0

var mode := {}
var high_score := 0
var score := 0.0
var distance := 0.0
var health := 3
var max_health := 3
var velocity := 0.0
var speed := 0.0
var spawn_timer := 0.0
var time_alive := 0.0
var fire_cooldown := 0.0
var last_cooldown_hint_at := 0.0
var invulnerable_ms := 0.0
var shield_ms := 0.0
var paused_run := false
var game_ended := false

var dragon_pos := Vector2(DRAGON_X, H / 2.0)
var dragon_angle := 0.0
var dragon_scale := 1.0
var dragon_alpha := 1.0
var wing_phase := 0.0
var wing_pulse := 0.0

var pillars: Array = []   # {x, body_w, cap_w, gap_y, gap, danger, scored}
var pickups: Array = []   # {pos, kind, base_y, phase, rot}
var stars: Array = []     # {pos, speed}
var clouds: Array = []    # {pos, speed, scale}
var particles: Array = [] # {pos, vel, color, life, age, scale}
var ember_timer := 0.0
var floaters: Array = []  # {text, pos, color, life, age}
var beams: Array = []     # {pos, life, age}

var horizon_offset := 0.0
var shake_time := 0.0
var shake_dur := 0.0
var shake_amp := 0.0
var shake_offset := Vector2.ZERO
var flash_time := 0.0
var flash_dur := 0.0
var flash_color := Color.WHITE
var now_ms := 0.0

@onready var hud: Control = $HudLayer/Hud

var _font: Font


func _ready() -> void:
	_font = ThemeDB.fallback_font
	mode = GameData.get_mode(GameData.selected_mode_key)
	high_score = SaveData.get_high_score(mode.key)
	health = mode.health
	max_health = mode.health
	speed = mode.speed
	spawn_timer = mode.spawn_ms * 0.55
	_seed_stars()
	_seed_clouds()
	emit_hud()


func _seed_stars() -> void:
	for i in 84:
		var x := float((i * 67) % W)
		var y := float((i * 43) % (H - 60))
		stars.append({"pos": Vector2(x, y), "speed": 12.0 + (i % 6) * 6.0})


func _seed_clouds() -> void:
	for i in 6:
		clouds.append({
			"pos": Vector2(float((i * 173) % W), 70.0 + (i * 61) % 230),
			"speed": 16.0 + (i % 4) * 9.0,
			"scale": 0.8 + (i % 3) * 0.35,
		})


func _process(delta: float) -> void:
	# While paused the whole world freezes — no physics, no effects, no clock.
	if paused_run and not game_ended:
		emit_hud()
		queue_redraw()
		return

	var delta_ms := delta * 1000.0
	now_ms += delta_ms
	_update_effects(delta, delta_ms)
	if game_ended:
		queue_redraw()
		return

	var seconds := delta
	time_alive += seconds
	spawn_timer += delta_ms
	var was_fire_cooling := fire_cooldown > 0.0
	invulnerable_ms = max(0.0, invulnerable_ms - delta_ms)
	shield_ms = max(0.0, shield_ms - delta_ms)
	fire_cooldown = max(0.0, fire_cooldown - delta_ms)
	if was_fire_cooling and fire_cooldown == 0.0:
		show_float_text("Fire ready", dragon_pos.x + 58, dragon_pos.y - 40, rgb(0xffd36b))

	speed = mode.speed + min(150.0, time_alive * 4.5 + score * 0.22)
	distance += (speed * seconds) / 8.0
	add_score(seconds * 1.8, false)

	velocity += mode.gravity * delta_ms
	dragon_pos.y += velocity * delta_ms
	dragon_angle = clampf(velocity * 110.0, -28.0, 58.0)
	dragon_alpha = 0.48 if (invulnerable_ms > 0.0 and int(now_ms / 80.0) % 2 == 0) else 1.0

	_animate_world(seconds)
	_update_obstacles(seconds, delta_ms)
	_update_pickups(seconds)
	_check_world_bounds()
	_spawn_ember_trail(seconds)
	emit_hud()
	queue_redraw()


func _spawn_ember_trail(seconds: float) -> void:
	# Continuous warm engine trail streaming off the dragon's tail.
	ember_timer -= seconds
	if ember_timer > 0.0:
		return
	ember_timer = 0.03
	var hot := randf() < 0.4
	particles.append({
		"pos": dragon_pos + Vector2(-34, randf_range(-4.0, 10.0)),
		"vel": Vector2(-randf_range(40.0, 90.0), randf_range(-12.0, 12.0)),
		"color": rgb(0xffd24a) if hot else rgb(0xff7a1e),
		"life": randf_range(0.25, 0.5),
		"age": 0.0,
		"scale": randf_range(0.4, 0.9),
	})


# --- Input -------------------------------------------------------------------

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_RIGHT:
			cast_fire()
		elif mb.button_index == MOUSE_BUTTON_LEFT:
			if paused_run:
				# Pause-menu buttons (HUD owns their geometry).
				if hud.hits_resume(mb.position):
					toggle_pause()
				elif hud.hits_restart(mb.position):
					restart()
				elif hud.hits_menu(mb.position):
					quit_to_menu()
			elif hud.hits_fire(mb.position):
				cast_fire()
			elif hud.hits_pause(mb.position):
				toggle_pause()
			else:
				flap()
	elif event.is_action_pressed("pause_toggle"):
		toggle_pause()
	elif paused_run and event is InputEventKey and event.pressed:
		if (event as InputEventKey).keycode == KEY_R:
			restart()
		elif (event as InputEventKey).keycode == KEY_M:
			quit_to_menu()
	elif event.is_action_pressed("flap"):
		flap()
	elif event.is_action_pressed("fire"):
		cast_fire()


func restart() -> void:
	GameData.selected_mode_key = mode.key
	Audio.play("pickup", -8.0)
	get_tree().change_scene_to_file("res://scenes/Game.tscn")


func quit_to_menu() -> void:
	Audio.play("flap", -12.0)
	get_tree().change_scene_to_file("res://scenes/Menu.tscn")


func flap() -> void:
	if paused_run or game_ended:
		return
	velocity = mode.flap_velocity
	wing_pulse = 1.0
	spawn_burst(dragon_pos.x, dragon_pos.y + 18, rgb(0x7dd3fc), 5)
	Audio.play("flap", -10.0)


func toggle_pause() -> void:
	if game_ended:
		return
	paused_run = not paused_run


# --- World / obstacles -------------------------------------------------------

func _animate_world(seconds: float) -> void:
	for star in stars:
		star.pos.x -= star.speed * seconds
		if star.pos.x < -4.0:
			star.pos.x = W + 4.0
			star.pos.y = randf_range(6.0, H - 82.0)
	for cloud in clouds:
		cloud.pos.x -= cloud.speed * seconds
		if cloud.pos.x < -90.0:
			cloud.pos.x = W + 90.0
			cloud.pos.y = randf_range(60.0, 280.0)
	horizon_offset += speed * seconds * 0.18


func _update_obstacles(seconds: float, delta_ms: float) -> void:
	var difficulty_ms: float = min(360.0, time_alive * 8.0)
	var interval: float = max(760.0, mode.spawn_ms - difficulty_ms)
	if spawn_timer >= interval:
		spawn_timer = 0.0
		_spawn_pillar()

	var move_by := speed * seconds
	for pillar in pillars:
		pillar.x -= move_by

	_resolve_pillar_collision()

	var live: Array = []
	for pillar in pillars:
		if not pillar.scored and pillar.x + pillar.cap_w / 2.0 < DRAGON_X:
			pillar.scored = true
			add_score(12.0 if pillar.danger else 7.0)
		if pillar.x > -110.0:
			live.append(pillar)
	pillars = live

	dragon_scale = (1.0 + sin(now_ms / 90.0) * 0.02) if shield_ms > 0.0 else 1.0


func _spawn_pillar() -> void:
	var danger := randi_range(0, 100) > 72
	var gap: float = mode.gap + (-14.0 if danger else 0.0)
	var margin := 64.0
	var gap_y := float(randi_range(int(margin), int(H - margin - gap)))
	var body_w := 84.0 if danger else 74.0
	var x := float(W + 74)
	pillars.append({
		"x": x,
		"body_w": body_w,
		"cap_w": body_w + 16.0,
		"gap_y": gap_y,
		"gap": gap,
		"danger": danger,
		"scored": false,
	})

	if randi_range(0, 100) > 42:
		var kind := _pick_pickup_kind()
		var pickup_y := clampf(gap_y + gap / 2.0 + randf_range(-44.0, 44.0), 48.0, H - 48.0)
		pickups.append({
			"pos": Vector2(x + randf_range(72.0, 126.0), pickup_y),
			"kind": kind,
			"base_y": pickup_y,
			"phase": 0.0,
			"rot": 0.0,
		})


func _pick_pickup_kind() -> String:
	var roll := randi_range(1, 100)
	if roll > 91 and health < max_health:
		return "heart"
	if roll > 82:
		return "shield"
	return "crystal"


func _resolve_pillar_collision() -> void:
	if invulnerable_ms > 0.0:
		return
	var dr := dragon_bounds()
	for pillar in pillars:
		for part in _pillar_rects(pillar):
			if dr.intersects(part):
				take_damage("Clipped a volatile gate." if pillar.danger else "Clipped a sky gate.")
				return


func _pillar_rects(pillar: Dictionary) -> Array:
	var bw: float = pillar.body_w
	var cw: float = pillar.cap_w
	var gy: float = pillar.gap_y
	var gp: float = pillar.gap
	var bottom_y := gy + gp
	return [
		Rect2(pillar.x - bw / 2.0, 0.0, bw, gy),                    # top body
		Rect2(pillar.x - bw / 2.0, bottom_y, bw, H - bottom_y),     # bottom body
		Rect2(pillar.x - cw / 2.0, gy - 7.0, cw, 14.0),            # top cap
		Rect2(pillar.x - cw / 2.0, bottom_y - 7.0, cw, 14.0),      # bottom cap
	]


# --- Pickups -----------------------------------------------------------------

func _update_pickups(seconds: float) -> void:
	var move_by := speed * seconds
	var dr := dragon_bounds()
	var live: Array = []
	for pickup in pickups:
		pickup.pos.x -= move_by
		pickup.rot += seconds * 2.4
		pickup.phase += seconds * 6.0
		pickup.pos.y = pickup.base_y + sin(pickup.phase) * 10.0
		var pr := Rect2(pickup.pos.x - 12, pickup.pos.y - 12, 24, 24)
		if dr.intersects(pr):
			collect_pickup(pickup)
		elif pickup.pos.x > -40.0:
			live.append(pickup)
	pickups = live


func collect_pickup(pickup: Dictionary) -> void:
	var x: float = pickup.pos.x
	var y: float = pickup.pos.y
	Audio.play("pickup", -8.0)
	match pickup.kind:
		"heart":
			health = min(max_health, health + 1)
			spawn_burst(x, y, rgb(0xff7f7f), 12)
			show_float_text("HP +1", x, y - 20, rgb(0xffb3b3))
		"shield":
			shield_ms = 4200.0
			spawn_burst(x, y, rgb(0x78f0a4), 14)
			show_float_text("Shield", x, y - 20, rgb(0xa2f7be))
		_:
			add_score(18.0)
			spawn_burst(x, y, rgb(0x7dd3fc), 10)
			show_float_text("+18", x, y - 20, rgb(0x7dd3fc))


# --- Fire ability ------------------------------------------------------------

func cast_fire() -> void:
	if paused_run or game_ended:
		return
	if fire_cooldown > 0.0:
		if now_ms - last_cooldown_hint_at > 650.0:
			last_cooldown_hint_at = now_ms
			show_float_text("Cooling", dragon_pos.x + 70, dragon_pos.y - 36, rgb(0x7dd3fc))
		return
	fire_cooldown = FIRE_COOLDOWN_MAX
	beams.append({"pos": Vector2(dragon_pos.x + 232, dragon_pos.y), "life": 190.0, "age": 0.0})
	shake(90.0, 0.003)
	Audio.play("fire", -4.0)

	var cleared := 0
	var beam_rect := Rect2(dragon_pos.x + 20, dragon_pos.y - 34, 440, 68)
	var live: Array = []
	for pillar in pillars:
		var in_beam := false
		for part in _pillar_rects(pillar):
			if beam_rect.intersects(part):
				in_beam = true
				break
		if in_beam:
			cleared += 1
			spawn_burst(pillar.x, dragon_pos.y, rgb(0xffc968), 14)
		else:
			live.append(pillar)
	pillars = live
	if cleared > 0:
		add_score(cleared * 15.0)
		show_float_text("+%d" % (cleared * 15), dragon_pos.x + 120, dragon_pos.y - 48, rgb(0xffd36b))
	else:
		show_float_text("Fire", dragon_pos.x + 86, dragon_pos.y - 46, rgb(0xffd36b))


# --- Damage / bounds ---------------------------------------------------------

func take_damage(cause: String) -> void:
	if invulnerable_ms > 0.0:
		return
	if shield_ms > 0.0:
		shield_ms = 0.0
		invulnerable_ms = 620.0
		spawn_burst(dragon_pos.x, dragon_pos.y, rgb(0x78f0a4), 16)
		show_float_text("Shielded", dragon_pos.x + 34, dragon_pos.y - 38, rgb(0xa2f7be))
		flash(120.0, Color(120 / 255.0, 240 / 255.0, 164 / 255.0))
		return

	health -= 1
	invulnerable_ms = 980.0
	Audio.play("hit", -3.0)
	shake(130.0, 0.006)
	flash(130.0, Color(255 / 255.0, 127 / 255.0, 127 / 255.0))
	spawn_burst(dragon_pos.x, dragon_pos.y, rgb(0xff7f7f), 12)
	show_float_text("-1 HP", dragon_pos.x + 32, dragon_pos.y - 38, rgb(0xffb3b3))
	if health <= 0:
		end_run(cause)


func _check_world_bounds() -> void:
	if dragon_pos.y < 24.0:
		if mode.key == "zen":
			dragon_pos.y = 24.0
			velocity = abs(velocity) * 0.45
		else:
			take_damage("Flew above the safe current.")
			dragon_pos.y = 26.0
			velocity = 0.08
	elif dragon_pos.y > H - 26.0:
		if mode.key == "zen":
			dragon_pos.y = H - 26.0
			velocity = -abs(velocity) * 0.45
		else:
			take_damage("Hit the lower cloudbreak.")
			dragon_pos.y = H - 28.0
			velocity = -0.08


func add_score(amount: float, use_multiplier := true) -> void:
	score += amount * (mode.score_multiplier if use_multiplier else 1.0)


func dragon_bounds() -> Rect2:
	return Rect2(dragon_pos.x - 31, dragon_pos.y - 23, 58, 43)


# --- Effects -----------------------------------------------------------------

func spawn_burst(x: float, y: float, color: Color, count: int) -> void:
	for i in count:
		var ang := randf_range(0.0, TAU)
		var spd := randf_range(40.0, 150.0)
		particles.append({
			"pos": Vector2(x, y),
			"vel": Vector2(cos(ang), sin(ang)) * spd,
			"color": color,
			"life": randf_range(0.28, 0.52),
			"age": 0.0,
			"scale": randf_range(0.6, 1.3),
		})


func show_float_text(text: String, x: float, y: float, color: Color) -> void:
	floaters.append({"text": text, "pos": Vector2(x, y), "color": color, "life": 0.76, "age": 0.0})


func shake(duration_ms: float, intensity: float) -> void:
	shake_dur = duration_ms
	shake_time = duration_ms
	shake_amp = intensity * W


func flash(duration_ms: float, color: Color) -> void:
	flash_dur = duration_ms
	flash_time = duration_ms
	flash_color = color


func _update_effects(delta: float, delta_ms: float) -> void:
	wing_phase += delta * 12.0
	wing_pulse = max(0.0, wing_pulse - delta * 8.0)

	var live_p: Array = []
	for p in particles:
		p.age += delta
		if p.age < p.life:
			p.pos += p.vel * delta
			p.vel *= 0.96
			live_p.append(p)
	particles = live_p

	var live_f: Array = []
	for f in floaters:
		f.age += delta
		if f.age < f.life:
			f.pos.y -= delta * 45.0
			live_f.append(f)
	floaters = live_f

	var live_b: Array = []
	for b in beams:
		b.age += delta_ms
		if b.age < b.life:
			live_b.append(b)
	beams = live_b

	if shake_time > 0.0:
		shake_time = max(0.0, shake_time - delta_ms)
		var k := shake_time / shake_dur
		shake_offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * shake_amp * k
	else:
		shake_offset = Vector2.ZERO
	position = shake_offset

	if flash_time > 0.0:
		flash_time = max(0.0, flash_time - delta_ms)


# --- Run lifecycle -----------------------------------------------------------

func end_run(cause: String) -> void:
	if game_ended:
		return
	game_ended = true
	Audio.play("gameover", -2.0)
	var final_score := int(floor(score))
	var previous_high := high_score
	high_score = SaveData.set_high_score(mode.key, final_score)
	GameData.last_result = {
		"mode": mode.key,
		"mode_label": mode.label,
		"score": final_score,
		"previous_high_score": previous_high,
		"high_score": high_score,
		"distance": distance,
		"survived_seconds": time_alive,
		"cause": cause,
	}
	emit_hud()
	get_tree().change_scene_to_file("res://scenes/GameOver.tscn")


func emit_hud() -> void:
	if hud and hud.has_method("update_hud"):
		hud.update_hud({
			"score": int(floor(score)),
			"high_score": int(max(high_score, floor(score))),
			"health": health,
			"max_health": max_health,
			"mode": mode.key,
			"mode_label": mode.label,
			"distance": distance,
			"ability_ratio": 1.0 - fire_cooldown / FIRE_COOLDOWN_MAX,
			"paused": paused_run,
		})


# --- Rendering ---------------------------------------------------------------

func _draw() -> void:
	_draw_background()
	_draw_pillars()
	_draw_pickups()
	_draw_dragon()
	_draw_beams()
	_draw_particles()
	_draw_floaters()
	_draw_flash()


func _draw_background() -> void:
	# Vertical gradient quad (0x071428 -> 0x122844).
	var top := rgb(0x071428)
	var bot := rgb(0x122844)
	draw_polygon(
		PackedVector2Array([Vector2(0, 0), Vector2(W, 0), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([top, top, bot, bot])
	)
	draw_circle(Vector2(110, 60), 210, rgb(0xff8b49, 0.08))
	draw_circle(Vector2(860, 120), 280, rgb(0x7dd3fc, 0.08))

	for star in stars:
		draw_circle(star.pos, 1.4, rgb(0xffffff, 0.18))

	for cloud in clouds:
		var c: Vector2 = cloud.pos
		var sc: float = cloud.scale
		draw_circle(c, 26 * sc, rgb(0x1b2f4d, 0.5))
		draw_circle(c + Vector2(28 * sc, 6 * sc), 20 * sc, rgb(0x1b2f4d, 0.5))
		draw_circle(c + Vector2(-26 * sc, 8 * sc), 18 * sc, rgb(0x1b2f4d, 0.5))
		draw_circle(c + Vector2(6 * sc, -10 * sc), 18 * sc, rgb(0x223a5e, 0.5))

	# Scrolling mountain band along the bottom.
	var band_y := H - 108.0
	draw_rect(Rect2(0, H - 32, W, 32), rgb(0x091221, 0.88))
	var span := 320.0
	var off := fmod(horizon_offset, span)
	var start := -off - span
	var x := start
	while x < W + span:
		draw_colored_polygon(PackedVector2Array([
			Vector2(x + 0, band_y + 108), Vector2(x + 70, band_y + 34), Vector2(x + 150, band_y + 108)
		]), rgb(0x0f1f35, 0.94))
		draw_colored_polygon(PackedVector2Array([
			Vector2(x + 92, band_y + 108), Vector2(x + 180, band_y + 24), Vector2(x + 292, band_y + 108)
		]), rgb(0x142a45, 0.95))
		x += span


func _draw_pillars() -> void:
	for pillar in pillars:
		var color := rgb(0x4c1d4f, 0.98) if pillar.danger else rgb(0x173759, 0.98)
		var edge := rgb(0xff8b49, 0.88) if pillar.danger else rgb(0x7dd3fc, 0.88)
		var rects := _pillar_rects(pillar)
		draw_rect(rects[0], color)
		draw_rect(rects[1], color)
		draw_rect(rects[2], edge)
		draw_rect(rects[3], edge)


func _draw_pickups() -> void:
	for pickup in pickups:
		var p: Vector2 = pickup.pos
		match pickup.kind:
			"crystal":
				draw_colored_polygon(PackedVector2Array([
					Vector2(p.x, p.y - 12), Vector2(p.x + 9, p.y), Vector2(p.x, p.y + 12), Vector2(p.x - 9, p.y)
				]), rgb(0x35aee2))
				draw_colored_polygon(PackedVector2Array([
					Vector2(p.x, p.y - 8), Vector2(p.x + 5, p.y), Vector2(p.x, p.y + 8)
				]), rgb(0xe6fbff, 0.8))
			"heart":
				draw_circle(Vector2(p.x - 5, p.y - 3), 6, rgb(0xff6d6d))
				draw_circle(Vector2(p.x + 5, p.y - 3), 6, rgb(0xff6d6d))
				draw_colored_polygon(PackedVector2Array([
					Vector2(p.x - 9, p.y - 1), Vector2(p.x + 9, p.y - 1), Vector2(p.x, p.y + 11)
				]), rgb(0xff6d6d))
			"shield":
				draw_circle(p, 12, rgb(0x78f0a4, 0.9))
				draw_arc(p, 9, 0, TAU, 24, rgb(0xffffff, 0.7), 2.0)


func _draw_dragon() -> void:
	var a := dragon_alpha
	var s := dragon_scale * (1.0 + wing_pulse * 0.10)
	var wing_ang := sin(wing_phase) * 0.22 - wing_pulse * 0.85
	var tail_wag := sin(wing_phase * 0.7) * 5.0
	Gfx.dragon(self, dragon_pos, s, deg_to_rad(dragon_angle), a, wing_ang, tail_wag, now_ms / 1000.0)
	if shield_ms > 0.0:
		draw_set_transform(dragon_pos, deg_to_rad(dragon_angle), Vector2(s, s))
		draw_arc(Vector2.ZERO, 42, 0, TAU, 36, rgb(0x78f0a4, 0.45 * a), 3.0)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _draw_beams() -> void:
	for b in beams:
		var k: float = 1.0 - b.age / b.life
		draw_rect(Rect2(b.pos.x - 220, b.pos.y - 21, 440, 42), rgb(0xff8b49, 0.34 * k))
		draw_rect(Rect2(b.pos.x - 195, b.pos.y - 8, 390, 16), rgb(0xfff2b8, 0.82 * k))


func _draw_particles() -> void:
	for p in particles:
		var k: float = 1.0 - p.age / p.life
		draw_circle(p.pos, 3.0 * p.scale * k, Color(p.color.r, p.color.g, p.color.b, 0.86 * k))


func _draw_floaters() -> void:
	for f in floaters:
		var k: float = 1.0 - f.age / f.life
		var c: Color = f.color
		draw_string(_font, f.pos + Vector2(-16, 0), f.text, HORIZONTAL_ALIGNMENT_CENTER, 80, 15,
			Color(c.r, c.g, c.b, k))


func _draw_flash() -> void:
	if flash_time > 0.0:
		var k := flash_time / flash_dur
		draw_rect(Rect2(0, 0, W, H), Color(flash_color.r, flash_color.g, flash_color.b, 0.55 * k))


# --- Draw helpers ------------------------------------------------------------

func rgb(hex: int, alpha := 1.0) -> Color:
	return Gfx.rgb(hex, alpha)
