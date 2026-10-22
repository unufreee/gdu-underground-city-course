/* GDU Underground City – Die Stadt (Zentrale)
   Isometrische Karte des Warehouse District, Spielfigur, Passanten und Minikarte.
   Jedes Gebäude hat einen Eingang, der zu einem Ort bzw. Minispiel führt. */
'use strict';

window.GDU = window.GDU || {};

const W = 20, H = 20;            // Kartengröße in Feldern
const TW = 56, TH = 28;          // Breite/Höhe eines isometrischen Feldes in Pixel
const OX = 550, OY = 76;         // Ursprung der Karte auf dem Canvas

GDU.buildings = [
  { id: 'agency', name: 'BEAT DEALERS', subtitle: 'DJ-AGENTUR',   a: [2, 7, 2, 6],   door: [5, 7],  color: '#bf527e', height: 48 },
  { id: 'store',  name: 'VINYL JUNKY',  subtitle: 'PLATTENLADEN', a: [12, 17, 2, 6], door: [14, 7], color: '#b48b4d', height: 35 },
  { id: 'club',   name: 'BUNKER 99',    subtitle: 'CLUB',         a: [2, 7, 11, 17], door: [5, 10], color: '#6657a8', height: 63 }
];

// Begehbare Wege: Straßen, Plaza und Zugänge
const paths = new Set();
const addPath = (x, y) => { if (x >= 0 && y >= 0 && x < W && y < H) paths.add(x + ',' + y); };
for (let y = 7; y <= 10; y++) for (let x = 1; x <= 18; x++) addPath(x, y);
for (let y = 10; y <= 17; y++) for (let x = 8; x <= 12; x++) addPath(x, y);
for (let y = 10; y <= 17; y++) for (let x = 13; x <= 18; x++) addPath(x, y);
for (let y = 18; y <= 19; y++) for (let x = 1; x <= 18; x++) addPath(x, y);
for (let y = 0; y <= 1; y++) for (let x = 8; x <= 11; x++) addPath(x, y);

const inside = (x, y, b) => x >= b.a[0] && x <= b.a[1] && y >= b.a[2] && y <= b.a[3];
GDU.walkable = (x, y) => paths.has(x + ',' + y) && !GDU.buildings.some(b => inside(x, y, b));
GDU.doorHere = () => GDU.buildings.find(b => b.door[0] === GDU.state.x && b.door[1] === GDU.state.y);
if (!GDU.walkable(GDU.state.x, GDU.state.y)) { GDU.state.x = 10; GDU.state.y = 12; }

// Passanten, die sich zufällig in der Nähe ihres Startpunkts bewegen
GDU.npcs = [
  { x: 13, y: 9,  shirt: '#eb8f62', hair: '#24232c', home: [13, 9] },
  { x: 17, y: 16, shirt: '#63b6bb', hair: '#1e2333', home: [17, 16] },
  { x: 9,  y: 16, shirt: '#d57ac8', hair: '#322b39', home: [9, 16] },
  { x: 8,  y: 8,  shirt: '#b7d87a', hair: '#3a2534', home: [8, 8] }
];

GDU.view = { night: true, facing: 'down', stride: 0 };

/* ---------- Zeichenwerkzeuge ---------- */

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const mini = document.getElementById('minimap');
const hint = document.getElementById('hint');

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
  ctx.shadowBlur = GDU.view.night ? 18 : 3;
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

/* ---------- Gebäude und Figuren ---------- */

function building(b) {
  const night = GDU.view.night;
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
      neonWindow(px, py - h + 17 + row * 16, night && ((i + row) % 3 !== 0));
      neonWindow(qx, qy - h + 17 + row * 16, night && ((i + row + 1) % 3 !== 0));
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
      ctx.shadowColor = '#fa48c2'; ctx.shadowBlur = night ? 18 : 0;
      ctx.fillStyle = '#ef4aa9'; ctx.fillRect(sx, mid.y - h - 9, 18, 3);
      ctx.shadowBlur = 0;
    }
  }

  // Eingang mit E-Markierung
  const d = iso(...b.door);
  diamond(...b.door, night ? '#076e72' : '#438d86', '#b8fff0');
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#f6ffff'; ctx.fillText('E', d.x, d.y + 18); ctx.restore();

  // Name und Untertitel
  sign(b.name, mid.x, mid.y - h + 21, b.id === 'club' ? '#ff71ce' : b.id === 'agency' ? '#ffb06e' : '#f7d77b', 14);
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#e3eef5'; ctx.fillText(b.subtitle, mid.x, mid.y - h + 35); ctx.restore();

  if (b.id === 'club') { // Warteschlange: wird mit dem Ruf des Clubs länger
    const q = iso(6, 10);
    const people = 3 + Math.min(5, Math.floor(GDU.state.rep / 5));
    const colors = ['#da83aa', '#80b6c8', '#b9a0e4', '#e6c27a', '#8fd6a8'];
    for (let i = 0; i < people; i++) {
      const xx = q.x + 13 * i - (i > 3 ? 52 : 0), yy = q.y + (i > 3 ? 9 : 0);
      ctx.fillStyle = '#111a27'; ctx.beginPath(); ctx.arc(xx, yy - 5, 3, 0, 7); ctx.fill();
      ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(xx - 3, yy - 1, 6, 8);
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
  const { facing, stride } = GDU.view;
  const p = iso(GDU.state.x, GDU.state.y), x = p.x, y = p.y + TH / 2;
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
    c.fillStyle = GDU.walkable(x, y) ? '#416b70' : '#233a45';
    c.fillRect(off + x * scale, off + y * scale, 5.6, 5.6);
  }
  for (const b of GDU.buildings) {
    c.fillStyle = b.color;
    c.fillRect(off + b.a[0] * scale, off + b.a[2] * scale, (b.a[1] - b.a[0] + 1) * scale, (b.a[3] - b.a[2] + 1) * scale);
    c.fillStyle = '#f8e08d';
    c.fillRect(off + b.door[0] * scale, off + b.door[1] * scale, 5.6, 5.6);
  }
  c.fillStyle = '#ffefff'; c.beginPath(); c.arc(off + GDU.state.x * scale + 3, off + GDU.state.y * scale + 3, 4.5, 0, Math.PI * 2); c.fill();
  c.font = 'bold 10px system-ui'; c.fillStyle = '#9ef5e4'; c.fillText('DISTRICT MAP', 12, 10);
}

