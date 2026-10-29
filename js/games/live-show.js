/* GDU Underground City – Live-Party im Bunker 99
   Zeigt die Party-Nacht als animierte Szene: DJ am Pult, tanzende Crowd,
   Laser (Lichtshow), Nebel (Nebelmaschine), neue Bar (Bar-Upgrade), Musik im Genre des DJs.
   Anzahl der Tänzer = Gäste, Energie = Stimmung. Das Ergebnis steht vorher schon fest,
   die Szene ist reine Show und kann übersprungen werden.
   Regeln: höchstens 3 Lichtblitze pro Sekunde; bei „Bewegung reduzieren“ keine Blitze, ruhige Szene. */
'use strict';

window.GDU = window.GDU || {};

GDU.liveShow = (() => {
  const W = 640, H = 360, DURATION = 11;
  const SHIRTS = ['#ff2d95', '#00e5c3', '#7b5cff', '#f7d77b', '#3fa9f5', '#ff8a4c', '#e8e8f0', '#c94cff', '#5be37d', '#2a2f45'];
  let run = null;

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /**
   * @param {object} o  { nightNo, r (Ergebnis), dj, gear, lines (Texte), onDone }
   */
  function play(o) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    GDU.modal('Nacht ' + o.nightNo + ' · Live ' + (o.venue === 'pier' ? 'vom Pier 7' : 'aus dem Bunker 99'),
      '<div class="show-stage"><canvas id="showCanvas" width="' + W + '" height="' + H + '" role="img" aria-label="Animierte Party ' + (o.venue === 'pier' ? 'am Pier 7' : 'im Bunker 99') + ' mit ' + o.r.guests + ' Gästen"></canvas>' +
      '<div class="show-ticker" id="showTicker"></div></div>' +
      '<div class="meter"><i id="liveBar"></i></div><ul id="liveLog" class="show-log" aria-live="polite"></ul>',
      [['Zur Abrechnung', () => { stop(); o.onDone(); }]], true);

    const rnd = seeded(o.r.guests * 31 + o.nightNo);
    const count = Math.max(6, Math.min(85, Math.round(o.r.guests / (o.venue === 'pier' ? 4.5 : 2.3))));
    const dancers = [];
    for (let i = 0; i < count; i++) {
      const depth = rnd();                                   // 0 = hinten, 1 = vorne
      dancers.push({ x: 30 + rnd() * (W - 60), y: 205 + depth * 120, s: 0.7 + depth * 0.6, c: SHIRTS[Math.floor(rnd() * SHIRTS.length)], off: rnd(), arms: rnd() < 0.5, enter: rnd() * 3 });
    }
    dancers.sort((a, b) => a.y - b.y);
    const bpm = GDU.audio.TEMPO[o.dj.genre] || 128;
    GDU.audio.startShow(o.dj.genre);

    run = { o, dancers, bpm, reduced, t0: performance.now(), ctx: document.getElementById('showCanvas').getContext('2d'), shown: 0, lastFlash: 0, fogSeed: rnd() * 100 };
    requestAnimationFrame(frame);
  }

  function stop() {
    if (!run) return;
    GDU.audio.stopShow();
    run = null;
  }

  function frame() {
    if (!run) return;
    if (!GDU.dialogOpen() || !document.getElementById('showCanvas')) return stop();
    const t = (performance.now() - run.t0) / 1000;
    const { o } = run;

    // Texte nacheinander einblenden (auch als Liste für Screenreader)
    const step = Math.min(o.lines.length, Math.floor(t / (DURATION / (o.lines.length + 1))) + 1);
    while (run.shown < step) {
      const text = o.lines[run.shown++];
      const li = document.createElement('li'); li.textContent = text;
      document.getElementById('liveLog').append(li);
      const tk = document.getElementById('showTicker');
      tk.textContent = text; tk.classList.remove('pop'); void tk.offsetWidth; tk.classList.add('pop');
    }
    document.getElementById('liveBar').style.width = Math.min(100, t / DURATION * 100) + '%';

    draw(t);
    if (t >= DURATION) {
      GDU.audio.stopShow();
      const btn = document.querySelector('#dialogActions button');
      if (btn && !btn.classList.contains('ready')) { btn.classList.add('ready'); btn.textContent = 'Zur Abrechnung →'; btn.focus(); }
      if (t >= DURATION + 4) return;   // Szene ausklingen lassen, dann Animation anhalten
    }
    requestAnimationFrame(frame);
  }

  function draw(t) {
    const c = run.ctx, { o, dancers, reduced } = run;
    const energy = o.r.happy / 100;                         // 0..1
    const ph = GDU.audio.phase(run.bpm);                     // Beat-Phase 0..1
    const pulse = reduced ? 0 : Math.pow(1 - ph, 3);         // kurzer Impuls auf jedem Schlag
    const build = Math.min(1, t / 2.5);                      // Club füllt sich am Anfang

    if (o.venue === 'pier') {
      // Open Air: Nachthimmel mit Sternen, Kransilhouetten, Wasser hinter der Bühne
      const sky = c.createLinearGradient(0, 0, 0, 180);
      sky.addColorStop(0, '#050a18'); sky.addColorStop(1, '#14203a');
      c.fillStyle = sky; c.fillRect(0, 0, W, 180);
      for (let i = 0; i < 60; i++) { const sx = (i * 97) % W, sy = (i * 53) % 150, tw = reduced ? 0.6 : 0.4 + 0.4 * Math.sin(t * 2 + i); c.fillStyle = 'rgba(255,255,255,' + tw + ')'; c.fillRect(sx, sy, 2, 2); }
      c.strokeStyle = '#1d2c44'; c.lineWidth = 6;
      for (const kx of [70, 520]) { c.beginPath(); c.moveTo(kx, 175); c.lineTo(kx, 40); c.lineTo(kx + 110, 30); c.moveTo(kx - 30, 44); c.lineTo(kx, 40); c.stroke(); }
      c.fillStyle = '#0b1c2c'; c.fillRect(0, 150, W, 30);
      for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? 'rgba(255,45,149,0.25)' : 'rgba(0,229,195,0.25)'; c.fillRect((i * 61 + t * 20) % W, 158 + (i % 3) * 6, 26, 2); }
    } else {
      // Club: Backsteinwand
      c.fillStyle = '#0a0f1a'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#120f18';
      for (let y = 0; y < 170; y += 14) for (let x = (y / 14) % 2 ? -20 : 0; x < W; x += 40) c.fillRect(x + 1, y + 1, 38, 12);
    }
    const floor = c.createLinearGradient(0, 180, 0, H);
    floor.addColorStop(0, '#120f1c'); floor.addColorStop(1, '#05060b');
    c.fillStyle = floor; c.fillRect(0, 175, W, H - 175);

    // Lautsprecher
    for (const x of [40, W - 100]) {
      c.fillStyle = '#0d0d12'; c.fillRect(x, 70, 60, 110);
      c.fillStyle = '#1f1f28';
      const k = 1 + pulse * 0.08;
      for (const [yy, r] of [[100, 16], [150, 22]]) { c.beginPath(); c.arc(x + 30, yy, r * k, 0, 7); c.fill(); }
    }

    // Lichtshow: Laserfächer vom Pult aus
    if (o.gear.light) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const n = 7;
      for (let i = 0; i < n; i++) {
        // Fächer nach unten über die Crowd, langsam schwenkend
        const a = Math.PI * (0.12 + 0.76 * i / (n - 1)) + (reduced ? 0 : Math.sin(t * 0.9 + i) * 0.18);
        c.strokeStyle = i % 2 ? 'rgba(0,229,195,0.38)' : 'rgba(255,45,149,0.38)';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(W / 2, 128); c.lineTo(W / 2 + Math.cos(a) * 700, 128 + Math.sin(a) * 700); c.stroke();
      }
      c.restore();
    }

    // DJ-Pult mit DJ
    const dx = W / 2, bob = pulse * 4;
    c.fillStyle = '#e6b292'; c.beginPath(); c.arc(dx, 98 - bob, 11, 0, 7); c.fill();
    c.fillStyle = '#1a1a22'; c.fillRect(dx - 14, 108 - bob, 28, 30);
    c.strokeStyle = '#64e8db'; c.lineWidth = 3; c.beginPath(); c.arc(dx, 96 - bob, 13, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.strokeStyle = '#e6b292'; c.lineWidth = 4; c.beginPath(); c.moveTo(dx - 12, 115 - bob); c.lineTo(dx - 26, 100 - bob * 3); c.stroke();
    c.fillStyle = '#20202b'; c.fillRect(dx - 90, 130, 180, 46);
    c.fillStyle = '#2f2f3d'; c.fillRect(dx - 90, 126, 180, 8);
    for (const ox of [-55, 55]) { c.fillStyle = '#0b0b10'; c.beginPath(); c.ellipse(dx + ox, 130, 22, 6, 0, 0, 7); c.fill(); }
    c.save(); c.shadowColor = '#ff2d95'; c.shadowBlur = 14; c.fillStyle = '#ff2d95'; c.fillRect(dx - 90, 172, 180, 3); c.restore();
    c.fillStyle = '#ffffff'; c.font = '700 12px system-ui'; c.textAlign = 'center';
    c.fillText(o.dj.name.toUpperCase(), dx, 160);

    // Bar (mit Bar-Upgrade beleuchtet)
    if (o.venue !== 'pier') {
    c.fillStyle = o.gear.bar ? '#2b2140' : '#1a1622'; c.fillRect(W - 130, 185, 130, 40);
    if (o.gear.bar) { c.save(); c.shadowColor = '#00e5c3'; c.shadowBlur = 12; c.fillStyle = '#00e5c3'; c.fillRect(W - 130, 185, 130, 3); c.restore(); }
    c.fillStyle = '#c1d2df'; c.font = '700 10px system-ui'; c.fillText('BAR', W - 65, 210);
    }

    // Crowd: tanzt im Takt, mehr Stimmung = höhere Sprünge und mehr Arme oben
    for (const d of dancers) {
      if (t < d.enter * (1 - build * 0.6)) continue;
      const local = (ph + d.off * 0.25) % 1;
      const jump = reduced ? 0 : Math.pow(Math.sin(local * Math.PI), 2) * (2 + energy * 9) * d.s;
      const sway = reduced ? 0 : Math.sin((t * run.bpm / 60 + d.off) * Math.PI) * 2 * d.s;
      const x = d.x + sway, y = d.y - jump, s = d.s;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(d.x, d.y + 2, 9 * s, 3 * s, 0, 0, 7); c.fill();
      c.fillStyle = '#121620'; c.fillRect(x - 5 * s, y - 14 * s, 4 * s, 14 * s); c.fillRect(x + 1 * s, y - 14 * s, 4 * s, 14 * s);
      c.fillStyle = d.c; c.fillRect(x - 7 * s, y - 32 * s, 14 * s, 19 * s);
      c.strokeStyle = d.c; c.lineWidth = 3 * s;
      const up = d.arms && energy > 0.55;
      c.beginPath();
      if (up) { c.moveTo(x - 6 * s, y - 30 * s); c.lineTo(x - 11 * s, y - (44 + jump * 0.2) * s); c.moveTo(x + 6 * s, y - 30 * s); c.lineTo(x + 11 * s, y - (44 + jump * 0.2) * s); }
      else { c.moveTo(x - 7 * s, y - 29 * s); c.lineTo(x - 10 * s, y - 18 * s); c.moveTo(x + 7 * s, y - 29 * s); c.lineTo(x + 10 * s, y - 18 * s); }
      c.stroke();
      c.fillStyle = '#d9a985'; c.beginPath(); c.arc(x, y - 38 * s, 6 * s, 0, 7); c.fill();
    }

    // Nebel (Nebelmaschine)
    if (o.gear.fog) {
      c.save();
      // Bodennebel: flache, dezente Schwaden, die langsam durchziehen
      for (let i = 0; i < 5; i++) {
        const fx = ((i * 163 + (reduced ? 0 : t * 14) + run.fogSeed) % (W + 240)) - 120, fy = 300 + (i % 2) * 30;
        c.save(); c.translate(fx, fy); c.scale(2.2, 0.55);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 80);
        g.addColorStop(0, 'rgba(170,160,220,0.10)'); g.addColorStop(1, 'rgba(170,160,220,0)');
        c.fillStyle = g; c.fillRect(-80, -80, 160, 160);
        c.restore();
      }
      c.restore();
    }

    // Zwei farbige Lichtkegel von der Decke, wechseln alle 4 Takte die Farbe
    c.save(); c.globalCompositeOperation = 'lighter';
    const swap = Math.floor(t * run.bpm / 60 / 4) % 2;
    [[150, swap ? '255,45,149' : '0,229,195', -1], [W - 150, swap ? '0,229,195' : '255,45,149', 1]].forEach(([sx, rgb, dir]) => {
      const sw = reduced ? 0 : Math.sin(t * 0.7) * 60 * dir;
      const a = 0.10 + pulse * 0.10 * energy;
      const g = c.createLinearGradient(sx, 0, sx + sw, H);
      g.addColorStop(0, 'rgba(' + rgb + ',' + (a + 0.08) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(sx - 8, 0); c.lineTo(sx + 8, 0); c.lineTo(sx + sw + 120, H); c.lineTo(sx + sw - 120, H); c.closePath(); c.fill();
    });
    c.restore();
    // Dunkle Ränder (Vignette), damit es nach Club aussieht
    const vg = c.createRadialGradient(W / 2, H * 0.55, 120, W / 2, H * 0.55, 420);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);

    // Strobe nur bei guter Stimmung, nur alle 2 Takte, nie mehr als 3 Blitze pro Sekunde
    if (!reduced && energy > 0.7 && o.gear.light) {
      const beatNo = Math.floor(t * run.bpm / 60);
      if (beatNo % 8 === 0 && ph < 0.08 && performance.now() - run.lastFlash > 400) run.lastFlash = performance.now();
      if (performance.now() - run.lastFlash < 70) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, 0, W, H); }
    }

    // Anzeige: Gäste zählen hoch, Stimmung füllt sich
    const k = Math.min(1, t / (DURATION * 0.8));
    c.fillStyle = 'rgba(5,10,18,0.78)'; c.fillRect(10, 10, 168, 52);
    c.fillStyle = '#c1d2df'; c.font = '11px system-ui'; c.textAlign = 'left';
    c.fillText('GÄSTE', 20, 27); c.fillText('STIMMUNG', 96, 27);
    c.fillStyle = '#ffffff'; c.font = '900 20px system-ui';
    c.fillText(String(Math.round(o.r.guests * k)), 20, 50); c.fillText(Math.round(o.r.happy * k) + ' %', 96, 50);
  }

  return { play, stop, debug: () => run };
})();
