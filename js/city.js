/* GDU Underground City – Die Stadt (Zentrale)
   Isometrische Karte des Warehouse District, Spielfigur, Passanten und Minikarte.
   Jedes Gebäude hat einen Eingang, der zu einem Ort bzw. Minispiel führt. */
'use strict';

window.GDU = window.GDU || {};

const W = 20, H = 20;            // Kartengröße in Feldern
const TW = 56, TH = 28;          // Breite/Höhe eines isometrischen Feldes in Pixel
const OX = 550, OY = 76;         // Ursprung der Karte auf dem Canvas

/* ---------- Bezirke ----------
   Chapter 01: Warehouse District · Chapter 02: Hafen (nach dem ersten Saisonsieg per Metro erreichbar).
   Jeder Bezirk hat Gebäude, begehbare Wege, Deko und Passanten. Die Metro-Station verbindet sie. */
const pathSet = (...rects) => {
  const set = new Set();
  for (const [x1, x2, y1, y2] of rects) for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (x >= 0 && y >= 0 && x < W && y < H) set.add(x + ',' + y);
  return set;
};

GDU.DISTRICTS = {
  warehouse: {
    title: 'WAREHOUSE DISTRICT', sub: 'CHAPTER 01 · UNDERGROUND PLAZA', start: [10, 12],
    buildings: [
      { id: 'agency', name: 'BEAT DEALERS', subtitle: 'DJ-AGENTUR',   a: [2, 7, 2, 6],   door: [5, 7],  color: '#bf527e', height: 48 },
      { id: 'store',  name: 'VINYL JUNKY',  subtitle: 'PLATTENLADEN', a: [12, 17, 2, 6], door: [14, 7], color: '#b48b4d', height: 35 },
      { id: 'club',   name: 'BUNKER 99',    subtitle: 'CLUB',         a: [2, 7, 11, 17], door: [5, 10], color: '#6657a8', height: 63 },
      { id: 'metro',  name: 'METRO',        subtitle: 'U9 → HAFEN',   stop: true,        door: [16, 18], color: '#2f7fd8' }
    ],
    paths: pathSet([1, 18, 7, 10], [8, 12, 10, 17], [13, 18, 10, 17], [1, 18, 18, 19], [8, 11, 0, 1]),
    plaza: (x, y) => x >= 8 && x <= 12 && y >= 10 && y <= 15,
    trees: [[9, 12], [11, 14], [16, 13]],
    lamps: [[8, 8], [18, 9], [12, 17], [2, 9]],
    signs: [[16, 12, 'GDU', '#81f8e5'], [17, 15, 'FOOD', '#ffd68b']],
    npcs: [
      { x: 13, y: 9,  shirt: '#eb8f62', hair: '#24232c', home: [13, 9] },
      { x: 17, y: 16, shirt: '#63b6bb', hair: '#1e2333', home: [17, 16] },
      { x: 9,  y: 16, shirt: '#d57ac8', hair: '#322b39', home: [9, 16] },
      { x: 8,  y: 8,  shirt: '#b7d87a', hair: '#3a2534', home: [8, 8] }
    ]
  },
  harbor: {
    title: 'HAFEN', sub: 'CHAPTER 02 · PIER & KRÄNE', start: [10, 11],
    buildings: [
      { id: 'radio',  name: 'RADIO HAFENFUNK', subtitle: 'SENDER 99,9',        a: [2, 6, 2, 6],    door: [4, 7],   color: '#3f6f8f', height: 70 },
      { id: 'lounge', name: 'KRAN-LOUNGE',     subtitle: 'HEADLINER-BOOKING',  a: [12, 17, 2, 6],  door: [14, 7],  color: '#a15a3c', height: 44 },
      { id: 'pier',   name: 'PIER 7',          subtitle: 'OPEN AIR',           a: [12, 17, 10, 12], door: [14, 13], color: '#2c5d6e', height: 14 },
      { id: 'metro',  name: 'METRO',           subtitle: 'U9 → WAREHOUSE',     stop: true,          door: [10, 10], color: '#2f7fd8' }
    ],
    paths: pathSet([1, 18, 7, 9], [8, 11, 9, 14], [1, 18, 13, 14], [9, 10, 15, 18], [8, 11, 0, 1]),
    plaza: (x, y) => y >= 13 && y <= 14,                     // Kai
    water: (x, y) => y >= 15 && !(x >= 9 && x <= 10 && y <= 18),
    planks: (x, y) => x >= 9 && x <= 10 && y >= 15 && y <= 18,
    containers: [[1, 10, '#b5473a'], [2, 10, '#2f7fd8'], [1, 11, '#d9a441'], [3, 11, '#3d9a6b'], [5, 10, '#b5473a'], [6, 11, '#2f7fd8'], [4, 12, '#d9a441']],
    cranes: [[3, 16], [6, 18], [18, 17]],
    trees: [],
    lamps: [[4, 13], [16, 14], [11, 8], [2, 8]],
    signs: [[7, 14, 'KAI 7', '#81f8e5'], [17, 8, 'FISCH', '#ffd68b']],
    npcs: [
      { x: 5,  y: 8,  shirt: '#5aa6d6', hair: '#2a2420', home: [5, 8] },
      { x: 16, y: 13, shirt: '#e0764f', hair: '#1e2333', home: [16, 13] },
      { x: 9,  y: 12, shirt: '#c9c95a', hair: '#322b39', home: [9, 12] }
    ]
  }
};

