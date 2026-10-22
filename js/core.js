/* GDU Underground City – Spielkern
   Spielstand, Speichern, Seitenleiste (HUD) und Dialogfenster.
   Alle Minispiele greifen über GDU.state und GDU.save() auf denselben Spielstand zu. */
'use strict';

window.GDU = window.GDU || {};

GDU.KEY = 'gdu-city-v2';   // Speicherschlüssel im Browser (localStorage)

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
  season: (keep.season ?? 0) + 1,
  best: keep.best ?? 0,
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
  result: null           // 'won' | 'goal' | 'broke'
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

GDU.state = GDU.load();

/* ---------- Seitenleiste ---------- */

GDU.updateHUD = () => {
  const s = GDU.state, c = GDU.config;
  const $ = id => document.getElementById(id);
  $('money').textContent = GDU.euro(s.money);
  $('rep').textContent = s.rep;
  $('happy').textContent = s.lastHappy === null ? '–' : s.lastHappy + ' %';
  $('night').textContent = s.over ? 'Ende' : s.night + ' / ' + c.nights;

  const pct = GDU.clamp(Math.round(s.money / c.goal * 100), 0, 100);
  const trend = GDU.trend(s.trend);
  const dj = s.booked ? GDU.dj(s.booked) : null;
  const step = (ok, text) => '<div class="' + (ok ? 'done' : 'muted') + '">' + (ok ? '✓' : '○') + ' ' + text + '</div>';

  let html =
    '<div class="goal"><span>Ziel: ' + GDU.euro(c.goal) + ' nach Nacht ' + c.nights + '</span><strong>' + pct + ' %</strong></div>' +
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
      step(false, 'Party im Bunker 99 starten');
  }
  if (s.best) html += '<p class="muted small">Bester Saisonabschluss: ' + GDU.euro(s.best) + '</p>';
  $('season').innerHTML = html;
  $('seasonTitle').textContent = 'Saison ' + s.season;
};

GDU.renderMinigames = () => {
  document.getElementById('minigames').innerHTML = GDU.minigames.map(m =>
    '<div class="game ' + (m.ready ? 'ready' : 'soon') + '"><b>' + m.name + '</b><span>' + m.place + '</span><em>' + (m.ready ? 'spielbar' : 'demnächst') + '</em></div>'
  ).join('');
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

back.addEventListener('click', e => { if (e.target === back) GDU.close(); });
