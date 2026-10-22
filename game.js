/* GDU Underground City – Warehouse District (Chapter 01)
   Eigenständiges Browsergame ohne externe Bibliotheken oder Bilder.
   Aufbau:
     1. Spielwelt und Spielstand
     2. Zeichenfunktionen (Boden, Gebäude, Figuren, Minikarte)
     3. Spiellogik (Bewegen, Gebäude, Party)
     4. Dialogfenster
     5. Eingabe (Tastatur, Touch, Buttons) und Start */
'use strict';

/* ---------- 1. Spielwelt und Spielstand ---------- */

const W = 20, H = 20;            // Kartengröße in Feldern
const TW = 56, TH = 28;          // Breite/Höhe eines isometrischen Feldes in Pixel
const OX = 550, OY = 76;         // Ursprung der Karte auf dem Canvas
// Speicherschlüssel bewusst unverändert, damit bestehende Spielstände erhalten bleiben.
const KEY = 'gdu-warehouse-v02';

const buildings = [
  { id: 'agency', name: 'BEAT DEALERS', subtitle: 'DJ-AGENTUR',   a: [2, 7, 2, 6],   door: [5, 7],  color: '#bf527e', height: 48 },
  { id: 'store',  name: 'VINYL JUNKY',  subtitle: 'PLATTENLADEN', a: [12, 17, 2, 6], door: [14, 7], color: '#b48b4d', height: 35 },
  { id: 'club',   name: 'BUNKER 99',    subtitle: 'CLUB',         a: [2, 7, 11, 17], door: [5, 10], color: '#6657a8', height: 63 }
];

// Spieleinstellungen der Mission
const PRICE_DJ = 120, PRICE_SOUND = 90, PARTY_COST = 40;

const initial = () => ({ x: 10, y: 12, money: 300, rep: 0, happy: null, parties: 0, dj: false, sound: false, entry: 12, completed: false });

let state = initial();
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved && Number.isInteger(saved.x) && saved.x >= 0 && saved.x < W && saved.y >= 0 && saved.y < H) state = { ...state, ...saved };
} catch (e) { /* kein oder beschädigter Spielstand: Neustart */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* Speichern nicht möglich (z. B. privater Modus) */ }
}

// Begehbare Wege: Straßen, Plaza und Zugänge. Jedes begehbare Feld steht in dieser Liste.
const paths = new Set();
const addPath = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) paths.add(x + ',' + y); };
for (let y = 7; y <= 10; y++) for (let x = 1; x <= 18; x++) addPath(x, y);
for (let y = 10; y <= 17; y++) for (let x = 8; x <= 12; x++) addPath(x, y);
for (let y = 10; y <= 17; y++) for (let x = 13; x <= 18; x++) addPath(x, y);
for (let y = 18; y <= 19; y++) for (let x = 1; x <= 18; x++) addPath(x, y);
for (let y = 0; y <= 1; y++) for (let x = 8; x <= 11; x++) addPath(x, y);

const inside = (x, y, b) => x >= b.a[0] && x <= b.a[1] && y >= b.a[2] && y <= b.a[3];
const walkable = (x, y) => paths.has(x + ',' + y) && !buildings.some(b => inside(x, y, b));
if (!walkable(state.x, state.y)) { state.x = 10; state.y = 12; }

// Passanten, die sich zufällig in der Nähe ihres Startpunkts bewegen
const livingNPCs = [
  { x: 13, y: 9,  shirt: '#eb8f62', hair: '#24232c', home: [13, 9] },
  { x: 17, y: 16, shirt: '#63b6bb', hair: '#1e2333', home: [17, 16] },
  { x: 9,  y: 16, shirt: '#d57ac8', hair: '#322b39', home: [9, 16] },
  { x: 8,  y: 8,  shirt: '#b7d87a', hair: '#3a2534', home: [8, 8] }
];

let nightScene = true;   // Tag/Nacht-Umschaltung
let facing = 'down';     // Blickrichtung der Spielfigur
let stride = 0;          // Schrittzähler für die Laufanimation

/* ---------- 2. Zeichenfunktionen ---------- */

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const mini = document.getElementById('minimap');
const hint = document.getElementById('hint');
const back = document.getElementById('back');

const iso = (x, y) => ({ x: OX + (x - y) * TW / 2, y: OY + (x + y) * TH / 2 });
// Feste Pseudo-Zufallszahl pro Feld, damit Details nicht flackern
const random = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