GDU.district = () => GDU.DISTRICTS[GDU.state.district] || GDU.DISTRICTS.warehouse;
GDU.buildings = [];
GDU.npcs = [];
let paths = new Set();

// Bezirk aktivieren (beim Start und nach jeder Metro-Fahrt)
GDU.enterDistrict = id => {
  const s = GDU.state;
  if (!GDU.DISTRICTS[id] || (id === 'harbor' && !s.harbor)) id = 'warehouse';
  s.district = id;
  const d = GDU.DISTRICTS[id];
  GDU.buildings = d.buildings;
  GDU.npcs = d.npcs.map(n => ({ ...n }));
  paths = d.paths;
  if (!GDU.walkable(s.x, s.y)) { s.x = d.start[0]; s.y = d.start[1]; }
};

const inside = (x, y, b) => !b.stop && x >= b.a[0] && x <= b.a[1] && y >= b.a[2] && y <= b.a[3];
GDU.walkable = (x, y) => paths.has(x + ',' + y) && !GDU.buildings.some(b => inside(x, y, b));
GDU.doorHere = () => GDU.buildings.find(b => b.door[0] === GDU.state.x && b.door[1] === GDU.state.y);

GDU.view = { night: true, facing: 'down', stride: 0, t: 0 };   // t = Animationszeit in Sekunden
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  // Neon „atmet“ leicht (kein Blinken)
  const breathe = REDUCED ? 1 : 0.8 + 0.2 * Math.sin(GDU.view.t * 2.1 + x * 0.05);
  ctx.shadowBlur = GDU.view.night ? 18 * breathe : 3;
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

// Farben je Gebäude: linke Fassade, rechte Fassade, Dach, Leuchtschrift
const STYLE = {
  club:   { l: '#25243d', r: '#303646', roof: '#514064', sign: '#ff71ce' },
  agency: { l: '#423944', r: '#303646', roof: '#79516a', sign: '#ffb06e' },
  store:  { l: '#423944', r: '#54443a', roof: '#806744', sign: '#f7d77b' },
  radio:  { l: '#26394a', r: '#1f2f3d', roof: '#3f6f8f', sign: '#7fd8ff' },
  lounge: { l: '#4a2f2a', r: '#3a2622', roof: '#8a4a32', sign: '#ffb36b' }
};