/* ---------- Gesamtbild ---------- */

GDU.draw = () => {
  const night = GDU.view.night, s = GDU.state;
  ctx.clearRect(0, 0, 1100, 760);

  // Himmel
  const bg = ctx.createLinearGradient(0, 0, 0, 760);
  bg.addColorStop(0, night ? '#1a3044' : '#6c98a8');
  bg.addColorStop(1, night ? '#07101c' : '#304f5b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1100, 760);

  // Skyline im Hintergrund
  for (let i = 0; i < 30; i++) {
    const x = i * 44 - 15, hh = 45 + random(i, 4) * 125;
    ctx.fillStyle = night ? '#12263a' : '#547685';
    ctx.fillRect(x, 185 - hh, 37, hh);
    if (night) for (let j = 0; j < 5; j++) if (random(i, j) > .48) {
      ctx.fillStyle = '#f2c482';
      ctx.fillRect(x + 8 + (j % 2) * 13, 195 - hh + Math.floor(j / 2) * 19, 4, 6);
    }
  }
  sign('WAREHOUSE DISTRICT', 180, 39, night ? '#a7fff0' : '#eafff8', 19);
  ctx.textAlign = 'left'; ctx.font = '12px system-ui'; ctx.fillStyle = night ? '#8ba9b8' : '#d5e7e9';
  ctx.fillText('CHAPTER 01 · UNDERGROUND PLAZA', 35, 61);

  // Boden: von hinten nach vorne zeichnen
  for (let sum = 0; sum < W + H - 1; sum++) for (let y = 0; y < H; y++) {
    const x = sum - y;
    if (x < 0 || x >= W) continue;
    const on = GDU.walkable(x, y), plaza = x >= 8 && x <= 12 && y >= 10 && y <= 15;
    const color = on ? (plaza ? (night ? '#3a5660' : '#72908b') : (night ? '#344755' : '#677d82')) : (night ? '#1a2b36' : '#3b5962');
    diamond(x, y, color, night ? '#47616b' : '#78969b');
    if (on && random(x, y) > .88) { const p = iso(x, y); ctx.fillStyle = night ? '#85a5a8' : '#bacbcb'; ctx.fillRect(p.x - 2, p.y + 13, 4, 2); }
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
    ctx.shadowColor = '#ffe3a3'; ctx.shadowBlur = night ? 25 : 0;
    ctx.fillStyle = night ? '#ffe8a4' : '#e2edf0';
    ctx.beginPath(); ctx.arc(p.x, p.y - 45, 6, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Gebäude und Figuren nach Tiefe sortiert, damit Verdeckungen stimmen
  const objects = [
    ...GDU.buildings.map(b => ({ depth: b.a[3] + b.a[1], fn: () => building(b) })),
    { depth: s.x + s.y, fn: player },
    ...GDU.npcs.map(n => ({ depth: n.x + n.y, fn: () => drawNPC(n.x, n.y, n.shirt, n.hair) }))
  ];
  objects.sort((a, b) => a.depth - b.depth).forEach(o => o.fn());

  for (const [x, y, t] of [[16, 12, 'GDU'], [17, 15, 'FOOD'], [10, 18, 'METRO']]) {
    const p = iso(x, y);
    sign(t, p.x, p.y + 5, t === 'FOOD' ? '#ffd68b' : '#81f8e5', 11);
  }

  const near = GDU.doorHere();
  hint.textContent = near ? '[E] ' + near.name + ' betreten' : 'WASD / Pfeiltasten: bewegen · E: interagieren';
  GDU.updateHUD();
  drawMiniMap();
};

/* ---------- Bewegung ---------- */

GDU.move = (dx, dy) => {
  if (GDU.dialogOpen()) return;
  const s = GDU.state, x = s.x + dx, y = s.y + dy;
  if (!GDU.walkable(x, y)) return;
  s.x = x; s.y = y;
  GDU.view.facing = dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down';
  GDU.view.stride++;
  GDU.save();
  GDU.draw();
};

// Passanten bewegen sich etwa jede Sekunde (pausiert bei offenem Dialog oder verstecktem Tab)
GDU.ambientStep = () => {
  if (GDU.dialogOpen() || document.hidden) return;
  for (const n of GDU.npcs) {
    const choices = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
    const [dx, dy] = choices[Math.floor(Math.random() * choices.length)];
    const nx = n.x + dx, ny = n.y + dy;
    if (GDU.walkable(nx, ny) && Math.abs(nx - n.home[0]) <= 4 && Math.abs(ny - n.home[1]) <= 4 && !(nx === GDU.state.x && ny === GDU.state.y)) {
      n.x = nx; n.y = ny;
    }
  }
  GDU.draw();
};
