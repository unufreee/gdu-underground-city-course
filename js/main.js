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
  if (confirm('Spielstand wirklich komplett zurücksetzen?')) {
    GDU.state = GDU.newSeason();
    GDU.view.facing = 'down';
    GDU.view.stride = 0;
    GDU.save();
    GDU.draw();
  }
});

GDU.renderMinigames();
GDU.draw();
setInterval(GDU.ambientStep, 950);