// Metro-Station: Eingang mit U-Schild
function metroStop(b) {
  const night = GDU.view.night, d = iso(...b.door);
  diamond(...b.door, night ? '#0f3d78' : '#3d73b8', '#9cc8ff');
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#f6ffff'; ctx.fillText('E', d.x, d.y + 18); ctx.restore();
  line(d.x + 34, d.y + 12, d.x + 34, d.y - 40, '#9ab3bc', 3);
  ctx.fillStyle = '#2f7fd8'; ctx.fillRect(d.x + 22, d.y - 64, 24, 24);
  ctx.fillStyle = '#fff'; ctx.font = '900 18px system-ui'; ctx.textAlign = 'center'; ctx.fillText('U', d.x + 34, d.y - 45);
  const locked = GDU.state.district === 'warehouse' && !GDU.state.harbor;
  sign(b.subtitle, d.x + 34, d.y - 72, locked ? '#8ba9b8' : '#9cc8ff', 11);
  if (locked) { ctx.save(); ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#c1d2df'; ctx.fillText('🔒 ab dem ersten Saisonsieg', d.x + 34, d.y - 86); ctx.restore(); }
}

// Pier 7: flache Open-Air-Bühne am Wasser mit Traversen und Boxentürmen
function pierStage(b) {
  const night = GDU.view.night, [x1, x2, y1, y2] = b.a, h = b.height;
  const A = iso(x1, y1), R = iso(x2 + 1, y1), B = iso(x2 + 1, y2 + 1), L = iso(x1, y2 + 1), up = p => [p.x, p.y - h];
  poly([[L.x, L.y], [B.x, B.y], up(B), up(L)], '#2a3440', '#111925');
  poly([[B.x, B.y], [R.x, R.y], up(R), up(B)], '#222b36', '#111925');
  poly([up(A), up(R), up(B), up(L)], night ? '#3b4a58' : '#6a7c8a', '#9cbdc0');
  const mid = iso((x1 + x2 + 1) / 2, (y1 + y2 + 1) / 2), top = mid.y - h;
  // Traverse
  ctx.strokeStyle = '#9ab3bc'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(mid.x - 60, top + 10); ctx.lineTo(mid.x - 60, top - 60); ctx.lineTo(mid.x + 60, top - 70); ctx.lineTo(mid.x + 60, top); ctx.stroke();
  for (const sx of [-48, 48]) { ctx.fillStyle = '#121620'; ctx.fillRect(mid.x + sx - 9, top - 34, 18, 32); }
  const used = GDU.state.pierUsed === GDU.state.season;
  if (night && !used) {   // Scheinwerfer, solange die Open-Air-Nacht noch aussteht
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i - 1) * 0.5 + (REDUCED ? 0 : Math.sin(GDU.view.t * 0.6 + i) * 0.2);
      const g = ctx.createLinearGradient(mid.x, top - 64, mid.x + Math.cos(a) * 140, top - 64 + Math.sin(a) * 140);
      g.addColorStop(0, i === 1 ? 'rgba(255,45,149,0.45)' : 'rgba(0,229,195,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(mid.x, top - 64); ctx.lineTo(mid.x + Math.cos(a) * 140, top - 64 + Math.sin(a) * 140); ctx.stroke();
    }
    ctx.restore();
  }
  const d = iso(...b.door);
  diamond(...b.door, night ? '#076e72' : '#438d86', '#b8fff0');
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#f6ffff'; ctx.fillText('E', d.x, d.y + 18); ctx.restore();
  sign(b.name, mid.x, top - 76, '#7fffd4', 16);
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#e3eef5'; ctx.fillText(used ? 'DIESE SAISON SCHON GEFEIERT' : b.subtitle, mid.x, top - 62 + 0); ctx.restore();
}

