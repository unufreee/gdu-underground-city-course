/* GDU Underground City – Minispiel „Crate Digging“ bei Vinyl Junky
   Maria wühlt in der Plattenkiste: In 25 Sekunden passende Platten für das Set
   des gebuchten DJs finden (richtiges Genre UND passendes Tempo).
   Jede richtige Platte bringt Gäste, jede falsche kostet welche. Ein Versuch pro Nacht. */
'use strict';

window.GDU = window.GDU || {};

GDU.crate = (() => {
  const RECORDS = 16, MATCHES = 6, TIME = 25, PICKS = 6;
  const PER_HIT = 3, PER_MISS = 3;     // Gäste pro richtiger / falscher Platte
  const RANGE = { 'House': [118, 126], 'Techno': [126, 136], 'Drum & Bass': [170, 176] };
  const GENRES = Object.keys(RANGE);
  const TITLES = ['Midnight Crane', 'Rust & Neon', 'Bunker Bass', 'Harbor Lights', 'Concrete Soul', 'Warehouse 7', 'Fog Machine', 'Last Metro', 'Brick Pulse', 'Velvet Static',
    'Steel Dreams', 'After Hours', 'Kran 04', 'Low End Theory', 'Pier Pressure', 'Neon Rain', 'Analog Heart', 'Night Shift', 'Basement Tape', 'Strobe Child', 'Container Love', 'Dock 13'];
  const SLEEVES = ['#ff2d95', '#00e5c3', '#7b5cff', '#f7d77b', '#ff8a4c', '#3fa9f5', '#c94cff', '#5be37d'];

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  function makeCrate(genre, seed) {
    const rnd = seeded(seed), [lo, hi] = RANGE[genre], recs = [];
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const titles = [...TITLES].sort(() => rnd() - 0.5);
    for (let i = 0; i < RECORDS; i++) {
      let g = genre, bpm;
      if (i < MATCHES) bpm = lo + Math.floor(rnd() * (hi - lo + 1));                   // passt
      else if (i < MATCHES + 4) bpm = rnd() < 0.5 ? lo - 2 - Math.floor(rnd() * 5) : hi + 2 + Math.floor(rnd() * 5);   // richtiges Genre, falsches Tempo
      else { g = pick(GENRES.filter(x => x !== genre)); const [a, b] = RANGE[g]; bpm = a + Math.floor(rnd() * (b - a + 1)); }   // falsches Genre
      recs.push({ title: titles[i % titles.length], genre: g, bpm, color: pick(SLEEVES), match: g === genre && bpm >= lo && bpm <= hi, picked: false });
    }
    return recs.sort(() => rnd() - 0.5);
  }

  let run = null;

  function open() {
    const s = GDU.state, dj = s.booked ? GDU.dj(s.booked) : null;
    if (!dj) {
      return GDU.modal('VINYL JUNKY · Crate Digging',
        '<p>Ohne gebuchten DJ weißt du nicht, wonach du suchen sollst. <b>Buch erst bei Beat Dealers einen DJ</b>, dann komm zurück.</p>',
        [['Zurück', () => GDU.places.store(), false, 'secondary']]);
    }
    const [lo, hi] = RANGE[dj.genre];
    GDU.modal('VINYL JUNKY · Crate Digging',
      '<p><b>' + dj.name + '</b> braucht frische Platten für heute Nacht. Finde in der Kiste bis zu ' + PICKS + ' Platten, die passen:</p>' +
      '<ul class="rules"><li>Genre: <b>' + dj.genre + '</b></li><li>Tempo: <b>' + lo + '–' + hi + ' BPM</b></li></ul>' +
      '<p>Jede richtige Platte bringt <b>+' + PER_HIT + ' Gäste</b>, jede falsche kostet <b>' + PER_MISS + '</b>. Du hast ' + TIME + ' Sekunden. Ein Versuch pro Nacht.</p>',
      [['Kiste öffnen', () => start(dj)], ['Zurück', () => GDU.places.store(), false, 'secondary']], true);
  }

  function start(dj) {
    const s = GDU.state;
    s.crate = { night: s.night, season: s.season, guests: 0, hits: 0, misses: 0, aborted: true };   // Versuch sofort verbuchen
    GDU.save();
    run = { dj, recs: makeCrate(dj.genre, s.season * 211 + s.night * 29 + 3), hits: 0, misses: 0, t0: performance.now(), timer: null };
    GDU.beatRunning = true;
    const [lo, hi] = RANGE[dj.genre];
    GDU.modal('Crate Digging · ' + dj.genre + ' ' + lo + '–' + hi + ' BPM',
      '<div class="crate-head"><span>Gefunden: <b id="crateCount">0 / ' + PICKS + '</b></span><span>Gäste: <b id="crateGuests">±0</b></span></div>' +
      '<div class="door-timer"><i id="crateBar"></i></div>' +
      '<div class="crate" role="group" aria-label="Plattenkiste">' + run.recs.map((r, i) =>
        '<button class="record" data-rec="' + i + '" style="--sleeve:' + r.color + '"><span class="disc"></span><b>' + r.title + '</b><small>' + r.genre + ' · ' + r.bpm + ' BPM</small></button>').join('') + '</div>',
      [['Fertig', finish], ['Abbrechen', abort, false, 'secondary']], true);
    document.querySelectorAll('.record').forEach(b => b.addEventListener('click', () => pick(Number(b.dataset.rec), b)));
    run.timer = setInterval(() => {
      if (!run) return;
      if (!GDU.dialogOpen()) return abort();
      const left = TIME - (performance.now() - run.t0) / 1000;
      const bar = document.getElementById('crateBar');
      if (bar) bar.style.width = GDU.clamp(left / TIME * 100, 0, 100) + '%';
      if (left <= 0) finish();
    }, 100);
  }

  function pick(i, btn) {
    if (!run) return;
    const r = run.recs[i];
    if (r.picked || run.hits + run.misses >= PICKS) return;
    r.picked = true;
    btn.disabled = true;
    btn.classList.add(r.match ? 'hit' : 'miss');
    if (r.match) run.hits++; else run.misses++;
    const g = run.hits * PER_HIT - run.misses * PER_MISS;
    document.getElementById('crateCount').textContent = (run.hits + run.misses) + ' / ' + PICKS;
    document.getElementById('crateGuests').textContent = (g > 0 ? '+' : g < 0 ? '−' : '±') + Math.abs(g);
    if (run.hits + run.misses >= PICKS) setTimeout(finish, 450);
  }

  function cleanup() {
    if (run) clearInterval(run.timer);
    GDU.beatRunning = false;
  }

  function abort() { cleanup(); run = null; GDU.close(); }

  function finish() {
    if (!run) return;
    cleanup();
    const r = run, s = GDU.state;
    run = null;
    const guests = r.hits * PER_HIT - r.misses * PER_MISS;
    s.crate = { night: s.night, season: s.season, guests, hits: r.hits, misses: r.misses };
    GDU.save();
    if (r.hits >= PICKS && !r.misses) GDU.achieve('crate');
    const title = r.hits >= 5 && !r.misses ? 'Goldene Kiste!' : guests > 0 ? 'Gute Funde' : guests < 0 ? 'Fehlgriffe' : 'Nichts Besonderes';
    GDU.modal('CRATE DIGGING · ' + title,
      '<div class="result-top"><div><small>Treffer</small><b>' + r.hits + '</b></div><div><small>Fehlgriffe</small><b>' + r.misses + '</b></div><div><small>Gäste heute</small><b>' + (guests > 0 ? '+' : '') + guests + '</b></div></div>' +
      '<p>' + (guests > 0 ? r.dj.name + ' freut sich über die Platten. Die Fans erzählen es weiter.' : guests < 0 ? 'Ein paar Platten passen nicht ins Set. Das spricht sich leider auch herum.' : 'Die Kiste bringt heute nichts Neues.') + ' Der Effekt gilt für die Party in Nacht ' + s.night + '.</p>',
      [['Zurück zum Laden', () => GDU.places.store()], ['Schließen', GDU.close, false, 'secondary']], true);
  }

  return { open, debug: () => run };
})();