function poly(points, fill, stroke) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function diamond(x, y, color, stroke) {
  const p = iso(x, y);
  poly([[p.x, p.y], [p.x + TW / 2, p.y + TH / 2], [p.x, p.y + TH], [p.x - TW / 2, p.y + TH / 2]], color, stroke);
}

function line(x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Leuchtschrift (nachts mit stärkerem Glow)
function sign(text, x, y, color = '#8fffea', size = 12) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 ' + size + 'px system-ui';
  ctx.shadowColor = color;
  ctx.shadowBlur = nightScene ? 18 : 3;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function neonWindow(x, y, lit) {
  ctx.fillStyle = lit ? '#f7cb83' : '#172b37';
  ctx.fillRect(x - 5, y - 6, 10, 8);
  ctx.fillStyle = lit ? '#fff0b5' : '#4e6870';
  ctx.fillRect(x - 1, y - 6, 2, 8);
  ctx.strokeStyle = '#101a27';
  ctx.strokeRect(x - 5, y - 6, 10, 8);
}

function rooftopVent(x, y) {
  ctx.fillStyle = '#182c38'; ctx.fillRect(x - 8, y - 13, 16, 13);
  ctx.fillStyle = '#6d8993'; ctx.fillRect(x - 9, y - 15, 18, 5);
  ctx.fillStyle = '#293c4a'; ctx.fillRect(x - 5, y - 18, 10, 3);
}

function building(b) {
  const [x1, x2, y1, y2] = b.a, h = b.height;
  const A = iso(x1, y1), R = iso(x2 + 1, y1), B = iso(x2 + 1, y2 + 1), L = iso(x1, y2 + 1);
  const up = p => [p.x, p.y - h];

  // Fassaden
  poly([[L.x, L.y], [B.x, B.y], up(B), up(L)], b.id === 'club' ? '#25243d' : '#423944', '#111925');
  poly([[B.x, B.y], [R.x, R.y], up(R), up(B)], b.id === 'store' ? '#54443a' : '#303646', '#111925');
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const px = L.x + (B.x - L.x) * t, py = L.y + (B.y - L.y) * t;
    const qx = B.x + (R.x - B.x) * t, qy = B.y + (R.y - B.y) * t;
    for (let row = 0; row < 2; row++) {
      neonWindow(px, py - h + 17 + row * 16, nightScene && ((i + row) % 3 !== 0));
      neonWindow(qx, qy - h + 17 + row * 16, nightScene && ((i + row + 1) % 3 !== 0));
    }
  }

  // Dach mit Oberlicht und Lüftung
  poly([up(A), up(R), up(B), up(L)], b.id === 'club' ? '#514064' : b.id === 'agency' ? '#79516a' : '#806744', '#bed0d2');
  const mid = iso((x1 + x2 + 1) / 2, (y1 + y2 + 1) / 2);
  poly([[mid.x - 33, mid.y - h - 10], [mid.x + 4, mid.y - h - 20], [mid.x + 34, mid.y - h - 7], [mid.x - 4, mid.y - h + 3]], '#20313d', '#9cbdc0');
  rooftopVent(mid.x + 20, mid.y - h + 3);

  if (b.id === 'agency') { // Satellitenschüssel
    line(mid.x - 33, mid.y - h - 9, mid.x - 33, mid.y - h - 39, '#9ab3bc', 3);
    ctx.strokeStyle = '#c6e4e9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(mid.x - 33, mid.y - h - 39, 13, 5, -.3, 0, Math.PI * 2); ctx.stroke();
  }
  if (b.id === 'club') { // Neonleisten auf dem Dach
    for (let k = 0; k < 3; k++) {
      const sx = mid.x - 35 + k * 29;
      ctx.fillStyle = '#161b32'; ctx.fillRect(sx, mid.y - h - 8, 18, 8);
      ctx.shadowColor = '#fa48c2'; ctx.shadowBlur = nightScene ? 18 : 0;
      ctx.fillStyle = '#ef4aa9'; ctx.fillRect(sx, mid.y - h - 9, 18, 3);
      ctx.shadowBlur = 0;
    }
  }

  // Eingang mit E-Markierung
  const d = iso(...b.door);
  diamond(...b.door, nightScene ? '#076e72' : '#438d86', '#b8fff0');
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#f6ffff'; ctx.fillText('E', d.x, d.y + 18); ctx.restore();

  // Name und Untertitel
  sign(b.name, mid.x, mid.y - h + 21, b.id === 'club' ? '#ff71ce' : b.id === 'agency' ? '#ffb06e' : '#f7d77b', 14);
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#e3eef5'; ctx.fillText(b.subtitle, mid.x, mid.y - h + 35); ctx.restore();

  if (b.id === 'club') { // Warteschlange vor dem Club
    const q = iso(6, 10);
    for (let i = 0; i < 3; i++) {
      const xx = q.x + 13 * i;
      ctx.fillStyle = '#111a27'; ctx.beginPath(); ctx.arc(xx, q.y - 5, 3, 0, 7); ctx.fill();
      ctx.fillStyle = ['#da83aa', '#80b6c8', '#b9a0e4'][i]; ctx.fillRect(xx - 3, q.y - 1, 6, 8);
    }
  }
}