function building(b) {
  if (b.stop) return metroStop(b);
  if (b.id === 'pier') return pierStage(b);
  const night = GDU.view.night, st = STYLE[b.id] || STYLE.store;
  const level = b.id === 'club' ? (GDU.state.club || 0) : 0;   // Club-Ausbau: Bunker 99 wird höher
  const [x1, x2, y1, y2] = b.a, h = b.height + level * 16;
  const A = iso(x1, y1), R = iso(x2 + 1, y1), B = iso(x2 + 1, y2 + 1), L = iso(x1, y2 + 1);
  const up = p => [p.x, p.y - h];

  // Fassaden
  poly([[L.x, L.y], [B.x, B.y], up(B), up(L)], st.l, '#111925');
  poly([[B.x, B.y], [R.x, R.y], up(R), up(B)], st.r, '#111925');
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const px = L.x + (B.x - L.x) * t, py = L.y + (B.y - L.y) * t;
    const qx = B.x + (R.x - B.x) * t, qy = B.y + (R.y - B.y) * t;
    for (let row = 0; row < 2 + level; row++) {
      neonWindow(px, py - h + 17 + row * 16, night && ((i + row) % 3 !== 0));
      neonWindow(qx, qy - h + 17 + row * 16, night && ((i + row + 1) % 3 !== 0));
    }
  }

  // Dach mit Oberlicht und Lüftung
  poly([up(A), up(R), up(B), up(L)], st.roof, '#bed0d2');
  const mid = iso((x1 + x2 + 1) / 2, (y1 + y2 + 1) / 2);
  poly([[mid.x - 33, mid.y - h - 10], [mid.x + 4, mid.y - h - 20], [mid.x + 34, mid.y - h - 7], [mid.x - 4, mid.y - h + 3]], '#20313d', '#9cbdc0');
  rooftopVent(mid.x + 20, mid.y - h + 3);

  if (b.id === 'agency') { // Satellitenschüssel
    line(mid.x - 33, mid.y - h - 9, mid.x - 33, mid.y - h - 39, '#9ab3bc', 3);
    ctx.strokeStyle = '#c6e4e9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(mid.x - 33, mid.y - h - 39, 13, 5, -.3, 0, Math.PI * 2); ctx.stroke();
  }
  if (b.id === 'radio') {   // Sendemast mit rotem Warnlicht
    line(mid.x - 30, mid.y - h - 6, mid.x - 30, mid.y - h - 70, '#9ab3bc', 3);
    line(mid.x - 40, mid.y - h - 6, mid.x - 30, mid.y - h - 70, '#9ab3bc', 1.5);
    line(mid.x - 20, mid.y - h - 6, mid.x - 30, mid.y - h - 70, '#9ab3bc', 1.5);
    const glow = REDUCED ? 1 : 0.55 + 0.45 * Math.sin(GDU.view.t * 2.4);
    ctx.save(); ctx.shadowColor = '#ff4040'; ctx.shadowBlur = 14 * glow; ctx.fillStyle = 'rgba(255,70,70,' + (0.5 + 0.5 * glow) + ')';
    ctx.beginPath(); ctx.arc(mid.x - 30, mid.y - h - 72, 4, 0, 7); ctx.fill(); ctx.restore();
  }
  if (b.id === 'lounge') {   // kleiner Kranausleger auf dem Dach
    line(mid.x - 20, mid.y - h - 4, mid.x - 20, mid.y - h - 46, '#d9a441', 4);
    line(mid.x - 34, mid.y - h - 46, mid.x + 40, mid.y - h - 56, '#d9a441', 4);
    line(mid.x + 30, mid.y - h - 55, mid.x + 30, mid.y - h - 30, '#9ab3bc', 1);
    ctx.fillStyle = '#d9a441'; ctx.fillRect(mid.x + 24, mid.y - h - 30, 12, 8);
  }
  if (b.id === 'club' && level >= 2) {   // Dachterrasse: Lichterketten
    for (let k = 0; k < 9; k++) {
      const px = A.x + (R.x - A.x) * (k / 8), py = A.y + (R.y - A.y) * (k / 8) - h - 6 + Math.sin(k) * 2;
      ctx.fillStyle = night ? ['#ffd68b', '#ff8fc4', '#7fffd4'].at(k % 3) : '#e3eef5'; ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 7); ctx.fill();
    }
  }
  if (b.id === 'club' && level >= 3) sign('VIP', mid.x + 44, mid.y - h - 18, '#f7d77b', 13);
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
  sign(b.name, mid.x, mid.y - h + 21, st.sign, b.name.length > 12 ? 12 : 14);
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#e3eef5'; ctx.fillText(b.subtitle, mid.x, mid.y - h + 35); ctx.restore();

  if (b.id === 'club' && GDU.view.night && GDU.state.gear.light && !GDU.state.over) {   // Lichtshow gekauft: Laser über dem Bunker
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.32 + (REDUCED ? 0 : Math.sin(GDU.view.t * 0.8 + i * 1.3) * 0.25);
      const g = ctx.createLinearGradient(mid.x, mid.y - h - 8, mid.x + Math.cos(a) * 260, mid.y - h - 8 + Math.sin(a) * 260);
      g.addColorStop(0, i % 2 ? 'rgba(0,229,195,0.75)' : 'rgba(255,45,149,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(mid.x, mid.y - h - 8); ctx.lineTo(mid.x + Math.cos(a) * 260, mid.y - h - 8 + Math.sin(a) * 260); ctx.stroke();
    }
    ctx.restore();
  }
  if (b.id === 'club' && GDU.state.gear.fog) {   // Nebelmaschine gekauft: Nebel quillt aus der Tür
    const dp = iso(...b.door);
    for (let i = 0; i < 4; i++) {
      const k = REDUCED ? i / 4 : ((GDU.view.t * 0.25 + i / 4) % 1);
      const g = ctx.createRadialGradient(dp.x - 20 * k, dp.y - 10 - 30 * k, 0, dp.x - 20 * k, dp.y - 10 - 30 * k, 26 + 30 * k);
      g.addColorStop(0, 'rgba(190,180,230,' + (0.12 * (1 - k)) + ')'); g.addColorStop(1, 'rgba(190,180,230,0)');
      ctx.fillStyle = g; ctx.fillRect(dp.x - 90, dp.y - 110, 180, 150);
    }
  }
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
  const D = GDU.district();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    c.fillStyle = D.water && D.water(x, y) ? '#123a55' : GDU.walkable(x, y) ? '#416b70' : '#233a45';
    c.fillRect(off + x * scale, off + y * scale, 5.6, 5.6);
  }
  for (const b of GDU.buildings) {
    c.fillStyle = b.color;
    if (!b.stop) c.fillRect(off + b.a[0] * scale, off + b.a[2] * scale, (b.a[1] - b.a[0] + 1) * scale, (b.a[3] - b.a[2] + 1) * scale);
    c.fillStyle = b.stop ? '#5fb0ff' : '#f8e08d';
    c.fillRect(off + b.door[0] * scale, off + b.door[1] * scale, 5.6, 5.6);
  }
  c.fillStyle = '#ffefff'; c.beginPath(); c.arc(off + GDU.state.x * scale + 3, off + GDU.state.y * scale + 3, 4.5, 0, Math.PI * 2); c.fill();
  c.font = 'bold 10px system-ui'; c.fillStyle = '#9ef5e4'; c.fillText(GDU.state.district === 'harbor' ? 'HAFEN' : 'DISTRICT MAP', 12, 10);
}

