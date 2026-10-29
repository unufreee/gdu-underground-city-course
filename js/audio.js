/* GDU Underground City – Sound
   Club-Musik wird live im Browser erzeugt (Web Audio), ohne Musikdateien.
   - GDU.audio.wall: gedämpfter Bass „durch die Wand“, lauter je näher Maria am Bunker 99 ist
   - GDU.audio.show(genre): volle Club-Musik für die Live-Party
   Browser erlauben Ton erst nach einer Nutzeraktion, deshalb startet alles mit unlock().
   Der Schalter „Ton an/aus“ gilt für alle Klänge im Spiel (GDU.state.mute). */
'use strict';

window.GDU = window.GDU || {};

GDU.audio = (() => {
  const TEMPO = { 'House': 122, 'Techno': 128, 'Drum & Bass': 140 };
  const BASS = [55, 55, 65.4, 49];   // Basslinie A–A–C–G
  let ctx = null, master = null, noise = null;
  let wall = null, show = null, timer = null;

  function unlock() {
    if (GDU.state.mute) return false;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
        noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      if (!timer) timer = setInterval(tick, 90);
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Klangbausteine ---------- */

  function kick(out, at, vol = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.12);
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
    o.connect(g).connect(out); o.start(at); o.stop(at + 0.32);
  }
  function hit(out, at, freq, len, vol, type = 'highpass') {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    s.connect(f).connect(g).connect(out); s.start(at); s.stop(at + len + 0.02);
  }
  function bass(out, at, freq, len, vol = 0.32) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = 380;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.01); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.connect(f).connect(g).connect(out); o.start(at); o.stop(at + len + 0.02);
  }
  function stab(out, at, vol) {   // kurzer Akkord für die Live-Party
    [220, 277.2, 329.6].forEach(fq => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = fq;
      g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
      o.connect(g).connect(out); o.start(at); o.stop(at + 0.2);
    });
  }

  // Ein Schlag (Viertel) im passenden Genre
  function beat(out, at, n, genre, spb, full) {
    if (genre === 'Drum & Bass') {
      if (n % 4 === 0) { kick(out, at); kick(out, at + spb * 2.5, 0.8); }
      if (n % 2 === 1) hit(out, at, 1800, 0.18, 0.55, 'bandpass');
      hit(out, at + spb / 2, 7000, 0.04, 0.22);
    } else {
      kick(out, at);
      hit(out, at + spb / 2, 7000, genre === 'House' ? 0.09 : 0.05, 0.28);
      if (genre === 'House' && n % 2 === 1) hit(out, at, 1500, 0.15, 0.32, 'bandpass');
    }
    bass(out, at + spb / 2, BASS.at(Math.floor(n / 4) % 4), spb * 0.45);
    if (full && n % 8 === 6) stab(out, at + spb / 2, 0.05);
  }

  // Taktgeber: plant immer die nächsten ~0,3 Sekunden voraus
  function tick() {
    if (!ctx) return;
    const until = ctx.currentTime + 0.3;
    for (const loop of [wall, show]) {
      if (!loop) continue;
      while (loop.next < until) {
        beat(loop.out, loop.next, loop.n, loop.genre, loop.spb, loop === show);
        loop.n++; loop.next += loop.spb;
      }
    }
  }

  function makeLoop(genre, out) {
    const spb = 60 / (TEMPO[genre] || 128);
    return { genre, spb, out, n: 0, next: ctx.currentTime + 0.1 };
  }

  /* ---------- Bass durch die Wand ---------- */

  // level 0..1 = Nähe zum Bunker 99. 0 = still.
  function setWall(level) {
    if (!ctx || GDU.state.mute) return;
    if (!wall) {
      const f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = 160; g.gain.value = 0;
      f.connect(g).connect(master);
      wall = makeLoop('Techno', f); wall.filter = f; wall.gain = g;
    }
    const t = ctx.currentTime;
    wall.gain.gain.setTargetAtTime(0.55 * level * level, t, 0.25);
    wall.filter.frequency.setTargetAtTime(140 + 520 * level * level, t, 0.25);
  }

  /* ---------- Live-Party ---------- */

  function startShow(genre) {
    if (!unlock()) return;
    stopShow();
    const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
    g.gain.exponentialRampToValueAtTime(0.75, ctx.currentTime + 0.6);
    show = makeLoop(genre, g); show.gain = g;
    if (wall) wall.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);   // Wand-Bass aus, solange die Party läuft
  }
  function stopShow() {
    if (!show || !ctx) { show = null; return; }
    const g = show.gain, t = ctx.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    show = null;
    setTimeout(() => { try { g.disconnect(); } catch (e) { /* schon getrennt */ } }, 1200);
  }

  function mute(on) {
    GDU.state.mute = on;
    GDU.save();
    if (on) {
      stopShow();
      if (wall && ctx) wall.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    } else unlock();
  }

  // Beat-Phase 0..1 der Live-Party für die Animation (tanzt im Takt)
  function phase(bpm) {
    if (ctx && show) return ((ctx.currentTime - (show.next - show.n * show.spb)) / show.spb) % 1;
    return (performance.now() / 1000 * bpm / 60) % 1;
  }

  return { unlock, setWall, startShow, stopShow, mute, phase, TEMPO };
})();
