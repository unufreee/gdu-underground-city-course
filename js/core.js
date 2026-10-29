/* GDU Underground City – Spielkern
   Spielstand, Speichern, Seitenleiste (HUD) und Dialogfenster.
   Alle Minispiele greifen über GDU.state und GDU.save() auf denselben Spielstand zu. */
'use strict';

window.GDU = window.GDU || {};

// Demo-Modus für Präsentationen: Adresse mit ?demo startet einen vorbereiteten Spielstand.
// Er wird unter einem eigenen Schlüssel gespeichert, der normale Spielstand bleibt unberührt.
GDU.demo = /[?&]demo\b/.test(location.search);
GDU.KEY = GDU.demo ? 'gdu-city-v2-demo' : 'gdu-city-v2';   // Speicherschlüssel im Browser (localStorage)

GDU.euro = n => n.toLocaleString('de-DE') + ' €';
GDU.dj = id => GDU.djs.find(d => d.id === id);
GDU.trend = id => GDU.trends.find(t => t.id === id) || GDU.trends[0];
GDU.promo = id => GDU.promos.find(p => p.id === id) || GDU.promos[0];

// Zufälliges Ereignis für die nächste Nacht (nie zweimal dasselbe hintereinander)
GDU.rollTrend = last => {
  const pool = GDU.trends.filter(t => t.id !== last);
  return pool[Math.floor(Math.random() * pool.length)].id;
};

// Neue Saison: Wirtschaft zurücksetzen, Position und Bestwert behalten
GDU.newSeason = (keep = {}) => ({
  x: keep.x ?? 10, y: keep.y ?? 12,
  district: keep.district ?? 'warehouse',   // aktueller Bezirk: 'warehouse' oder 'harbor'
  harbor: keep.harbor ?? false,             // Chapter 02 (Hafen) freigeschaltet? Bleibt über Saisons
  club: 0,                     // Ausbaustufe Bunker 99 in dieser Saison (0–3)
  pierUsed: 0,                 // Saison, in der die Open-Air-Nacht am Pier 7 schon stattfand
  radio: null,                 // Radio Hafenfunk heute Nacht (Spot / Interview)
  season: (keep.season ?? 0) + 1,
  best: keep.best ?? 0,
  hall: keep.hall ?? [],       // Bestenliste der besten Saisons (max. 5)
  mute: keep.mute ?? false,    // Ton aus
  achievements: keep.achievements ?? [],   // freigeschaltete Erfolge (bleiben über Saisons)
  mod: null,                   // Folgen einer Ereigniskarte für die nächste Nacht
  seenEvents: [],              // in dieser Saison schon gezogene Ereigniskarten
  money: GDU.config.startMoney,
  rep: 0,
  night: 1,
  gear: {},
  booked: null,          // für heute Nacht gebuchter DJ
  entry: 12,             // zuletzt gewählter Eintrittspreis
  promo: 'none',
  trend: 'normal',       // die erste Nacht ist immer ein normaler Abend
  lastHappy: null,
  parties: 0,
  history: [],
  over: false,           // Saison beendet?
  result: null,          // 'won' | 'goal' | 'broke'
  warmup: null,          // Ergebnis des Beat-Battles für die aktuelle Nacht
  door: null,            // Ergebnis des Türsteher-Spiels für die aktuelle Nacht
  crate: null,           // Ergebnis von Crate Digging für die aktuelle Nacht
});

GDU.load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(GDU.KEY));
    if (saved && Number.isInteger(saved.x) && Number.isInteger(saved.night)) return { ...GDU.newSeason(), ...saved };
  } catch (e) { /* kein oder beschädigter Spielstand */ }
  return GDU.newSeason();
};

GDU.save = () => {
  try { localStorage.setItem(GDU.KEY, JSON.stringify(GDU.state)); } catch (e) { /* Speichern nicht möglich (z. B. privater Modus) */ }
};

// Vorbereiteter Spielstand für den Demo-Modus: Nacht 3, Anlage und Nebel gekauft, Geld für jeden DJ außer der Headlinerin
GDU.demoState = () => ({
  ...GDU.newSeason(),
  x: 5, y: 8, money: 1250, rep: 12, night: 3, trend: 'techno', lastHappy: 66, parties: 2,
  harbor: true,   // in der Demo ist der Hafen schon offen, damit alles gezeigt werden kann
  gear: { sound: true, fog: true }, entry: 12, promo: 'flyer',
  history: [
    { night: 1, dj: 'DJ Voltage', trend: 'Normaler Freitag', guests: 58, happy: 61, net: 702 },
    { night: 2, dj: 'Lina Loop', trend: 'Semesterstart', guests: 96, happy: 72, net: 1102 }
  ]
});