/* ---------- Sprechende Passanten ----------
   Steht Maria direkt neben einem Passanten, sagt er etwas: Sprüche und versteckte Tipps zum Abend. */
GDU.chatter = () => {
  const s = GDU.state, t = GDU.trend(s.trend), lines = [
    'Heute schon im Bunker 99 gewesen?',
    'Bei Vinyl Junky gibt\'s neue Kisten. Aber nur, wenn du weißt, was dein DJ spielt.',
    'Wer an der Tür Betrunkene reinlässt, hat drinnen Ärger. Weiß doch jeder.',
    'Nova Black legt nur in Clubs mit Ruf auf. Ab 20 oder so.',
    'Ab 13 Euro Eintritt meckern die Leute. Ist halt so.',
    'Lichtshow plus Nebel … ich sag nur: Gänsehaut.',
    'Die letzte Bahn fährt um 0:47. Danach gehört die Stadt uns.'
  ];
  if (t.genre) lines.push(t.title + '! Heute will jeder ' + t.genre + ' hören.', 'Wer heute keinen ' + t.genre + '-DJ bucht, ist selber schuld.');
  if (t.id === 'rain') lines.push('Bei dem Regen? Nur für richtig gute Musik.');
  if (t.id === 'rival') lines.push('Alle reden vom Hafenfestival. Wird hart heute.');
  if (s.rep >= 15) lines.push('Die Schlange vor Bunker 99 wird immer länger …');
  if (s.lastHappy !== null && s.lastHappy >= 80) lines.push('Letzte Nacht im Bunker war der Wahnsinn!');
  if (s.lastHappy !== null && s.lastHappy < 45) lines.push('Letzte Nacht im Bunker? Na ja … war schon mal besser.');
  if (!s.gear.sound) lines.push('Ein Club ohne Anlage? Frag mal bei Vinyl Junky.');
  if (s.harbor && s.district === 'warehouse') lines.push('Am Hafen soll es eine Open-Air-Bühne geben. Pier 7 oder so.');
  if (!s.harbor) lines.push('Die U9 fährt zum Hafen. Aber nur für Leute, die eine Saison gerockt haben.');
  if ((s.club || 0) === 0 && s.money > 900) lines.push('Bunker 99 platzt aus allen Nähten. Mal über einen Ausbau nachgedacht?');
  if (s.district === 'harbor') return [
    'Willkommen am Hafen. Hier riecht die Nacht nach Salz und Diesel.',
    'In der Kran-Lounge buchen sie die richtig großen Namen.',
    'Rostrot hat mal ein Set auf einem Kran gespielt. Fünf Stunden, ohne Pause.',
    'Open Air am Pier 7 ist der Wahnsinn. Außer es regnet.',
    'Radio Hafenfunk hört hier jeder. Ein Spot da wirkt Wunder.',
    'Mila Tiefgang? Deren Fans kommen sogar mit der Fähre.',
    ...(t.id === 'rain' ? ['Bei dem Wetter würde ich heute kein Open Air machen.'] : ['Klare Nacht heute. Perfekt für den Pier.'])
  ];
  return lines;
};

