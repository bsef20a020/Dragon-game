extends Node
## Procedural sound effects — synthesized at startup, no audio asset files.
## Registered as the "Audio" autoload. Call Audio.play("flap"/"fire"/...).

const RATE := 22050
const VOICES := 8

var _sounds := {}
var _players: Array[AudioStreamPlayer] = []
var _next := 0


func _ready() -> void:
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_players.append(p)
	_sounds["flap"] = _flap()
	_sounds["fire"] = _fire()
	_sounds["hit"] = _hit()
	_sounds["pickup"] = _pickup()
	_sounds["gameover"] = _gameover()
	# Restore the persisted mute preference (autoload order: SaveData before Audio).
	AudioServer.set_bus_mute(0, bool(SaveData.get_setting("muted", false)))


func toggle_mute() -> void:
	set_muted(not is_muted())


func set_muted(m: bool) -> void:
	AudioServer.set_bus_mute(0, m)
	SaveData.set_setting("muted", m)


func is_muted() -> bool:
	return AudioServer.is_bus_mute(0)


func play(name: String, volume_db := -6.0) -> void:
	if not _sounds.has(name):
		return
	var p := _players[_next]
	_next = (_next + 1) % VOICES
	p.stream = _sounds[name]
	p.volume_db = volume_db
	p.play()


# --- Synthesis ---------------------------------------------------------------

func _make(samples: PackedFloat32Array) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for i in samples.size():
		bytes.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 32767.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = RATE
	wav.stereo = false
	wav.data = bytes
	return wav


func _n(seconds: float) -> int:
	return int(seconds * RATE)


func _flap() -> AudioStreamWAV:
	# Quick airy whoosh: noise + soft tone, fast decay.
	var n := _n(0.13)
	var s := PackedFloat32Array()
	s.resize(n)
	for i in n:
		var t := float(i) / RATE
		var env := exp(-t * 20.0)
		s[i] = ((randf() * 2.0 - 1.0) * 0.5 + sin(TAU * 460.0 * t) * 0.25) * env
	return _make(s)


func _fire() -> AudioStreamWAV:
	# Roaring breath: lowpassed noise with a slow swell-and-decay.
	var n := _n(0.42)
	var s := PackedFloat32Array()
	s.resize(n)
	var prev := 0.0
	for i in n:
		var t := float(i) / RATE
		var env: float = min(1.0, t * 12.0) * exp(-t * 5.0)
		var raw := (randf() * 2.0 - 1.0)
		prev = lerp(prev, raw, 0.25)  # crude lowpass -> rumble
		s[i] = prev * env * 0.7
	return _make(s)


func _hit() -> AudioStreamWAV:
	# Low thud with a downward pitch sweep + a touch of noise.
	var n := _n(0.24)
	var s := PackedFloat32Array()
	s.resize(n)
	var phase := 0.0
	for i in n:
		var t := float(i) / RATE
		var env := exp(-t * 13.0)
		var freq: float = 220.0 - (t / 0.24) * 130.0
		phase += TAU * freq / RATE
		s[i] = (sin(phase) * 0.7 + (randf() * 2.0 - 1.0) * 0.2) * env
	return _make(s)


func _pickup() -> AudioStreamWAV:
	# Bright two-note ascending blip.
	var n := _n(0.16)
	var s := PackedFloat32Array()
	s.resize(n)
	var half := n / 2
	for i in n:
		var t := float(i) / RATE
		var freq := 880.0 if i < half else 1320.0
		var local := t if i < half else t - float(half) / RATE
		var env := exp(-local * 16.0)
		s[i] = sin(TAU * freq * t) * env * 0.45
	return _make(s)


func _gameover() -> AudioStreamWAV:
	# Descending tone that fades out.
	var n := _n(0.6)
	var s := PackedFloat32Array()
	s.resize(n)
	var phase := 0.0
	for i in n:
		var t := float(i) / RATE
		var env := exp(-t * 3.2)
		var freq: float = 440.0 - (t / 0.6) * 300.0
		phase += TAU * freq / RATE
		s[i] = (sin(phase) * 0.5 + sin(phase * 0.5) * 0.25) * env
	return _make(s)