GDU.state = GDU.load();
if (GDU.demo && !localStorage.getItem(GDU.KEY)) { GDU.state = GDU.demoState(); GDU.save(); }

// Warm-up (Beat-Battle) der aktuellen Nacht, sonst null
// Ergebnis eines Minispiels (warmup, door, crate), wenn es zur aktuellen Nacht gehört, sonst null
GDU.tonight = field => {
  const w = GDU.state[field];
  return w && w.night === GDU.state.night && w.season === GDU.state.season ? w : null;
};
GDU.warmupTonight = () => GDU.tonight('warmup');

// Saisonziel: ab Chapter 02 höher
GDU.goal = () => GDU.state.harbor ? GDU.config.goal2 : GDU.config.goal;

// Titel nach Saisonergebnis
// (relativ zum Saisonziel: Chapter 01 = 5.000 €, Chapter 02 = 10.000 €)
GDU.seasonTitle = (money, result) => {
  const g = GDU.goal();
  return result === 'broke' ? 'Pleitegeier' :
    money >= g + 4000 ? 'Königin der Nacht' :
    money >= g + 2000 ? 'Club-Legende' :
    money >= g ? 'Szene-Größe' :
    money >= g / 2 ? 'Szene-Insider' : 'Kellerkind';
};

// Abgeschlossene Saison in die Bestenliste (Top 5 nach Kapital) eintragen
GDU.recordSeason = () => {
  const s = GDU.state;
  s.hall = (s.hall || []).filter(h => h.season !== s.season);
  s.hall.push({ season: s.season, money: s.money, result: s.result, title: GDU.seasonTitle(s.money, s.result) });
  s.hall.sort((a, b) => b.money - a.money);
  s.hall = s.hall.slice(0, 5);
  if (GDU.checkSeason) GDU.checkSeason(s);
};
const signed = n => (n > 0 ? '+' : '') + n;

/* ---------- Seitenleiste ---------- */

GDU.updateHUD = () => {
  const s = GDU.state, c = GDU.config;
  const $ = id => document.getElementById(id);
  $('money').textContent = GDU.euro(s.money);
  $('rep').textContent = s.rep;
  $('happy').textContent = s.lastHappy === null ? '–' : s.lastHappy + ' %';
  $('night').textContent = s.over ? 'Ende' : s.night + ' / ' + c.nights;

  const goal = GDU.goal();
  const pct = GDU.clamp(Math.round(s.money / goal * 100), 0, 100);
  const trend = GDU.trend(s.trend);
  const dj = s.booked ? GDU.dj(s.booked) : null;
  const step = (ok, text) => '<div class="' + (ok ? 'done' : 'muted') + '">' + (ok ? '✓' : '○') + ' ' + text + '</div>';

  let html =
    '<div class="goal"><span>Ziel: ' + GDU.euro(goal) + ' nach Nacht ' + c.nights + (s.harbor ? ' · Chapter 02' : '') + '</span><strong>' + pct + ' %</strong></div>' +
    '<div class="bar" role="progressbar" aria-label="Fortschritt zum Saisonziel" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>';

  if (s.over) {
    html += s.result === 'won'
      ? '<p class="done"><b>SAISON GESCHAFFT!</b><br>Bunker 99 regiert den Warehouse District.</p>'
      : '<p class="warn"><b>' + (s.result === 'broke' ? 'PLEITE.' : 'ZIEL VERFEHLT.') + '</b><br>Geh in den Bunker 99 für eine neue Saison.</p>';
  } else {
    html +=
      '<div class="tonight"><small>Heute Nacht</small><b>' + trend.title + '</b><span>' + trend.text + '</span></div>' +
      step(!!s.gear.sound, 'Soundanlage bei Vinyl Junky') +
      step(!!dj, dj ? 'DJ gebucht: ' + dj.name : 'DJ bei Beat Dealers buchen') +
      step(!!GDU.tonight('crate'), 'Optional: Crate Digging' + (GDU.tonight('crate') ? ' (' + signed(GDU.tonight('crate').guests) + ' Gäste)' : '')) +
      step(!!GDU.tonight('warmup'), 'Optional: Warm-up am DJ-Pult' + (GDU.tonight('warmup') ? ' (' + signed(GDU.tonight('warmup').bonus) + ' Stimmung)' : '')) +
      step(!!GDU.tonight('door'), 'Optional: Türsteher' + (GDU.tonight('door') ? ' (' + signed(GDU.tonight('door').bonus) + ' Stimmung)' : '')) +
      (s.harbor ? step(!!(GDU.tonight('radio') || {}).spot, 'Optional: Spot bei Radio Hafenfunk') : '') +
      step(false, 'Party im Bunker 99' + (s.harbor && s.pierUsed !== s.season ? ' oder Open Air am Pier 7' : '') + ' starten');
  }
  if (s.hall && s.hall.length) html += '<p class="muted small">Bestleistung: ' + GDU.euro(s.hall[0].money) + ' · ' + s.hall[0].title + '</p>';
  else if (s.best) html += '<p class="muted small">Bester Saisonabschluss: ' + GDU.euro(s.best) + '</p>';
  $('season').innerHTML = html;
  GDU.renderMinigames();
  $('seasonTitle').textContent = 'Saison ' + s.season;
  $('chapterLabel').textContent = s.district === 'harbor' ? 'CHAPTER 02 / HAFEN' : 'CHAPTER 01 / WAREHOUSE DISTRICT';
};

