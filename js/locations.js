/* GDU Underground City – Orte der Stadt
   Beat Dealers (DJ buchen) und Vinyl Junky (Ausstattung kaufen).
   Der Bunker 99 führt zum Minispiel Party-Nacht (games/party-night.js). */
'use strict';

window.GDU = window.GDU || {};
GDU.places = GDU.places || {};

// Hinweis, wenn die Saison vorbei ist
GDU.seasonOverNotice = () =>
  GDU.modal('Saison beendet', '<p>Diese Saison ist vorbei. Im <b>Bunker 99</b> kannst du eine neue Saison starten.</p>', [['OK', GDU.close]]);

/* ---------- Beat Dealers: DJ-Agentur ---------- */

GDU.places.agency = () => {
  const s = GDU.state;
  if (s.over) return GDU.seasonOverNotice();
  const trend = GDU.trend(s.trend);
  const booked = s.booked ? GDU.dj(s.booked) : null;

  const intro = booked
    ? '<p>Für heute Nacht ist <b>' + booked.name + '</b> gebucht. Ab in den Bunker 99!</p>'
    : '<p>Wen buchst du für Nacht ' + s.night + '? Die Gage zahlst du sofort.</p>';
  const tip = '<p class="note"><b>Heute Nacht: ' + trend.title + '.</b> ' + trend.text +
    (trend.genre ? ' ' + trend.genre + '-DJs ziehen deutlich mehr Gäste.' : '') + '</p>';

  const cards = GDU.djs.map(dj => {
    const locked = s.rep < dj.minRep;
    const hot = trend.genre && trend.genre === dj.genre;
    let label = 'Buchen · ' + GDU.euro(dj.fee), disabled = false;
    if (booked) { label = booked.id === dj.id ? 'Gebucht' : 'Heute schon gebucht'; disabled = true; }
    else if (locked) { label = 'Ab Ruf ' + dj.minRep; disabled = true; }
    else if (s.money < dj.fee) { label = 'Zu teuer'; disabled = true; }
    return '<div class="card' + (booked && booked.id === dj.id ? ' picked' : '') + (locked ? ' locked' : '') + '">' +
      '<div class="card-head"><b>' + dj.name + '</b><span class="tag">' + dj.genre + '</span>' + (hot ? '<span class="tag hot">gefragt</span>' : '') + '</div>' +
      '<p>' + dj.text + '</p>' +
      '<ul class="facts"><li>Gage <b>' + GDU.euro(dj.fee) + '</b></li><li>Fans <b>' + dj.fans + '</b></li><li>Stimmung <b>' + (dj.wild ? '?' : '+' + dj.vibe) + '</b></li></ul>' +
      '<button data-book="' + dj.id + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button></div>';
  }).join('');

  GDU.modal('BEAT DEALERS · DJ-Agentur', intro + tip + '<div class="cards">' + cards + '</div>', [['Zurück', GDU.close, false, 'secondary']], true);

  document.querySelectorAll('[data-book]').forEach(btn => btn.addEventListener('click', () => {
    const dj = GDU.dj(btn.dataset.book);
    if (s.booked || s.money < dj.fee || s.rep < dj.minRep) return;
    s.money -= dj.fee;
    s.booked = dj.id;
    GDU.save();
    GDU.places.agency();   // Ansicht mit gebuchtem DJ neu aufbauen
  }));
};

/* ---------- Vinyl Junky: Plattenladen und Technik ---------- */

GDU.places.store = () => {
  const s = GDU.state;
  if (s.over) return GDU.seasonOverNotice();

  const items = GDU.gear.map(g => {
    const owned = !!s.gear[g.id];
    const label = owned ? 'Gekauft' : 'Kaufen · ' + GDU.euro(g.price);
    return '<div class="card' + (owned ? ' picked' : '') + '">' +
      '<div class="card-head"><b>' + g.name + '</b>' + (g.required ? '<span class="tag hot">Pflicht</span>' : '') + '</div>' +
      '<p>' + g.text + '</p>' +
      '<button data-buy="' + g.id + '"' + (owned || s.money < g.price ? ' disabled' : '') + '>' + (owned ? label : s.money < g.price ? 'Zu teuer' : label) + '</button></div>';
  }).join('');

  const soon = '<div class="card soon"><div class="card-head"><b>Crate Digging</b><span class="tag">demnächst</span></div>' +
    '<p>Finde unter Zeitdruck die richtigen Platten für dein Set. Neues Minispiel in Arbeit.</p></div>';

  GDU.modal('VINYL JUNKY · Plattenladen',
    '<p>Kapital: <b>' + GDU.euro(s.money) + '</b>. Gekaufte Technik bleibt die ganze Saison.</p><div class="cards">' + items + soon + '</div>',
    [['Zurück', GDU.close, false, 'secondary']], true);

  document.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => {
    const g = GDU.gear.find(x => x.id === btn.dataset.buy);
    if (s.gear[g.id] || s.money < g.price) return;
    s.money -= g.price;
    s.gear[g.id] = true;
    GDU.save();
    GDU.places.store();
  }));
};
