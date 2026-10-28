/* GDU Underground City – Minispiel „Türsteher“ vor dem Bunker 99
   Vor der Party steht Maria an der Tür: Gäste kommen einzeln, sie entscheidet
   „Rein“ oder „Draußen bleiben“ nach den Regeln des Abends.
   Eine gute Tür bringt Stimmung, eine schlechte Ärger. Ein Versuch pro Nacht. */
'use strict';

window.GDU = window.GDU || {};

GDU.door = (() => {
  const GUESTS = 10;          // Gäste pro Runde
  const TIME = 6;             // Sekunden pro Gast
  const NAMES = ['Jule', 'Can', 'Mira', 'Theo', 'Ayla', 'Ben', 'Noor', 'Luca', 'Sofia', 'Emre', 'Lea', 'Milan', 'Zoe', 'Jonas', 'Elif', 'Nico', 'Ida', 'Deniz', 'Mats', 'Lina'];
  const OUTFITS = {
    black:  { label: 'komplett in Schwarz', color: '#20232c' },
    dark:   { label: 'dunkle Streetwear',    color: '#3b4256' },
    bright: { label: 'Neon-Partyoutfit',     color: '#ff7ac4' },
    suit:   { label: 'Anzug mit Krawatte',   color: '#5d6b88' }
  };

  // Regeln des Abends: drei feste, eine wechselnde Kleiderregel
  const DRESS = [
    { id: 'black', text: 'Dresscode heute: <b>dunkel</b>. Neon-Outfits und Anzüge bleiben draußen.', ok: o => o === 'black' || o === 'dark' },
    { id: 'any',   text: 'Heute <b>kein Dresscode</b>. Alle Outfits sind okay.', ok: () => true },
    { id: 'neon',  text: 'Motto-Party „Neon Night“: <b>nur Neon-Outfits oder Schwarz</b>.', ok: o => o === 'bright' || o === 'black' }
  ];

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Richtige Entscheidung für einen Gast
  function shouldEnter(g, dress) {
    if (!g.id) return false;            // ohne Ausweis nie
    if (g.drunk) return false;          // Betrunkene nie, auch nicht auf der Liste
    if (g.list) return true;            // Gästeliste schlägt Dresscode
    return dress.ok(g.outfit);
  }

  function makeGuests(seed, dress) {
    const rnd = seeded(seed), list = [];
    const keys = Object.keys(OUTFITS);
    for (let i = 0; i < GUESTS; i++) {
      const g = {
        name: NAMES[Math.floor(rnd() * NAMES.length)],
        outfit: keys[Math.floor(rnd() * keys.length)],
        id: rnd() > 0.15,
        drunk: rnd() < 0.18,
        list: rnd() < 0.2
      };
      g.enter = shouldEnter(g, dress);
      list.push(g);
    }
    // Ausgewogen: 4 bis 6 von 10 Gästen dürfen rein. So lohnt sich weder „alle rein“ noch „alle raus“.
    let ins = list.filter(g => g.enter);
    while (ins.length > 6) {
      const g = ins.pop();
      if (rnd() < 0.5) g.drunk = true; else g.id = false;
      g.enter = false;
    }
    let outs = list.filter(g => !g.enter);
    while (list.filter(g => g.enter).length < 4) {
      const g = outs.shift();
      Object.assign(g, { id: true, drunk: false, list: true, enter: true });
    }
    return list;
  }

  GDU.doorRating = acc =>
    acc >= 0.9 ? { bonus: 6, title: 'Perfekte Tür!' } :
    acc >= 0.7 ? { bonus: 3, title: 'Gute Tür' } :
    acc >= 0.5 ? { bonus: 0, title: 'Wackelige Tür' } :
                 { bonus: -5, title: 'Chaos an der Tür' };

  let run = null;

  function rulesHtml(dress) {
    return '<ul class="rules">' +
      '<li>Kein Ausweis, kein Einlass.</li>' +
      '<li>Wer betrunken ist, bleibt draußen, auch mit Gästeliste.</li>' +
      '<li>Gästeliste kommt rein, egal was sie anhat.</li>' +
      '<li>' + dress.text + '</li></ul>';
  }

  function dressFor(s) { return DRESS[(s.season * 7 + s.night * 3) % DRESS.length]; }

  function open() {
    const s = GDU.state, dress = dressFor(s);
    GDU.modal('BUNKER 99 · Türsteher',
      '<p>Heute stehst du selbst an der Tür. ' + GUESTS + ' Gäste, je ' + TIME + ' Sekunden Zeit. Eine gute Tür macht die Party besser. Lässt du die Falschen rein, gibt es Ärger.</p>' +
      '<h3 class="small-h">Regeln für Nacht ' + s.night + '</h3>' + rulesHtml(dress) +
      '<p class="small muted">Tastatur: <b>D</b> oder → = Rein, <b>A</b> oder ← = Draußen. Ein Versuch pro Nacht.</p>',
      [['Tür öffnen', start], ['Zurück', () => GDU.places.club(), false, 'secondary']], true);
  }

  function start() {
    const s = GDU.state, dress = dressFor(s);
    s.door = { night: s.night, season: s.season, bonus: 0, acc: 0, aborted: true };   // Versuch sofort verbuchen
    GDU.save();
    run = { dress, guests: makeGuests(s.season * 131 + s.night * 17 + 5, dress), i: 0, right: 0, trouble: 0, wrongOut: 0, timer: null, left: TIME };
    GDU.beatRunning = true;   // Klick neben das Fenster beendet die Runde nicht
    document.addEventListener('keydown', onKey, true);
    show();
  }

  function avatar(g) {
    const c = OUTFITS[g.outfit].color;
    return '<svg class="guest-svg" viewBox="0 0 80 120" aria-hidden="true">' +
      '<ellipse cx="40" cy="114" rx="22" ry="5" fill="#00000066"/>' +
      '<rect x="22" y="44" width="36" height="46" rx="10" fill="' + c + '"/>' +
      (g.outfit === 'suit' ? '<path d="M40 46 l-5 10 l5 18 l5 -18z" fill="#c7d2e6"/>' : '') +
      (g.outfit === 'bright' ? '<rect x="22" y="60" width="36" height="5" fill="#00e5c3"/>' : '') +
      '<rect x="27" y="88" width="10" height="24" rx="4" fill="#1b2639"/><rect x="43" y="88" width="10" height="24" rx="4" fill="#1b2639"/>' +
      '<circle cx="40" cy="28" r="15" fill="#e3b391"/>' +
      '<path d="M25 26 a15 15 0 0 1 30 0 v-4 a15 13 0 0 0 -30 0z" fill="#3a2a2a"/>' +
      (g.drunk ? '<path d="M33 27 l4 3 M37 27 l-4 3 M43 27 l4 3 M47 27 l-4 3" stroke="#3a2a2a" stroke-width="1.6"/><path d="M34 35 q6 4 12 0" stroke="#7a3b3b" stroke-width="2" fill="none"/>' : '<circle cx="35" cy="28" r="1.8" fill="#1b2639"/><circle cx="45" cy="28" r="1.8" fill="#1b2639"/>') +
      '</svg>';
  }

  function show() {
    const g = run.guests[run.i];
    run.left = TIME;
    GDU.modal('Türsteher · Gast ' + (run.i + 1) + ' / ' + GUESTS,
      '<div class="door-stage' + (g.drunk ? ' sway' : '') + '">' + avatar(g) +
      '<div class="guest-info"><b class="guest-name">' + g.name + '</b>' +
      '<ul class="facts-list">' +
      '<li>Outfit: ' + OUTFITS[g.outfit].label + '</li>' +
      '<li>' + (g.id ? 'Zeigt einen Ausweis' : '<span class="warn">„Ausweis? Hab ich zu Hause …“</span>') + '</li>' +
      '<li>' + (g.drunk ? '<span class="warn">Schwankt und lallt</span>' : 'Wirkt nüchtern und entspannt') + '</li>' +
      '<li>' + (g.list ? '<span class="done">Steht auf der Gästeliste</span>' : 'Nicht auf der Gästeliste') + '</li>' +
      '</ul></div></div>' +
      '<div class="door-timer"><i id="doorBar"></i></div>' +
      '<details class="door-rules"><summary>Regeln anzeigen</summary>' + rulesHtml(run.dress) + '</details>',
      [['✓ Rein (D)', () => decide(true)], ['✕ Draußen (A)', () => decide(false), false, 'secondary'], ['Abbrechen', abort, false, 'secondary']], true);
    clearInterval(run.timer);
    const t0 = performance.now();
    run.timer = setInterval(() => {
      if (!run) return;
      if (!GDU.dialogOpen()) return abort();
      const left = TIME - (performance.now() - t0) / 1000;
      const bar = document.getElementById('doorBar');
      if (bar) bar.style.width = GDU.clamp(left / TIME * 100, 0, 100) + '%';
      if (left <= 0) decide(null);   // Zeit abgelaufen: zählt als falsch
    }, 100);
  }

  function onKey(e) {
    if (!run) return;
    const k = e.key.toLowerCase();
    if (k === 'd' || k === 'arrowright') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) decide(true); }
    else if (k === 'a' || k === 'arrowleft') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) decide(false); }
  }

  function decide(enter) {
    if (!run) return;
    clearInterval(run.timer);
    const g = run.guests[run.i];
    if (enter === g.enter) run.right++;
    else if (enter === true) run.trouble++;   // die Falschen reingelassen
    else run.wrongOut++;                      // jemanden zu Unrecht abgewiesen oder zu lange gezögert
    run.i++;
    if (run.i >= GUESTS) finish(); else show();
  }

  function cleanup() {
    if (run) clearInterval(run.timer);
    document.removeEventListener('keydown', onKey, true);
    GDU.beatRunning = false;
    run = null;
  }

  function abort() { cleanup(); GDU.close(); }

  function finish() {
    const r = run, acc = r.right / GUESTS, rating = GDU.doorRating(acc), s = GDU.state;
    cleanup();
    s.door = { night: s.night, season: s.season, bonus: rating.bonus, acc: Math.round(acc * 100), trouble: r.trouble };
    GDU.save();
    GDU.modal('TÜRSTEHER · ' + rating.title,
      '<div class="result-top"><div><small>Richtig</small><b>' + r.right + ' / ' + GUESTS + '</b></div><div><small>Ärger reingelassen</small><b>' + r.trouble + '</b></div><div><small>Stimmung heute</small><b>' + (rating.bonus > 0 ? '+' : '') + rating.bonus + '</b></div></div>' +
      '<p>' + (rating.bonus > 0 ? 'Die richtige Crowd ist drin. Das spürt man auf der Tanzfläche.' : rating.bonus < 0 ? 'Drinnen wird es unruhig. Die Stimmung leidet.' : 'Ein paar Fehler, aber nichts Dramatisches.') +
      (r.wrongOut ? ' ' + r.wrongOut + ' Gäste wurden zu Unrecht abgewiesen oder haben zu lange gewartet.' : '') + '</p>',
      [['Zur Party-Planung', () => GDU.places.club()]], true);
  }

  return { open, debug: () => run };
})();
