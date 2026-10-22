/* GDU Underground City – Minispiel „Beat-Battle“ am DJ-Pult im Bunker 99
   Maria spielt vor der Party das Warm-up: Noten fallen in vier Spuren,
   im richtigen Moment drücken (D F J K, Pfeiltasten oder antippen).
   Die Trefferquote bringt einen Stimmungsbonus für die Party-Nacht.
   Musik und Sounds werden live im Browser erzeugt (Web Audio), ohne externe Dateien. */
'use strict';

window.GDU = window.GDU || {};

GDU.beat = (() => {
  // Spieleinstellungen
  const LANES = 4;
  const BEATS = 32;                         // Länge des Warm-ups in Schlägen (8 Takte)
  const LEAD_IN = 2.2;                      // Sekunden bis zur ersten Note
  const WINDOW_PERFECT = 0.055, WINDOW_GOOD = 0.115;   // Trefferfenster in Sekunden
  const TRAVEL = 1.5;                       // Sekunden, die eine Note bis zur Trefferlinie fällt
  const KEYS = { d: 0, f: 1, j: 2, k: 3, arrowleft: 0, arrowdown: 1, arrowup: 2, arrowright: 3 };
  const KEY_LABELS = ['D', 'F', 'J', 'K'];
  const LANE_COLORS = ['#00e5c3', '#ff2d95', '#ff2d95', '#00e5c3'];
  const TEMPO = { 'House': 122, 'Techno': 128, 'Drum & Bass': 140 };

  // Bonus für die Party-Nacht nach Trefferquote
  GDU.warmupRating = acc =>
    acc >= 0.9 ? { bonus: 10, title: 'Legendäres Warm-up!' } :
    acc >= 0.75 ? { bonus: 7, title: 'Starkes Warm-up' } :
    acc >= 0.55 ? { bonus: 4, title: 'Solides Warm-up' } :
    acc >= 0.35 ? { bonus: 0, title: 'Na ja, durchwachsen' } :
                  { bonus: -4, title: 'Holpriger Start' };

  // Reproduzierbarer Zufall: gleiche Nacht = gleiches Notenmuster
  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  function makeChart(bpm, seed) {
    const rnd = seeded(seed), spb = 60 / bpm, notes = [];
    let last = 0;
    for (let b = 0; b < BEATS; b++) {
      let lane = Math.floor(rnd() * LANES);
      if (lane === last && rnd() < 0.5) lane = (lane + 1 + Math.floor(rnd() * 3)) % LANES;   // weniger Wiederholungen
      notes.push({ t: LEAD_IN + b * spb, lane });
      last = lane;
      if (b >= 8 && b % 4 !== 3 && rnd() < 0.35) notes.push({ t: LEAD_IN + (b + 0.5) * spb, lane: (lane + 2) % LANES });   // Achtel ab Takt 3
      if (b >= 16 && b % 8 === 0) notes.push({ t: LEAD_IN + b * spb, lane: (lane + 1) % LANES });   // Doppelnote ab der Hälfte
    }
    return notes.sort((a, b) => a.t - b.t).map(n => ({ ...n, judged: null }));
  }

  /* ---------- Sound (Web Audio) ---------- */

  function createAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || GDU.state.mute) return null;
    try {
      const ctx = new AC(), master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
      const noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      return { ctx, master, noise };
    } catch (e) { return null; }
  }

  function kick(a, at) {
    const o = a.ctx.createOscillator(), g = a.ctx.createGain();
    o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.12);
    g.gain.setValueAtTime(1, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
    o.connect(g).connect(a.master); o.start(at); o.stop(at + 0.3);
  }
  function noiseHit(a, at, freq, len, vol, type = 'highpass') {
    const s = a.ctx.createBufferSource(), f = a.ctx.createBiquadFilter(), g = a.ctx.createGain();
    s.buffer = a.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    s.connect(f).connect(g).connect(a.master); s.start(at); s.stop(at + len + 0.02);
  }
  function bass(a, at, freq, len) {
    const o = a.ctx.createOscillator(), g = a.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq;
    const f = a.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.01); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.connect(f).connect(g).connect(a.master); o.start(at); o.stop(at + len + 0.02);
  }
  function blip(a, lane, good) {
    const at = a.ctx.currentTime, o = a.ctx.createOscillator(), g = a.ctx.createGain();
    o.type = 'triangle'; o.frequency.value = [523, 659, 784, 1047][lane] * (good ? 1 : 0.5);
    g.gain.setValueAtTime(0.18, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
    o.connect(g).connect(a.master); o.start(at); o.stop(at + 0.14);
  }

  // Den ganzen Beat im Voraus planen: genau im Takt, unabhängig von der Bildrate
  function scheduleMusic(a, startAt, bpm, genre) {
    const spb = 60 / bpm, total = BEATS + 4;
    const notesHz = [55, 55, 65.4, 49];   // Basslinie A–A–C–G
    for (let b = -4; b < total - 4; b++) {
      const t = startAt + LEAD_IN + b * spb;
      if (t < a.ctx.currentTime) continue;
      const bar = Math.floor((b + 4) / 4) % 4;
      if (genre === 'Drum & Bass') {
        if (b % 4 === 0) { kick(a, t); kick(a, t + spb * 2.5); }   // Kick auf 1 und 3+
        if (b % 2 !== 0) noiseHit(a, t, 1800, 0.18, 0.5, 'bandpass');   // Snare auf 2 und 4
        noiseHit(a, t + spb / 2, 7000, 0.04, 0.25);
      } else {
        kick(a, t);
        noiseHit(a, t + spb / 2, 7000, genre === 'House' ? 0.09 : 0.05, 0.3);
        if (genre === 'House' && b % 2 === 1) noiseHit(a, t, 1500, 0.15, 0.35, 'bandpass');
      }
      if (b >= 0) bass(a, t + spb / 2, notesHz.at(bar), spb * 0.45);
    }
  }

  /* ---------- Spiel ---------- */

  let run = null;   // laufende Runde

  function open() {
    const s = GDU.state, dj = s.booked ? GDU.dj(s.booked) : null;
    const genre = dj ? dj.genre : 'Techno', bpm = TEMPO[genre] || 128;
    GDU.modal('DJ-PULT · Beat-Battle',
      '<p>Vor <b>' + (dj ? dj.name : 'dem DJ') + '</b> spielt Maria das Warm-up. Triff die Noten, wenn sie die Linie erreichen. Je besser du triffst, desto heißer ist die Crowd in Nacht ' + s.night + '.</p>' +
      '<ul class="howto"><li><b>Tastatur:</b> D F J K oder die Pfeiltasten</li><li><b>Handy:</b> die vier Spur-Buttons antippen</li><li><b>Tempo:</b> ' + bpm + ' BPM (' + genre + '), etwa 15 Sekunden</li><li>Du hast <b>einen Versuch</b> pro Nacht.</li></ul>',
      [['Los geht\'s', () => start(genre, bpm)],
       [s.mute ? '🔇 Ton aus' : '🔊 Ton an', () => { s.mute = !s.mute; GDU.save(); open(); }, false, 'secondary'],
       ['Zurück', () => GDU.places.club(), false, 'secondary']], true);
  }

  function start(genre, bpm) {
    const s = GDU.state;
    GDU.modal('DJ-PULT · Beat-Battle',
      '<div class="beat-stage"><canvas id="beatCanvas" width="640" height="380" aria-label="Rhythmusspiel mit vier Spuren"></canvas></div>' +
      '<div class="lanes" role="group" aria-label="Spur-Buttons">' + KEY_LABELS.map((k, i) => '<button class="lane-btn" data-lane="' + i + '" aria-label="Spur ' + (i + 1) + '">' + k + '</button>').join('') + '</div>' +
      '<p class="small muted" id="beatHint">Abbrechen mit Esc oder dem Button. Der Versuch zählt dann ohne Bonus.</p>',
      [['Abbrechen', GDU.close, false, 'secondary']], true);

    // Spieluhr = Browser-Uhr. Die Musik wird parallel im Audio-Takt geplant;
    // ist Ton aus oder blockiert, läuft das Spiel trotzdem exakt weiter.
    const audio = createAudio();
    const now = () => performance.now() / 1000;
    const t0 = now() + 0.15;
    const notes = makeChart(bpm, s.season * 97 + s.night * 13);
    // Versuch sofort verbuchen: Abbrechen und neu starten bringt keinen Vorteil
    s.warmup = { night: s.night, season: s.season, bonus: 0, acc: 0, aborted: true };
    GDU.save();
    GDU.beatRunning = true;
    run = { notes, t0, audio, genre, bpm, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, energy: 50, flash: [], pressed: [0, 0, 0, 0], done: false };
    if (audio) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      scheduleMusic(audio, audio.ctx.currentTime + 0.15, bpm, genre);
    }

    const canvas = document.getElementById('beatCanvas');
    run.ctx = canvas.getContext('2d');
    run.now = () => now() - run.t0;
    run.end = notes.at(-1).t + 1.2;

    document.addEventListener('keydown', onKey, true);
    document.querySelectorAll('.lane-btn').forEach(btn => btn.addEventListener('pointerdown', e => { e.preventDefault(); hit(Number(btn.dataset.lane)); }));
    document.getElementById('beatCanvas').focus?.();
    requestAnimationFrame(frame);
  }

  function onKey(e) {
    if (!run || run.done) return;
    const lane = KEYS[e.key.toLowerCase()];
    if (lane === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) hit(lane);
  }

  function hit(lane) {
    if (!run || run.done) return;
    const t = run.now();
    run.pressed[lane] = t;
    const note = run.notes.find(n => !n.judged && n.lane === lane && Math.abs(n.t - t) <= WINDOW_GOOD);
    if (!note) return;   // daneben drücken kostet nichts
    const d = Math.abs(note.t - t);
    note.judged = d <= WINDOW_PERFECT ? 'perfect' : 'good';
    run[note.judged]++;
    run.combo++;
    run.maxCombo = Math.max(run.maxCombo, run.combo);
    run.energy = GDU.clamp(run.energy + (note.judged === 'perfect' ? 3 : 1.5), 0, 100);
    run.flash.push({ lane, text: note.judged === 'perfect' ? 'PERFECT' : 'GOOD', t });
    if (run.audio) blip(run.audio, lane, true);
  }

  function frame() {
    if (!run) return;
    // Fenster geschlossen (Esc oder Klick daneben) → Runde abbrechen, kein Bonus
    if (!GDU.dialogOpen() || !document.getElementById('beatCanvas')) return stop();
    const t = run.now();
    for (const n of run.notes) if (!n.judged && t - n.t > WINDOW_GOOD) {
      n.judged = 'miss'; run.miss++; run.combo = 0;
      run.energy = GDU.clamp(run.energy - 5, 0, 100);
      run.flash.push({ lane: n.lane, text: 'MISS', t });
    }
    draw(t);
    if (t >= run.end) return finish();
    requestAnimationFrame(frame);
  }

  function draw(t) {
    const c = run.ctx, W = 640, H = 380, laneW = 140, left = (W - laneW * LANES) / 2, hitY = 320;
    const speed = (hitY - 40) / TRAVEL;
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#0b1420'; c.fillRect(0, 0, W, H);

    // Spuren
    for (let i = 0; i < LANES; i++) {
      const x = left + i * laneW;
      const lit = t - run.pressed[i] < 0.12;
      c.fillStyle = lit ? 'rgba(255,255,255,0.08)' : (i % 2 ? '#101c2a' : '#0e1925');
      c.fillRect(x, 0, laneW, H);
      c.strokeStyle = '#1f3446'; c.strokeRect(x + 0.5, 0, laneW, H);
      c.fillStyle = '#5f7d90'; c.font = 'bold 16px system-ui'; c.textAlign = 'center';
      c.fillText(KEY_LABELS[i], x + laneW / 2, H - 18);
    }

    // Trefferlinie
    c.save(); c.shadowColor = '#00e5c3'; c.shadowBlur = 14; c.fillStyle = '#00e5c3';
    c.fillRect(left, hitY - 2, laneW * LANES, 4); c.restore();

    // Noten
    for (const n of run.notes) {
      if (n.judged === 'perfect' || n.judged === 'good') continue;
      const y = hitY - (n.t - t) * speed;
      if (y < -20 || y > H + 20) continue;
      const x = left + n.lane * laneW + 12;
      c.save();
      c.globalAlpha = n.judged === 'miss' ? 0.3 : 1;
      c.shadowColor = LANE_COLORS[n.lane]; c.shadowBlur = n.judged ? 0 : 12;
      c.fillStyle = LANE_COLORS[n.lane];
      if (c.roundRect) { c.beginPath(); c.roundRect(x, y - 9, laneW - 24, 18, 9); c.fill(); }
      else c.fillRect(x, y - 9, laneW - 24, 18);
      c.restore();
    }

    // Bewertungen über der Linie
    run.flash = run.flash.filter(f => t - f.t < 0.5);
    for (const f of run.flash) {
      const x = left + f.lane * laneW + laneW / 2, a = 1 - (t - f.t) / 0.5;
      c.globalAlpha = a; c.font = '900 15px system-ui'; c.textAlign = 'center';
      c.fillStyle = f.text === 'MISS' ? '#ff8fb6' : f.text === 'PERFECT' ? '#00e5c3' : '#f7d77b';
      c.fillText(f.text, x, hitY - 22 - (1 - a) * 18);
      c.globalAlpha = 1;
    }

    // Crowd-Energie, Combo, Fortschritt
    c.fillStyle = 'rgba(11,20,32,0.85)'; c.fillRect(6, 8, 136, 38);
    c.fillStyle = '#c1d2df'; c.font = '12px system-ui'; c.textAlign = 'left';
    c.fillText('CROWD-ENERGIE', 14, 22);
    c.fillStyle = '#223546'; c.fillRect(14, 30, 120, 8);
    c.fillStyle = run.energy > 60 ? '#00e5c3' : run.energy > 30 ? '#f7d77b' : '#ff2d95'; c.fillRect(14, 30, 120 * run.energy / 100, 8);
    c.textAlign = 'right'; c.fillStyle = '#ffffff'; c.font = '900 22px system-ui';
    c.fillText(run.combo > 1 ? run.combo + 'x' : '', W - 14, 34);
    c.fillStyle = '#223546'; c.fillRect(0, H - 4, W, 4);
    c.fillStyle = '#ff2d95'; c.fillRect(0, H - 4, W * GDU.clamp(t / run.end, 0, 1), 4);
    if (t < LEAD_IN - 0.3) {
      c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.font = '900 34px system-ui';
      c.fillText(String(Math.max(1, Math.ceil(LEAD_IN - 0.3 - t))), W / 2, 170);
    }
  }

  function stop() {
    GDU.beatRunning = false;
    document.removeEventListener('keydown', onKey, true);
    if (run && run.audio) { try { run.audio.ctx.close(); } catch (e) { /* bereits geschlossen */ } }
    run = null;
  }

  function finish() {
    const r = run, total = r.notes.length;
    r.done = true;
    GDU.beatRunning = false;
    const acc = (r.perfect + r.good * 0.6) / total;
    const rating = GDU.warmupRating(acc);
    const s = GDU.state;
    s.warmup = { night: s.night, season: s.season, bonus: rating.bonus, acc: Math.round(acc * 100) };
    GDU.save();
    setTimeout(stop, 600);   // Musik kurz ausklingen lassen

    GDU.modal('BEAT-BATTLE · ' + rating.title,
      '<div class="result-top"><div><small>Trefferquote</small><b>' + Math.round(acc * 100) + ' %</b></div><div><small>Beste Combo</small><b>' + r.maxCombo + '</b></div><div><small>Stimmung heute</small><b>' + (rating.bonus > 0 ? '+' : '') + rating.bonus + '</b></div></div>' +
      '<table class="bill"><tr><td>Perfect</td><td>' + r.perfect + '</td></tr><tr><td>Good</td><td>' + r.good + '</td></tr><tr><td>Miss</td><td>' + r.miss + '</td></tr></table>' +
      '<p>' + (rating.bonus > 0 ? 'Die Crowd ist aufgewärmt. Der Bonus gilt für die Party in Nacht ' + s.night + '.' : rating.bonus < 0 ? 'Das Warm-up hat gewackelt. Die Party startet mit etwas schlechterer Stimmung.' : 'Kein Bonus, aber auch kein Schaden.') + '</p>',
      [['Zur Party-Planung', () => GDU.places.club()]], true);
  }

  // debug: nur für automatische Tests (liefert die laufende Runde)
  return { open, debug: () => run };
})();