function drawNPC(x, y, shirt, hair) {
  const p = iso(x, y), yy = p.y + TH / 2;
  ctx.fillStyle = '#09141b99'; ctx.beginPath(); ctx.ellipse(p.x, yy, 8, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = shirt; ctx.fillRect(p.x - 4, yy - 18, 8, 12);
  ctx.fillStyle = '#d5a07d'; ctx.beginPath(); ctx.arc(p.x, yy - 23, 5, 0, 7); ctx.fill();
  ctx.fillStyle = hair; ctx.fillRect(p.x - 5, yy - 28, 10, 4);
}

// Spielfigur Maria mit Blickrichtung und Laufanimation
function player() {
  const p = iso(state.x, state.y), x = p.x, y = p.y + TH / 2;
  const bob = stride % 2 ? 2 : 0;
  const left = facing === 'left', right = facing === 'right', backView = facing === 'up';
  ctx.save();
  ctx.fillStyle = '#02050b9c'; ctx.beginPath(); ctx.ellipse(x, y + 2, 13, 5, 0, 0, 7); ctx.fill();
  // Beine
  ctx.strokeStyle = '#1b2639'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 11); ctx.lineTo(x - 5 + (stride % 2 ? 3 : 0), y - 1);
  ctx.moveTo(x + 4, y - 11); ctx.lineTo(x + 5 - (stride % 2 ? 3 : 0), y - 1);
  ctx.stroke();
  // Oberkörper
  ctx.fillStyle = '#ed4da2'; ctx.beginPath();
  ctx.moveTo(x - 9, y - 31 - bob); ctx.lineTo(x + 9, y - 31 - bob); ctx.lineTo(x + 7, y - 11); ctx.lineTo(x - 7, y - 11);
  ctx.fill();
  // Arme
  ctx.strokeStyle = '#e6ae8f'; ctx.lineWidth = 4; ctx.beginPath();
  ctx.moveTo(x - 8, y - 28 - bob); ctx.lineTo(x - 11 + (left ? -3 : 0), y - 16);
  ctx.moveTo(x + 8, y - 28 - bob); ctx.lineTo(x + 11 + (right ? 3 : 0), y - 16);
  ctx.stroke();
  // Kopf, Haare, Auge
  ctx.fillStyle = '#e6b292'; ctx.beginPath(); ctx.arc(x, y - 39 - bob, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#edc66e'; ctx.beginPath(); ctx.arc(x, y - 41 - bob, 9, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 8, y - 45 - bob, backView ? 16 : 4, 10);
  if (!backView) { ctx.fillStyle = '#17263a'; ctx.fillRect(x + (left ? -5 : 1), y - 40 - bob, 3, 2); }
  // Kopfhörer
  ctx.strokeStyle = '#101827'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 40 - bob, 10, Math.PI * .88, Math.PI * 2.12); ctx.stroke();
  ctx.fillStyle = '#64e8db'; ctx.fillRect(x + 8, y - 39 - bob, 3, 7);
  sign('MARIA', x, y - 57 - bob, '#f7faff', 12);
  ctx.restore();
}

function drawMiniMap() {
  const c = mini.getContext('2d'), scale = 6.4, off = 14;
  c.clearRect(0, 0, 156, 156);
  c.fillStyle = '#10222c'; c.fillRect(0, 0, 156, 156);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    c.fillStyle = walkable(x, y) ? '#416b70' : '#233a45';
    c.fillRect(off + x * scale, off + y * scale, 5.6, 5.6);
  }
  for (const b of buildings) {
    c.fillStyle = b.color;
    c.fillRect(off + b.a[0] * scale, off + b.a[2] * scale, (b.a[1] - b.a[0] + 1) * scale, (b.a[3] - b.a[2] + 1) * scale);
    c.fillStyle = '#f8e08d';
    c.fillRect(off + b.door[0] * scale, off + b.door[1] * scale, 5.6, 5.6);
  }
  c.fillStyle = '#ffefff'; c.beginPath(); c.arc(off + state.x * scale + 3, off + state.y * scale + 3, 4.5, 0, Math.PI * 2); c.fill();
  c.font = 'bold 10px system-ui'; c.fillStyle = '#9ef5e4'; c.fillText('DISTRICT MAP', 12, 10);
}

