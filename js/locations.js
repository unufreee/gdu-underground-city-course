/* GDU Underground City – Orte der Stadt
   Beat Dealers (DJ buchen) und Vinyl Junky (Ausstattung kaufen).
   Der Bunker 99 führt zum Minispiel Party-Nacht (games/party-night.js). */
'use strict';

window.GDU = window.GDU || {};
GDU.places = GDU.places || {};

// Hinweis, wenn die Saison vorbei ist
GDU.seasonOverNotice = () =>
  GDU.modal('Saison beendet', '<p>Diese Saison ist vorbei. Im <b>Bunker 99</b> kannst du eine neue Saison starten.</p>', [['OK', GDU.close]]);

/* ---------- DJ-Booking: Beat Dealers (Warehouse) und Kran-Lounge (Hafen) ---------- */

GDU.places.agency = () => booking(false);
GDU.places.lounge = () => booking(true);

function booking(lounge) {
  const s = GDU.state;
  if (s.over) return GDU.seasonOverNotice();
  const reopen = () => booking(lounge);
  const trend = GDU.trend(s.trend);
  const booked = s.booked ? GDU.dj(s.booked) : null;

  const intro = booked
    ? '<p>Für heute Nacht ist <b>' + booked.name + '</b> gebucht. Ab in den Bunker 99' + (s.harbor && s.pierUsed !== s.season ? ' oder zum Pier 7' : '') + '!</p>'
    : '<p>' + (lounge ? 'Die Kran-Lounge bucht die großen Namen der Stadt. ' : '') + 'Wen buchst du für Nacht ' + s.night + '? Die Gage zahlst du sofort.</p>';
  const tip = '<p class="note"><b>Heute Nacht: ' + trend.title + '.</b> ' + trend.text +
    (trend.genre ? ' ' + trend.genre + '-DJs ziehen deutlich mehr Gäste.' : '') + '</p>';

  const cards = GDU.djs.filter(dj => !!dj.lounge === lounge).map(dj => {
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

  const other = lounge ? '' : (s.harbor ? '<p class="small muted">Noch größere Namen buchst du in der <b>Kran-Lounge</b> am Hafen.</p>' : '');
  GDU.modal(lounge ? 'KRAN-LOUNGE · Headliner-Booking' : 'BEAT DEALERS · DJ-Agentur', intro + tip + '<div class="cards">' + cards + '</div>' + other, [['Zurück', GDU.close, false, 'secondary']], true);

  document.querySelectorAll('[data-book]').forEach(btn => btn.addEventListener('click', () => {
    const dj = GDU.dj(btn.dataset.book);
    if (s.booked || s.money < dj.fee || s.rep < dj.minRep) return;
    s.money -= dj.fee;
    s.booked = dj.id;
    GDU.save();
    reopen();   // Ansicht mit gebuchtem DJ neu aufbauen
  }));
}

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

  // Minispiel Crate Digging: einmal pro Nacht, braucht einen gebuchten DJ
  const crate = GDU.tonight('crate');
  const soon = '<div class="card' + (crate ? ' picked' : '') + '"><div class="card-head"><b>Crate Digging</b><span class="tag hot">Minispiel</span></div>' +
    '<p>' + (crate ? 'Heute schon gewühlt: ' + crate.hits + ' Treffer, ' + (crate.guests > 0 ? '+' : '') + crate.guests + ' Gäste.' : 'Finde in 25 Sekunden passende Platten für das Set deines DJs. Bringt bis zu +18 Gäste.') + '</p>' +
    '<button id="crateBtn"' + (crate ? ' disabled' : '') + '>' + (crate ? 'Erledigt' : '🎵 In der Kiste wühlen') + '</button></div>';

  GDU.modal('VINYL JUNKY · Plattenladen',
    '<p>Kapital: <b>' + GDU.euro(s.money) + '</b>. Gekaufte Technik bleibt die ganze Saison.</p><div class="cards">' + items + soon + '</div>',
    [['Zurück', GDU.close, false, 'secondary']], true);

  const cb = document.getElementById('crateBtn');
  if (cb) cb.addEventListener('click', () => GDU.crate.open());

  document.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => {
    const g = GDU.gear.find(x => x.id === btn.dataset.buy);
    if (s.gear[g.id] || s.money < g.price) return;
    s.money -= g.price;
    s.gear[g.id] = true;
    GDU.save();
    GDU.places.store();
  }));
};

