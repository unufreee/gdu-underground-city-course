/* GDU Underground City – Erfolge
   Sammelbare Auszeichnungen, die über alle Saisons erhalten bleiben (GDU.state.achievements).
   Beim Freischalten erscheint ein kurzes Pop-up; die Sammlung steht in der Seitenleiste. */
'use strict';

window.GDU = window.GDU || {};

GDU.ACHIEVEMENTS = [
  { id: 'first',     icon: '🎉', name: 'Erste Nacht',         text: 'Die erste Party im Bunker 99 veranstaltet.' },
  { id: 'soldout',   icon: '🔥', name: 'Ausverkauft',         text: 'Eine Nacht mit vollem Haus (160 Gäste).' },
  { id: 'euphoria',  icon: '💖', name: 'Ekstase',             text: 'Eine Nacht mit mindestens 90 % Stimmung.' },
  { id: 'bignight',  icon: '💸', name: 'Kasse klingelt',      text: 'Mindestens 2.000 € Gewinn in einer Nacht.' },
  { id: 'warmup',    icon: '🎧', name: 'Legendäres Warm-up',  text: 'Beat-Battle mit mindestens 90 % Treffern.' },
  { id: 'door',      icon: '🚪', name: 'Perfekte Tür',        text: 'Beim Türsteher alle 10 Gäste richtig entschieden.' },
  { id: 'crate',     icon: '💿', name: 'Goldene Kiste',       text: 'Crate Digging mit 6 Treffern ohne Fehlgriff.' },
  { id: 'allin',     icon: '⭐', name: 'Volles Programm',     text: 'Crate Digging, Warm-up und Türsteher in derselben Nacht.' },
  { id: 'headliner', icon: '👑', name: 'Headlinerin gebucht', text: 'Nova Black für eine Nacht gebucht.' },
  { id: 'honest',    icon: '🤝', name: 'Ehrliche Haut',       text: 'Das gefundene Portemonnaie zurückgegeben.' },
  { id: 'season',    icon: '🏆', name: 'Saison geschafft',    text: 'Das Saisonziel erreicht.' },
  { id: 'queen',     icon: '🌙', name: 'Königin der Nacht',   text: 'Eine Saison mit mindestens 9.000 € abgeschlossen.' }
];

let toastTimer = null;

// Erfolg freischalten (nur beim ersten Mal) und Pop-up zeigen
GDU.achieve = id => {
  const s = GDU.state, a = GDU.ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  s.achievements = s.achievements || [];
  if (s.achievements.includes(id)) return;
  s.achievements.push(id);
  GDU.save();
  GDU.renderAchievements();
  const el = document.getElementById('toast');
  el.innerHTML = '<span class="toast-icon">' + a.icon + '</span><span><small>Erfolg freigeschaltet</small><b>' + a.name + '</b></span>';
  el.hidden = false;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3600);
};

// Nach einer Party-Nacht prüfen
GDU.checkNight = (r, dj, extras) => {
  GDU.achieve('first');
  if (r.guests >= GDU.config.capacity) GDU.achieve('soldout');
  if (r.happy >= 90) GDU.achieve('euphoria');
  if (r.net >= 2000) GDU.achieve('bignight');
  if (dj.id === 'nova') GDU.achieve('headliner');
  if (extras.warm && extras.door && extras.crate) GDU.achieve('allin');
};

// Am Saisonende prüfen
GDU.checkSeason = s => {
  if (s.result === 'won') GDU.achieve('season');
  if (s.result !== 'broke' && s.money >= 9000) GDU.achieve('queen');
};

GDU.renderAchievements = () => {
  const got = GDU.state.achievements || [];
  document.getElementById('achCount').textContent = got.length + ' / ' + GDU.ACHIEVEMENTS.length;
  document.getElementById('achievements').innerHTML = GDU.ACHIEVEMENTS.map(a => {
    const ok = got.includes(a.id);
    return '<li class="ach' + (ok ? ' got' : '') + '" title="' + a.name + ': ' + a.text + '"><span aria-hidden="true">' + (ok ? a.icon : '🔒') + '</span><span class="sr">' + a.name + (ok ? ' (freigeschaltet)' : ' (gesperrt)') + ': ' + a.text + '</span></li>';
  }).join('');
};