function speechBubble(n) {
  const p = iso(n.x, n.y), lines = GDU.chatter();
  const text = lines.at(n.say % lines.length);
  // Zeilenumbruch nach etwa 28 Zeichen
  const words = text.split(' '), rows = [];
  let row = '';
  for (const w of words) { if ((row + ' ' + w).trim().length > 28) { rows.push(row.trim()); row = w; } else row += ' ' + w; }
  rows.push(row.trim());
  ctx.save();
  ctx.font = '600 12px system-ui';
  const wMax = Math.max(...rows.map(r => ctx.measureText(r).width)) + 20, hBox = rows.length * 16 + 12;
  const bx = GDU.clamp(p.x - wMax / 2, 6, 1100 - wMax - 6), by = p.y - 42 - hBox;
  ctx.fillStyle = '#06121df0'; ctx.strokeStyle = '#00e5c3'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx, by, wMax, hBox, 8); else ctx.rect(bx, by, wMax, hBox);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(p.x - 6, by + hBox); ctx.lineTo(p.x, by + hBox + 8); ctx.lineTo(p.x + 6, by + hBox); ctx.fill();
  ctx.fillStyle = '#eaf6ff'; ctx.textAlign = 'left';
  rows.forEach((r, i) => ctx.fillText(r, bx + 10, by + 20 + i * 16));
  ctx.restore();
}

/* ---------- Gesamtbild ---------- */