/* ---------- Radio Hafenfunk (Hafen) ---------- */

GDU.places.radio = () => {
  const s = GDU.state;
  if (s.over) return GDU.seasonOverNotice();
  const r = GDU.tonight('radio') || {};
  const spotOk = !r.spot && s.money >= GDU.radio.spotPrice;
  GDU.modal('RADIO HAFENFUNK · 99,9',
    '<p>„Ihr hört Hafenfunk, die Stimme der Nacht.“ Einmal pro Nacht kannst du hier Werbung schalten und ein Interview geben.</p>' +
    '<div class="cards">' +
    '<div class="card' + (r.spot ? ' picked' : '') + '"><div class="card-head"><b>Werbespot heute Nacht</b></div><p>Läuft dreimal zur besten Sendezeit. Bringt <b>+' + GDU.radio.spotGuests + ' Gäste</b> zur nächsten Party, auch zusätzlich zu Flyern oder Social Media.</p>' +
    '<button id="radioSpot"' + (spotOk ? '' : ' disabled') + '>' + (r.spot ? 'Gebucht' : s.money < GDU.radio.spotPrice ? 'Zu teuer' : 'Spot buchen · ' + GDU.euro(GDU.radio.spotPrice)) + '</button></div>' +
    '<div class="card' + (r.interview ? ' picked' : '') + '"><div class="card-head"><b>Live-Interview</b></div><p>Maria erzählt vom Bunker 99. Kostet nichts, bringt <b>+' + GDU.radio.interviewRep + ' Ruf</b> sofort.</p>' +
    '<button id="radioTalk"' + (r.interview ? ' disabled' : '') + '>' + (r.interview ? 'Gegeben' : 'Interview geben') + '</button></div>' +
    '</div>',
    [['Zurück', GDU.close, false, 'secondary']], true);
  const set = patch => { s.radio = { ...(GDU.tonight('radio') || {}), night: s.night, season: s.season, ...patch }; GDU.save(); GDU.places.radio(); };
  document.getElementById('radioSpot').addEventListener('click', () => { if (s.money < GDU.radio.spotPrice) return; s.money -= GDU.radio.spotPrice; set({ spot: true }); });
  document.getElementById('radioTalk').addEventListener('click', () => { s.rep += GDU.radio.interviewRep; set({ interview: true }); });
};

/* ---------- Pier 7 Open Air (Hafen) ---------- */

GDU.places.pier = () => {
  const s = GDU.state;
  if (s.over) return GDU.seasonOverNotice();
  if (s.pierUsed === s.season) {
    return GDU.modal('PIER 7', '<p>Die Open-Air-Nacht hat in dieser Saison schon stattgefunden. Die Bühne wird abgebaut … bis zur nächsten Saison.</p>', [['OK', GDU.close]]);
  }
  GDU.openParty('pier');
};

/* ---------- Metro U9: zwischen Warehouse District und Hafen ---------- */

GDU.places.metro = () => {
  const s = GDU.state;
  const to = s.district === 'harbor' ? 'warehouse' : 'harbor';
  if (to === 'harbor' && !s.harbor) {
    return GDU.modal('METRO U9', '<p>„Diese Linie fährt nur für Leute, die eine Saison gerockt haben.“</p><p>Gewinne eine Saison (Saisonziel erreichen), dann öffnet sich <b>Chapter 02: der Hafen</b>.</p>', [['OK', GDU.close]]);
  }
  GDU.modal('METRO U9',
    '<p>Nächster Halt: <b>' + (to === 'harbor' ? 'Hafen' : 'Warehouse District') + '</b>. Bitte zurückbleiben!</p>',
    [['Einsteigen', () => {
      const d = GDU.DISTRICTS[to];
      GDU.state.x = d.buildings.find(b => b.stop).door[0];
      GDU.state.y = d.buildings.find(b => b.stop).door[1];
      GDU.enterDistrict(to);
      GDU.save();
      GDU.close();
      if (to === 'harbor') GDU.achieve('harbor');
    }], ['Bleiben', GDU.close, false, 'secondary']]);
};