GDU.renderMinigames = () => {
  document.getElementById('minigames').innerHTML = GDU.minigames.map(m => {
    const locked = m.chapter === 2 && !GDU.state.harbor;
    return '<div class="game ' + (m.ready && !locked ? 'ready' : 'soon') + '"><b>' + m.name + '</b><span>' + m.place + '</span><em>' + (locked ? 'Chapter 02' : m.ready ? 'spielbar' : 'demnächst') + '</em></div>';
  }).join('');
};

/* ---------- Dialogfenster ---------- */

const back = document.getElementById('back');
let returnFocus = null;   // Element, das nach dem Schließen den Fokus zurückbekommt

GDU.dialogOpen = () => back.classList.contains('open');

/**
 * Öffnet ein Dialogfenster.
 * @param {string} title
 * @param {string} html  Inhalt
 * @param {Array} actions  Liste aus [Text, Funktion, deaktiviert?, CSS-Klasse?]
 * @param {boolean} wide  breites Fenster (z. B. für DJ-Karten)
 */
GDU.modal = (title, html, actions, wide = false) => {
  if (!GDU.dialogOpen()) returnFocus = document.activeElement;
  document.getElementById('dialogTitle').textContent = title;
  document.getElementById('dialogContent').innerHTML = html;
  document.querySelector('.dialog').classList.toggle('wide', wide);
  const bar = document.getElementById('dialogActions');
  bar.replaceChildren();
  for (const [text, fn, disabled, cls] of actions) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.disabled = !!disabled;
    if (cls) btn.className = cls;
    btn.addEventListener('click', fn);
    bar.append(btn);
  }
  back.classList.add('open');
  document.querySelector('.dialog').scrollTop = 0;
  if (!GDU.holdHUD) GDU.updateHUD();   // Seitenleiste zeigt sofort den neuen Stand (außer während der Party-Animation)
  const target = back.querySelector('#dialogContent button:not(:disabled)') || bar.querySelector('button:not(:disabled)') || back.querySelector('input');
  if (target) target.focus();
};

GDU.close = () => {
  if (!GDU.dialogOpen()) return;
  back.classList.remove('open');
  GDU.holdHUD = false;
  if (returnFocus && document.contains(returnFocus) && returnFocus !== document.body) returnFocus.focus();
  returnFocus = null;
  GDU.draw();
};

// Tab-Taste bleibt innerhalb des offenen Dialogs
GDU.trapFocus = e => {
  const items = [...back.querySelectorAll('button:not(:disabled), input:not(:disabled)')].filter(el => !(el.type === 'radio' && !el.checked));
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
};

// Klick neben das Fenster schließt es (nicht während des Beat-Battles, damit kein Versehen die Runde beendet)
back.addEventListener('click', e => { if (e.target === back && !GDU.beatRunning) GDU.close(); });