GDU.draw = (sceneOnly = false) => {   // sceneOnly: nur Bild neu zeichnen (Animation), Seitenleiste nicht
  const night = GDU.view.night, s = GDU.state, D = GDU.district(), harbor = s.district === 'harbor';
  ctx.clearRect(0, 0, 1100, 760);

  // Himmel
  const bg = ctx.createLinearGradient(0, 0, 0, 760);
  bg.addColorStop(0, night ? '#1a3044' : '#6c98a8');
  bg.addColorStop(1, night ? '#07101c' : '#304f5b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1100, 760);

  // Skyline im Hintergrund (am Hafen niedriger, mit Kransilhouetten)
  for (let i = 0; i < 30; i++) {
    const x = i * 44 - 15, hh = (harbor ? 25 + random(i, 9) * 70 : 45 + random(i, 4) * 125);
    ctx.fillStyle = night ? '#12263a' : '#547685';
    ctx.fillRect(x, 185 - hh, 37, hh);
    if (night) for (let j = 0; j < 5; j++) if (random(i, j) > .48) {
      ctx.fillStyle = '#f2c482';
      ctx.fillRect(x + 8 + (j % 2) * 13, 195 - hh + Math.floor(j / 2) * 19, 4, 6);
    }
  }
  if (harbor) for (const cx of [120, 520, 880]) {   // ferne Containerkräne
    ctx.strokeStyle = night ? '#1d3a52' : '#5f8597'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, 190); ctx.lineTo(cx, 95); ctx.lineTo(cx + 70, 88); ctx.moveTo(cx - 25, 98); ctx.lineTo(cx, 95); ctx.stroke();
  }
  sign(D.title, 35 + D.title.length * 6.5, 39, night ? '#a7fff0' : '#eafff8', 19);
  ctx.textAlign = 'left'; ctx.font = '12px system-ui'; ctx.fillStyle = night ? '#8ba9b8' : '#d5e7e9';
  ctx.fillText(D.sub, 35, 61);

  // Boden: von hinten nach vorne zeichnen
  for (let sum = 0; sum < W + H - 1; sum++) for (let y = 0; y < H; y++) {
    const x = sum - y;
    if (x < 0 || x >= W) continue;
    const on = GDU.walkable(x, y), plaza = D.plaza(x, y);
    if (D.water && D.water(x, y)) {   // Hafenbecken mit leichtem Glitzern
      diamond(x, y, night ? '#0b2536' : '#2f6a86', night ? '#12354a' : '#4b86a0');
      const p = iso(x, y), shimmer = REDUCED ? 0.5 : 0.5 + 0.5 * Math.sin(GDU.view.t * 1.6 + x * 0.9 + y * 1.7);
      ctx.fillStyle = 'rgba(127,216,255,' + (0.12 + 0.25 * shimmer) + ')'; ctx.fillRect(p.x - 8, p.y + 12, 16, 1.5);
      continue;
    }
    if (D.planks && D.planks(x, y)) { diamond(x, y, night ? '#4a3a2a' : '#8a6c4a', '#2a2018'); continue; }   // Holzsteg
    const color = on ? (plaza ? (night ? '#3a5660' : '#72908b') : (night ? '#344755' : '#677d82')) : (night ? '#1a2b36' : '#3b5962');
    diamond(x, y, color, night ? '#47616b' : '#78969b');
    if (on && random(x, y) > .88) { const p = iso(x, y); ctx.fillStyle = night ? '#85a5a8' : '#bacbcb'; ctx.fillRect(p.x - 2, p.y + 13, 4, 2); }
    if (on && y === 8 && x % 3 === 0) { const p = iso(x, y); line(p.x - 8, p.y + 14, p.x + 8, p.y + 14, '#dfc888', 2); }
  }

  // Container am Hafen
  for (const [x, y, c] of D.containers || []) {
    const p = iso(x, y), shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
    for (let lvl = 0; lvl < 2; lvl++) {
      const yy = p.y + TH / 2 - lvl * 16;
      poly([[p.x - 26, yy - 2], [p.x, yy + 11], [p.x, yy - 5], [p.x - 26, yy - 18]], shade(c, night ? 0.55 : 0.9), '#111925');
      poly([[p.x, yy + 11], [p.x + 26, yy - 2], [p.x + 26, yy - 18], [p.x, yy - 5]], shade(c, night ? 0.4 : 0.7), '#111925');
      poly([[p.x - 26, yy - 18], [p.x, yy - 5], [p.x + 26, yy - 18], [p.x, yy - 31]], shade(c, night ? 0.7 : 1), '#111925');
    }
  }
  // Bäume
  for (const [x, y] of D.trees) {
    const p = iso(x, y);
    ctx.fillStyle = '#334c50'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 13, 11, 5, 0, 0, 7); ctx.fill();
    line(p.x, p.y + 10, p.x, p.y - 18, '#657f77', 4);
    ctx.fillStyle = '#3c8d77'; ctx.beginPath(); ctx.arc(p.x, p.y - 21, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#65b597'; ctx.beginPath(); ctx.arc(p.x - 5, p.y - 25, 6, 0, 7); ctx.fill();
  }
  // Straßenlaternen
  for (const [x, y] of D.lamps) {
    const p = iso(x, y);
    line(p.x, p.y + 12, p.x, p.y - 42, '#78949e', 3);
    ctx.shadowColor = '#ffe3a3'; ctx.shadowBlur = night ? 25 : 0;
    ctx.fillStyle = night ? '#ffe8a4' : '#e2edf0';
    ctx.beginPath(); ctx.arc(p.x, p.y - 45, 6, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Gebäude und Figuren nach Tiefe sortiert, damit Verdeckungen stimmen
  const crane = ([x, y]) => () => {   // Hafenkran im Wasser
    const p = iso(x, y), b0 = p.y + TH / 2, col = night ? '#c9862f' : '#e0a040';
    line(p.x - 10, b0, p.x - 4, b0 - 120, col, 4); line(p.x + 10, b0, p.x + 4, b0 - 120, col, 4);
    line(p.x - 40, b0 - 118, p.x + 70, b0 - 126, col, 5); line(p.x + 50, b0 - 125, p.x + 50, b0 - 70, '#9ab3bc', 1.5);
    ctx.fillStyle = col; ctx.fillRect(p.x - 8, b0 - 132, 18, 12);
    if (night) { ctx.fillStyle = '#ff5050'; ctx.beginPath(); ctx.arc(p.x + 70, b0 - 128, 3, 0, 7); ctx.fill(); }
  };
  const objects = [
    ...GDU.buildings.map(b => ({ depth: b.stop ? b.door[0] + b.door[1] : b.a[3] + b.a[1], fn: () => building(b) })),
    ...(D.cranes || []).map(c => ({ depth: c[0] + c[1], fn: crane(c) })),
    { depth: s.x + s.y, fn: player },
    ...GDU.npcs.map(n => ({ depth: n.x + n.y, fn: () => drawNPC(n.x, n.y, n.shirt, n.hair) }))
  ];
  objects.sort((a, b) => a.depth - b.depth).forEach(o => o.fn());

  // Passant direkt neben Maria? Dann Sprechblase (neuer Spruch bei jeder neuen Begegnung)
  const buddy = GDU.npcs.find(n => Math.abs(n.x - s.x) <= 1 && Math.abs(n.y - s.y) <= 1);
  if (buddy) {
    if (GDU.view.talking !== buddy) { buddy.say = (buddy.say ?? Math.floor(Math.random() * 7)) + 1; GDU.view.talking = buddy; }
    speechBubble(buddy);
  } else GDU.view.talking = null;

  for (const [x, y, t, col] of D.signs) {
    const p = iso(x, y);
    sign(t, p.x, p.y + 5, col, 11);
  }

  // Regen beim Ereignis „Starkregen“
  if (s.trend === 'rain' && !s.over) {
    ctx.save(); ctx.strokeStyle = night ? 'rgba(160,200,230,0.35)' : 'rgba(230,240,250,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 140; i++) {
      const x0 = (i * 97.3) % 1100, y0 = ((i * 53.7) + (REDUCED ? 0 : GDU.view.t * 520)) % 800 - 40;
      ctx.moveTo(x0, y0); ctx.lineTo(x0 - 6, y0 + 18);
    }
    ctx.stroke(); ctx.restore();
  }

  const near = GDU.doorHere();
  hint.textContent = near ? (near.stop ? '[E] Metro U9 nehmen' : '[E] ' + near.name + ' betreten') : 'WASD / Pfeiltasten: bewegen · E: interagieren';
  if (!sceneOnly) GDU.updateHUD();
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
    if (n === GDU.view.talking) continue;   // wer gerade mit Maria redet, bleibt stehen
    const choices = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
    const [dx, dy] = choices[Math.floor(Math.random() * choices.length)];
    const nx = n.x + dx, ny = n.y + dy;
    if (GDU.walkable(nx, ny) && Math.abs(nx - n.home[0]) <= 4 && Math.abs(ny - n.home[1]) <= 4 && !(nx === GDU.state.x && ny === GDU.state.y)) {
      n.x = nx; n.y = ny;
    }
  }
  GDU.draw();
};

// Bezirk aus dem Spielstand aktivieren
GDU.enterDistrict(GDU.state.district);
