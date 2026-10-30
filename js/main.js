/* GDU Underground City – Start und Eingabe
   Verbindet Tastatur, Touch-Buttons und Gebäude mit den Orten bzw. Minispielen. */
'use strict';

// Gebäude → Ort bzw. Minispiel
const enter = () => {
  if (GDU.dialogOpen()) return;
  const b = GDU.doorHere();
  if (b && GDU.places[b.id]) GDU.places[b.id]();
};

const moves = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
let lastMove = 0;

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();

  // Offener Dialog: Esc schließt, Tab bleibt im Dialog, alles andere (Enter, Leertaste, Regler) arbeitet normal
  if (GDU.dialogOpen()) {
    if (key === 'escape') GDU.close();
    else if (key === 'tab') GDU.trapFocus(e);
    return;
  }

  const onControl = e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT';
  if (key in moves) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastMove > 85) { GDU.move(...moves[key]); lastMove = now; }
  } else if (key === 'e' || (key === 'enter' && !onControl)) {
    // Enter auf einem fokussierten Button löst diesen Button aus, nicht das Gebäude
    e.preventDefault();
    enter();
  }
});

document.querySelectorAll('[data-move]').forEach(btn =>
  btn.addEventListener('click', () => GDU.move(...moves[{ up: 'w', down: 's', left: 'a', right: 'd' }[btn.dataset.move]])));
document.getElementById('touchE').addEventListener('click', enter);

document.getElementById('lightMode').addEventListener('click', () => { GDU.view.night = !GDU.view.night; GDU.draw(); });
document.getElementById('reset').addEventListener('click', () => {
  if (confirm(GDU.demo ? 'Demo auf den Anfangsstand zurücksetzen?' : 'Spielstand wirklich komplett zurücksetzen?')) {
    GDU.state = GDU.demo ? GDU.demoState() : GDU.newSeason({ mute: GDU.state.mute });   // Komplett-Reset: Erfolge und Bestenliste weg, Ton-Einstellung bleibt
    GDU.renderAchievements();
    GDU.view.facing = 'down';
    GDU.view.stride = 0;
    GDU.save();
    GDU.draw();
  }
});

/* ---------- Fokus-Hinweis ----------
   Im WordPress-iframe empfängt das Spiel Tastendrücke erst nach einem Klick hinein.
   Solange die Seite keinen Fokus hat, erscheint deshalb ein Hinweis über dem Spielfeld. */
const focusHint = document.getElementById('focusHint');
const updateFocusHint = () => {
  const show = !document.hasFocus() && !GDU.dialogOpen();
  focusHint.hidden = !show;
};
focusHint.addEventListener('click', () => { window.focus(); focusHint.hidden = true; });
document.querySelector('.stage').addEventListener('pointerdown', () => window.focus());
window.addEventListener('focus', updateFocusHint);
window.addEventListener('blur', () => setTimeout(updateFocusHint, 50));
setTimeout(updateFocusHint, 300);

// Demo-Modus sichtbar machen
if (GDU.demo) {
  document.getElementById('demoBadge').hidden = false;
  document.getElementById('reset').textContent = 'Demo zurücksetzen';
}

/* ---------- Sound ----------
   Browser erlauben Ton erst nach einer Nutzeraktion: der erste Tastendruck oder Klick schaltet ihn frei. */
const soundBtn = document.getElementById('soundToggle');
const updateSoundBtn = () => { soundBtn.textContent = GDU.state.mute ? '🔇 Ton aus' : '🔊 Ton an'; soundBtn.setAttribute('aria-pressed', String(!GDU.state.mute)); };
soundBtn.addEventListener('click', () => { GDU.audio.mute(!GDU.state.mute); updateSoundBtn(); });
updateSoundBtn();
const firstGesture = () => GDU.audio.unlock();
document.addEventListener('keydown', firstGesture, { once: true });
document.addEventListener('pointerdown', firstGesture, { once: true });

// Bass durch die Wand: je näher Maria an der Tür von Bunker 99 steht, desto lauter (nur ohne offenes Fenster)
const wallLevel = () => {
  if (GDU.dialogOpen() || document.hidden || GDU.state.mute || GDU.state.district === 'harbor') return 0;
  const d = Math.abs(GDU.state.x - 5) + Math.abs(GDU.state.y - 10);
  return GDU.clamp(1 - d / 13, 0, 1);
};

/* ---------- Animation ----------
   Die Stadt wird mit etwa 30 Bildern pro Sekunde neu gezeichnet (Neon, Laser, Nebel, Regen).
   Bei „Bewegung reduzieren“, offenem Fenster oder verstecktem Tab wird nicht animiert. */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastFrame = 0;
function animate(now) {
  if (now - lastFrame > 33) {
    lastFrame = now;
    GDU.audio.setWall(wallLevel());
    if (!REDUCED_MOTION && !document.hidden && !GDU.dialogOpen()) { GDU.view.t = now / 1000; GDU.draw(true); }
  }
  requestAnimationFrame(animate);
}

GDU.renderMinigames();
GDU.renderAchievements();
GDU.draw();
setInterval(GDU.ambientStep, 950);
requestAnimationFrame(animate);