function draw() {
  ctx.clearRect(0, 0, 1100, 760);

  // Himmel
  const bg = ctx.createLinearGradient(0, 0, 0, 760);
  bg.addColorStop(0, nightScene ? '#1a3044' : '#6c98a8');
  bg.addColorStop(1, nightScene ? '#07101c' : '#304f5b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1100, 760);

  // Skyline im Hintergrund
  for (let i = 0; i < 30; i++) {
    const x = i * 44 - 15, hh = 45 + random(i, 4) * 125;
    ctx.fillStyle = nightScene ? '#12263a' : '#547685';
    ctx.fillRect(x, 185 - hh, 37, hh);
    if (nightScene) for (let j = 0; j < 5; j++) if (random(i, j) > .48) {
      ctx.fillStyle = '#f2c482';
      ctx.fillRect(x + 8 + (j % 2) * 13, 195 - hh + Math.floor(j / 2) * 19, 4, 6);
    }
  }
  sign('WAREHOUSE DISTRICT', 180, 39, nightScene ? '#a7fff0' : '#eafff8', 19);
  ctx.textAlign = 'left'; ctx.font = '12px system-ui'; ctx.fillStyle = nightScene ? '#8ba9b8' : '#d5e7e9';
  ctx.fillText('CHAPTER 01 · UNDERGROUND PLAZA', 35, 61);

  // Boden: von hinten nach vorne zeichnen
  for (let sum = 0; sum < W + H - 1; sum++) for (let y = 0; y < H; y++) {
    const x = sum - y;
    if (x < 0 || x >= W) continue;
    const on = walkable(x, y), plaza = x >= 8 && x <= 12 && y >= 10 && y <= 15;
    const color = on ? (plaza ? (nightScene ? '#3a5660' : '#72908b') : (nightScene ? '#344755' : '#677d82')) : (nightScene ? '#1a2b36' : '#3b5962');
    diamond(x, y, color, nightScene ? '#47616b' : '#78969b');
    if (on && random(x, y) > .88) { const p = iso(x, y); ctx.fillStyle = nightScene ? '#85a5a8' : '#bacbcb'; ctx.fillRect(p.x - 2, p.y + 13, 4, 2); }
    if (on && y === 8 && x % 3 === 0) { const p = iso(x, y); line(p.x - 8, p.y + 14, p.x + 8, p.y + 14, '#dfc888', 2); }
  }

  // Bäume
  for (const [x, y] of [[9, 12], [11, 14], [16, 13]]) {
    const p = iso(x, y);
    ctx.fillStyle = '#334c50'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 13, 11, 5, 0, 0, 7); ctx.fill();
    line(p.x, p.y + 10, p.x, p.y - 18, '#657f77', 4);
    ctx.fillStyle = '#3c8d77'; ctx.beginPath(); ctx.arc(p.x, p.y - 21, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#65b597'; ctx.beginPath(); ctx.arc(p.x - 5, p.y - 25, 6, 0, 7); ctx.fill();
  }
  // Straßenlaternen
  for (const [x, y] of [[8, 8], [18, 9], [12, 17], [2, 9]]) {
    const p = iso(x, y);
    line(p.x, p.y + 12, p.x, p.y - 42, '#78949e', 3);
    ctx.shadowColor = '#ffe3a3'; ctx.shadowBlur = nightScene ? 25 : 0;
    ctx.fillStyle = nightScene ? '#ffe8a4' : '#e2edf0';
    ctx.beginPath(); ctx.arc(p.x, p.y - 45, 6, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Gebäude und Figuren nach Tiefe sortiert, damit Verdeckungen stimmen
  const objects = [
    ...buildings.map(b => ({ depth: b.a[3] + b.a[1], fn: () => building(b) })),
    { depth: state.x + state.y, fn: player },
    ...livingNPCs.map(n => ({ depth: n.x + n.y, fn: () => drawNPC(n.x, n.y, n.shirt, n.hair) }))
  ];
  objects.sort((a, b) => a.depth - b.depth).forEach(o => o.fn());

  for (const [x, y, t] of [[16, 12, 'GDU'], [17, 15, 'FOOD'], [10, 18, 'METRO']]) {
    const p = iso(x, y);
    sign(t, p.x, p.y + 5, t === 'FOOD' ? '#ffd68b' : '#81f8e5', 11);
  }

  const near = doorHere();
  hint.textContent = near ? '[E] ' + near.name + ' öffnen' : 'WASD / Pfeiltasten: bewegen · E: interagieren';
  updateHUD();
  drawMiniMap();
}

function updateHUD() {
  document.getElementById('money').textContent = state.money + ' €';
  document.getElementById('rep').textContent = state.rep;
  document.getElementById('happy').textContent = state.happy === null ? '–' : state.happy + ' %';
  document.getElementById('parties').textContent = state.parties;
  const steps = [
    ['DJ bei Beat Dealers buchen', state.dj],
    ['Soundanlage bei Vinyl Junky kaufen', state.sound],
    ['Erste Party in Bunker 99 veranstalten', state.completed]
  ];
  document.getElementById('mission').innerHTML =
    steps.map(([t, ok]) => '<div class="' + (ok ? 'done' : 'muted') + '">' + (ok ? '✓' : '○') + ' ' + t + '</div>').join('') +
    (state.completed ? '<p class="done"><b>MISSION GESCHAFFT!</b><br>Dein Underground-Imperium hat begonnen.</p>' : '');
}

/* ---------- 3. Spiellogik ---------- */

const doorHere = () => buildings.find(b => b.door[0] === state.x && b.door[1] === state.y);
const dialogOpen = () => back.classList.contains('open');

function move(dx, dy) {
  if (dialogOpen()) return;
  const x = state.x + dx, y = state.y + dy;
  if (!walkable(x, y)) return;
  state.x = x; state.y = y;
  facing = dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down';
  stride++;
  save();
  draw();
}

function action() {
  if (dialogOpen()) return;
  const b = doorHere();
  if (b) openBuilding(b);
}

function openBuilding(b) {
  if (b.id === 'agency') {
    modal('BEAT DEALERS · DJ-Agentur',
      state.dj
        ? '<p>Dein DJ ist gebucht. Der Bass wartet auf seinen Einsatz.</p>'
        : '<p>DJ <b>DJ Voltage</b> spielt dein erstes Set für <b>' + PRICE_DJ + ' €</b>. Kein Starallüren-Zuschlag. Noch nicht.</p>',
      [
        [state.dj ? 'Bereits gebucht' : 'DJ buchen · ' + PRICE_DJ + ' €', () => {
          if (state.money >= PRICE_DJ && !state.dj) { state.money -= PRICE_DJ; state.dj = true; save(); }
          close(); draw();
        }, state.dj || state.money < PRICE_DJ],
        ['Zurück', close, false, 'secondary']
      ]);
    return;
  }
  if (b.id === 'store') {
    modal('VINYL JUNKY · Plattenladen',
      state.sound
        ? '<p>Die Anlage ist gekauft. Der Nachbar hat schon vorsorglich die Polizei gewählt.</p>'
        : '<p>Gebrauchte Club-Soundanlage für <b>' + PRICE_SOUND + ' €</b>. Funktioniert. Meistens. Garantie endet beim ersten Drop.</p>',
      [
        [state.sound ? 'Bereits gekauft' : 'Soundanlage kaufen · ' + PRICE_SOUND + ' €', () => {
          if (state.money >= PRICE_SOUND && !state.sound) { state.money -= PRICE_SOUND; state.sound = true; save(); }
          close(); draw();
        }, state.sound || state.money < PRICE_SOUND],
        ['Zurück', close, false, 'secondary']
      ]);
    return;
  }
  club();
}

function club() {
  const ready = state.dj && state.sound;
  const html =
    '<p>Willkommen im <b>BUNKER 99</b>. DJ gebucht: ' + (state.dj ? 'Ja' : 'Nein') + ' · Anlage: ' + (state.sound ? 'Ja' : 'Nein') + '</p>' +
    '<label for="entry">Eintrittspreis: <strong id="entryValue">' + state.entry + ' €</strong></label>' +
    '<input type="range" id="entry" min="5" max="25" value="' + state.entry + '">' +
    '<p>Veranstaltungskosten: <b>' + PARTY_COST + ' €</b>. Die Gästezahl hängt vom Eintrittspreis ab. DJ und Sound müssen vorher organisiert werden.</p>' +
    '<p class="pill">Verfügbares Kapital: ' + state.money + ' €</p>';

  modal('BUNKER 99 · Party Planner', html, [
    ['PARTY STARTEN', startParty, !ready || state.money < PARTY_COST],
    ['Schließen', close, false, 'secondary']
  ]);

  const slider = document.getElementById('entry');
  slider.addEventListener('input', () => {
    document.getElementById('entryValue').textContent = slider.value + ' €';
    state.entry = Number(slider.value);
    save();
  });
}

function startParty() {
  if (!(state.dj && state.sound) || state.money < PARTY_COST) return;
  const price = Number(document.getElementById('entry').value);
  state.entry = price;
  const guests = Math.max(12, Math.round(82 - (price - 10) * 4));
  const revenue = guests * price;
  const gain = Math.max(1, Math.round(guests / 9));
  state.money += revenue - PARTY_COST;
  state.rep += gain;
  state.happy = Math.max(15, Math.min(100, 100 - Math.abs(price - 10) * 5));
  state.parties++;
  state.completed = true;
  save();
  draw();
  modal('PARTY GESCHAFFT!',
    `<p><b>${guests} Gäste</b> haben Bunker 99 besucht.</p>` +
    `<p>Ticketumsatz: <b>${revenue} €</b><br>Eventkosten: <b>${PARTY_COST} €</b><br>Eventergebnis: <b>+${revenue - PARTY_COST} €</b><br>Ruf: <b>+${gain}</b></p>` +
    `<p>Deine erste Mission ist abgeschlossen. Willkommen im Underground-Imperium.</p>`,
    [['Weiterfeiern', close, false]]);
}

/* ---------- 4. Dialogfenster ---------- */

let returnFocus = null;  // Element, das nach dem Schließen wieder den Fokus bekommt

function modal(title, html, actions) {
  if (!dialogOpen()) returnFocus = document.activeElement;
  document.getElementById('dialogTitle').textContent = title;
  document.getElementById('dialogContent').innerHTML = html;
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
  // Fokus in den Dialog setzen: erster aktiver Button, sonst der Regler
  const target = bar.querySelector('button:not(:disabled)') || back.querySelector('input');
  if (target) target.focus();
}

function close() {
  if (!dialogOpen()) return;
  back.classList.remove('open');
  if (returnFocus && document.contains(returnFocus) && returnFocus !== document.body) returnFocus.focus();
  returnFocus = null;
}

// Tab-Taste bleibt innerhalb des offenen Dialogs
function trapFocus(e) {
  const items = [...back.querySelectorAll('button:not(:disabled), input')];
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- 5. Eingabe und Start ---------- */

const moves = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
let lastMove = 0;

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();

  // Bei offenem Dialog: Esc schließt, Tab bleibt im Dialog, alles andere (Enter, Leertaste, Regler) arbeitet normal
  if (dialogOpen()) {
    if (key === 'escape') close();
    else if (key === 'tab') trapFocus(e);
    return;
  }

  const onControl = e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT';
  if (key in moves) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastMove > 85) { move(...moves[key]); lastMove = now; }
  } else if (key === 'e' || (key === 'enter' && !onControl)) {
    // Enter auf einem fokussierten Button soll diesen Button auslösen, nicht das Gebäude
    e.preventDefault();
    action();
  }
});

document.querySelectorAll('[data-move]').forEach(btn =>
  btn.addEventListener('click', () => move(...moves[{ up: 'w', down: 's', left: 'a', right: 'd' }[btn.dataset.move]])));
document.getElementById('touchE').addEventListener('click', action);
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Spielstand wirklich zurücksetzen?')) { state = initial(); facing = 'down'; stride = 0; save(); draw(); }
});
document.getElementById('lightMode').addEventListener('click', () => { nightScene = !nightScene; draw(); });
back.addEventListener('click', e => { if (e.target === back) close(); });

// Passanten bewegen sich etwa jede Sekunde (pausiert bei offenem Dialog oder verstecktem Tab)
function ambientStep() {
  if (dialogOpen() || document.hidden) return;
  for (const n of livingNPCs) {
    const choices = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
    const [dx, dy] = choices[Math.floor(Math.random() * choices.length)];
    const nx = n.x + dx, ny = n.y + dy;
    if (walkable(nx, ny) && Math.abs(nx - n.home[0]) <= 4 && Math.abs(ny - n.home[1]) <= 4 && !(nx === state.x && ny === state.y)) {
      n.x = nx; n.y = ny;
    }
  }
  draw();
}
setInterval(ambientStep, 950);

draw();
