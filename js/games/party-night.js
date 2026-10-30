/* GDU Underground City – Minispiel „Party-Nacht“ im Bunker 99
   Ablauf einer Nacht: planen (Eintritt, Werbung) → Nacht läuft → Abrechnung.
   Nach der letzten Nacht wird die Saison ausgewertet. */
'use strict';

window.GDU = window.GDU || {};
GDU.places = GDU.places || {};

GDU.places.club = () => GDU.openParty('bunker');

// Zurück zur Planung am zuletzt geöffneten Ort (Bunker 99 oder Pier 7)
GDU.lastVenue = 'bunker';
GDU.reopenParty = () => GDU.openParty(GDU.lastVenue);

GDU.openParty = venue => {
  const s = GDU.state;
  GDU.lastVenue = venue;
  if (s.over) return seasonResult();

  if (!s.gear.sound) {
    return GDU.modal(venue === 'pier' ? 'PIER 7' : 'BUNKER 99', '<p>' + (venue === 'pier' ? 'Die Bühne steht, aber die Boxen fehlen.' : 'Die Halle ist leer und still.') + ' <b>Ohne Soundanlage keine Party.</b></p><p>Bei <b>Vinyl Junky</b> im Warehouse District gibt es eine gebrauchte Anlage.</p>', [['OK', GDU.close]]);
  }
  if (!s.booked) {
    const cheapest = Math.min(...GDU.djs.filter(d => d.minRep <= s.rep && (!d.lounge || s.harbor)).map(d => d.fee));
    if (s.money < cheapest) return endSeason('broke');   // kein DJ mehr bezahlbar
    return GDU.modal(venue === 'pier' ? 'PIER 7' : 'BUNKER 99', '<p>Die Anlage steht, aber <b>niemand legt auf.</b></p><p>Buch bei <b>Beat Dealers</b>' + (s.harbor ? ' oder in der <b>Kran-Lounge</b> am Hafen' : '') + ' einen DJ für heute Nacht.</p>', [['OK', GDU.close]]);
  }
  planner(venue);
};

/* ---------- 1. Planung ---------- */

function planner(venue = 'bunker') {
  const s = GDU.state, c = GDU.config, pier = venue === 'pier';
  const level = s.club || 0, cap = c.capacity + GDU.clubLevels.slice(0, level).reduce((n, l) => n + l.cap, 0);
  const dj = GDU.dj(s.booked), trend = GDU.trend(s.trend);
  // Vorauswahl: zuletzt gewählte Werbung, falls noch bezahlbar
  const selected = GDU.promo(s.promo).price <= s.money ? s.promo : 'none';
  const promos = GDU.promos.map(p => {
    const affordable = s.money >= p.price;
    return '<label class="option' + (affordable ? '' : ' off') + '">' +
      '<input type="radio" name="promo" value="' + p.id + '"' + (p.id === selected ? ' checked' : '') + (affordable ? '' : ' disabled') + '>' +
      '<span><b>' + p.name + '</b><small>' + (p.price ? GDU.euro(p.price) + ' · bis zu +' + p.guests + ' Gäste' : 'kostenlos') + '</small></span></label>';
  }).join('');

  const html =
    '<div class="night-head"><span>Nacht ' + s.night + ' von ' + c.nights + '</span><span>Kapital: <b>' + GDU.euro(s.money) + '</b></span></div>' +
    '<p class="note"><b>' + trend.title + ':</b> ' + trend.text + '</p>' +
    '<p>Am Pult: <b>' + dj.name + '</b> (' + dj.genre + ', ' + dj.fans + ' Fans)' +
    (trend.genre ? (trend.genre === dj.genre ? ' – <span class="done">passt perfekt zum Abend!</span>' : ' – heute nicht das gefragte Genre.') : '') + '</p>' +
    '<label for="entry">Eintrittspreis: <strong id="entryValue">' + s.entry + ' €</strong></label>' +
    '<input type="range" id="entry" min="5" max="25" value="' + s.entry + '">' +
    '<p class="small muted">Günstig bringt mehr Gäste und gute Laune, teuer bringt mehr pro Kopf. Ab 13&nbsp;€ wird gemeckert.</p>' +
    '<fieldset class="promos"><legend>Werbung</legend>' + promos + '</fieldset>' +
    (pier
      ? '<p class="note"><b>Open Air am Pier 7:</b> bis ' + GDU.pier.capacity + ' Gäste, Betriebskosten <b>' + GDU.euro(GDU.pier.operatingCost) + '</b>. Einmal pro Saison. ' + (trend.id === 'rain' ? '<span class="warn">Heute regnet es: Das wird hart.</span>' : 'Klare Nacht: perfekt für den Pier.') + '</p>'
      : '<p class="small muted">Bunker 99' + (level ? ' (' + GDU.clubLevels[level - 1].name + ')' : '') + ': bis ' + cap + ' Gäste. Nach der Party fallen <b>' + GDU.euro(c.operatingCost + level * 40) + '</b> Betriebskosten an (Miete, Security, Personal).</p>');
  const radio = GDU.tonight('radio');

  // Optionale Minispiele vor der Party: Status und Effekt für heute Nacht
  const sg = n => (n > 0 ? '+' : '') + n;
  const warm = GDU.tonight('warmup'), door = GDU.tonight('door'), crate = GDU.tonight('crate');
  const line = (done, text) => '<li class="' + (done ? 'done' : 'muted') + '">' + (done ? '✓ ' : '○ ') + text + '</li>';
  const extras = '<div class="warmup"><b>Vor der Party (optional):</b><ul class="extras">' +
    line(!!crate, crate ? 'Crate Digging: ' + (crate.aborted ? 'abgebrochen' : crate.hits + ' Treffer') + ', <b>' + sg(crate.guests) + ' Gäste</b>' : 'Crate Digging bei Vinyl Junky: passende Platten bringen bis zu +18 Gäste') +
    line(!!warm, warm ? 'Warm-up: ' + (warm.aborted ? 'abgebrochen' : warm.acc + ' % getroffen') + ', <b>' + sg(warm.bonus) + ' Stimmung</b>' : 'Warm-up am DJ-Pult (Beat-Battle): bis zu +10 Stimmung') +
    line(!!door, door ? 'Türsteher: ' + (door.aborted ? 'abgebrochen' : door.acc + ' % richtig') + ', <b>' + sg(door.bonus) + ' Stimmung</b>' : 'Türsteher: die richtige Crowd reinlassen, bis zu +6 Stimmung') +
    '</ul></div>';
  const mod = GDU.tonight('mod');
  const modHtml = mod && (mod.guests || mod.vibe) ? '<p class="note">Nachwirkung „' + mod.title + '“: ' +
    [mod.guests ? sg(mod.guests) + ' Gäste' : '', mod.vibe ? sg(mod.vibe) + ' Stimmung' : ''].filter(Boolean).join(', ') + '</p>' : '';

  const radioHtml = radio ? '<p class="note">Radio Hafenfunk: ' + (radio.spot ? '<b>Spot läuft</b>, +' + GDU.radio.spotGuests + ' Gäste' : '') + (radio.spot && radio.interview ? ' · ' : '') + (radio.interview ? 'Interview gegeben' : '') + '</p>' : '';

  GDU.modal(pier ? 'PIER 7 · Open-Air-Nacht' : 'BUNKER 99 · Party-Nacht', html + modHtml + radioHtml + extras, [
    [pier ? 'OPEN AIR STARTEN' : 'PARTY STARTEN', () => startNight(venue)],
    [warm ? 'Warm-up gespielt' : '🎧 Warm-up', () => GDU.beat.open(), !!warm, 'secondary'],
    [door ? 'Tür erledigt' : '🚪 Türsteher', () => GDU.door.open(), !!door, 'secondary'],
    ...(pier ? [] : [['🏗 Ausbau' + (level ? ' (' + level + '/3)' : ''), () => GDU.places.upgrade(), level >= 3, 'secondary']]),
    ['Später', GDU.close, false, 'secondary']
  ]);

  const slider = document.getElementById('entry');
  slider.addEventListener('input', () => {
    document.getElementById('entryValue').textContent = slider.value + ' €';
    s.entry = Number(slider.value);
    GDU.save();
  });
  document.querySelectorAll('input[name="promo"]').forEach(r => r.addEventListener('change', () => { s.promo = r.value; GDU.save(); }));
}

/* ---------- Club-Ausbau ---------- */

GDU.places.upgrade = () => {
  const s = GDU.state, level = s.club || 0;
  const cards = GDU.clubLevels.map((l, i) => {
    const done = i < level, next = i === level;
    return '<div class="card' + (done ? ' picked' : '') + (i > level ? ' locked' : '') + '"><div class="card-head"><b>Stufe ' + (i + 1) + ': ' + l.name + '</b></div>' +
      '<p>' + l.text + '</p><ul class="facts"><li>Gäste <b>+' + l.cap + '</b></li><li>Stimmung <b>+' + l.vibe + '</b></li>' + (l.bar ? '<li>Bar <b>+' + l.bar + ' €</b></li>' : '') + (l.rep ? '<li>Ruf <b>+' + l.rep + '/Nacht</b></li>' : '') + '</ul>' +
      '<button data-level="' + i + '"' + (!next || s.money < l.price ? ' disabled' : '') + '>' + (done ? 'Gebaut' : next ? (s.money < l.price ? 'Zu teuer · ' : 'Bauen · ') + GDU.euro(l.price) : 'Erst Stufe ' + i) + '</button></div>';
  }).join('');
  GDU.modal('BUNKER 99 · Club-Ausbau',
    '<p>Kapital: <b>' + GDU.euro(s.money) + '</b>. Jede Stufe bleibt bis zum Ende der Saison und macht den Bunker größer. Mehr Platz bedeutet auch etwas mehr Personal (+40 € Betriebskosten pro Stufe).</p><div class="cards">' + cards + '</div>',
    [['Zurück zur Planung', () => GDU.openParty('bunker'), false, 'secondary']], true);
  document.querySelectorAll('[data-level]').forEach(btn => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.level), l = GDU.clubLevels.at(i);
    if (i !== (s.club || 0) || s.money < l.price) return;
    s.money -= l.price;
    s.club = i + 1;
    GDU.save();
    if (s.club === 3) GDU.achieve('vip');
    GDU.places.upgrade();
  }));
};

/* ---------- 2. Die Nacht läuft ---------- */

function startNight(venue = 'bunker') {
  const s = GDU.state, c = GDU.config, pier = venue === 'pier';
  if (pier && s.pierUsed === s.season) return;
  const chosen = document.querySelector('input[name="promo"]:checked');
  const promo = GDU.promo(chosen ? chosen.value : 'none');
  if (s.money < promo.price) return;
  const dj = GDU.dj(s.booked), trend = GDU.trend(s.trend);
  const price = Number(document.getElementById('entry').value);

  // Ergebnis sofort berechnen und speichern (die Animation ist nur Show)
  GDU.holdHUD = true;   // ab hier: Seitenleiste und Erfolgs-Pop-ups erst bei der Abrechnung
  const nightNo = s.night;
  s.money -= promo.price;
  const warm = GDU.tonight('warmup'), door = GDU.tonight('door'), crate = GDU.tonight('crate'), mod = GDU.tonight('mod'), radio = GDU.tonight('radio');
  const r = GDU.simulateNight({ rep: s.rep, gear: s.gear, dj, price, promo, trend,
    warmup: warm ? warm.bonus : 0, door: door ? door.bonus : 0, crate: crate ? crate.guests : 0, mod,
    radio: radio && radio.spot ? GDU.radio.spotGuests : 0, club: pier ? 0 : (s.club || 0), venue });
  s.warmup = null; s.door = null; s.crate = null; s.mod = null; s.radio = null;
  if (pier) s.pierUsed = s.season;
  s.money += r.net;
  s.rep = Math.max(0, s.rep + r.rep);
  s.lastHappy = r.happy;
  s.parties++;
  s.entry = price;
  s.promo = promo.id;
  s.history.push({ night: nightNo, dj: dj.name + (pier ? ' · Pier 7' : ''), trend: trend.title, guests: r.guests, happy: r.happy, net: r.net });
  s.booked = null;
  const finished = s.night >= c.nights;
  const broke = s.money < 0;
  if (finished || broke) {
    // Saisonende sofort festhalten, auch wenn das Fenster vorzeitig geschlossen wird
    s.over = true;
    s.result = broke ? 'broke' : s.money >= GDU.goal() ? 'won' : 'goal';
    s.best = Math.max(s.best, s.money);
    GDU.recordSeason();
    if (s.result === 'won' && !s.harbor) { s.harbor = true; s.harborNew = s.season; }   // Chapter 02 freigeschaltet
  } else {
    s.night++;
    s.trend = GDU.rollTrend(s.trend);
  }
  GDU.save();
  GDU.checkNight(r, dj, { warm, door, crate, pier });

  const report = { r, dj, promo, price, finished, broke };
  const lines = [
    (pier ? 'Pier 7 öffnet. ' : 'Türen auf. ') + dj.name + ' startet das Set.',
    dj.name + ': „' + dj.line + '“',
    ...r.events.slice(0, -1),
    r.guests + (pier ? ' Gäste am Pier.' : ' Gäste im Bunker.'),
    ...r.events.slice(-1)
  ];

  GDU.holdHUD = true;   // Ergebnis in der Seitenleiste erst bei der Abrechnung zeigen
  // Live-Szene: DJ, tanzende Crowd, Licht und Musik. Das Ergebnis steht schon fest.
  GDU.liveShow.play({ nightNo, r, dj, gear: s.gear, lines, venue, onDone: () => settlement(report) });
}

/* ---------- 3. Abrechnung ---------- */

function settlement({ r, dj, promo, price, finished, broke }) {
  const s = GDU.state;
  GDU.holdHUD = false;
  GDU.renderAchievements(); GDU.flushToasts();
  const row = (label, value, cls = '') => '<tr class="' + cls + '"><td>' + label + '</td><td>' + value + '</td></tr>';
  const sign = n => (n >= 0 ? '+' : '−') + GDU.euro(Math.abs(n));
  const repText = r.rep > 0 ? '+' + r.rep : r.rep < 0 ? String(r.rep) : '±0';

  const html =
    '<div class="result-top"><div><small>Gäste</small><b>' + r.guests + '</b></div><div><small>Stimmung</small><b>' + r.happy + ' %</b></div><div><small>Ruf</small><b>' + repText + '</b></div></div>' +
    '<table class="bill">' +
    row('Tickets (' + r.guests + ' × ' + price + ' €)', sign(r.tickets)) +
    row('Bar', sign(r.bar)) +
    row('Betriebskosten', sign(-r.operating)) +
    row('<b>Ergebnis der Nacht</b>', '<b>' + sign(r.net) + '</b>', r.net >= 0 ? 'done' : 'warn') +
    row('Vorher bezahlt: Gage ' + dj.name, sign(-dj.fee), 'muted') +
    (promo.price ? row('Vorher bezahlt: ' + promo.name, sign(-promo.price), 'muted') : '') +
    '</table>' +
    '<p>Kapital jetzt: <b>' + GDU.euro(s.money) + '</b> · Ruf: <b>' + s.rep + '</b></p>' +
    (finished || broke ? '' : '<p class="note"><b>Nächste Nacht: ' + GDU.trend(s.trend).title + '.</b> ' + GDU.trend(s.trend).text + '</p>');

  // Nach der Abrechnung: eventuell eine Ereigniskarte, dann zurück in die Stadt
  const next = broke || finished ? seasonResult : () => GDU.events.maybe(GDU.close);
  GDU.modal(r.net >= 0 ? 'ABRECHNUNG · Starke Nacht' : 'ABRECHNUNG · Verlust', html,
    [[broke || finished ? 'Saison auswerten' : 'Weiter', next]]);
}

/* ---------- 4. Saisonende ---------- */

function endSeason(result) {
  const s = GDU.state;
  s.over = true;
  s.result = result;
  s.best = Math.max(s.best, s.money);
  GDU.recordSeason();
  GDU.save();
  seasonResult();
}

function seasonResult() {
  const s = GDU.state, c = GDU.config;
  const titles = {
    won: 'SAISON GESCHAFFT!',
    goal: 'SAISON VORBEI',
    broke: 'PLEITE'
  };
  const texts = {
    won: 'Bunker 99 ist die Nummer eins im Warehouse District. Die Stadt gehört dir.' +
      (s.harborNew === s.season ? '</p><div class="unlock"><b>🚇 CHAPTER 02 FREIGESCHALTET: DER HAFEN</b><span>Die Metro U9 fährt jetzt zum Hafen. Dort warten Radio Hafenfunk, die Kran-Lounge mit neuen Headlinern und die Open-Air-Bühne Pier 7. Neues Saisonziel: ' + GDU.euro(GDU.config.goal2) + '.</span></div><p>' : ''),
    goal: 'Der Club läuft, aber das Ziel von ' + GDU.euro(GDU.goal()) + ' hast du verfehlt. Nächste Saison klappt es.',
    broke: 'Das Geld ist weg. Bunker 99 muss vorerst schließen.'
  };
  const rows = s.history.map(h =>
    '<tr><td>Nacht ' + h.night + '</td><td>' + h.dj + '</td><td>' + h.guests + ' Gäste</td><td>' + h.happy + ' %</td><td class="' + (h.net >= 0 ? 'done' : 'warn') + '">' + (h.net >= 0 ? '+' : '−') + GDU.euro(Math.abs(h.net)) + '</td></tr>'
  ).join('');

  // Titel aus der Bestenliste nehmen (wurde vor einer eventuellen Chapter-Freischaltung berechnet)
  const title = ((s.hall || []).find(h => h.season === s.season) || {}).title || GDU.seasonTitle(s.money, s.result);
  const hall = (s.hall || []).map((h, i) =>
    '<tr class="' + (h.season === s.season ? 'done' : '') + '"><td>' + (i + 1) + '.</td><td>Saison ' + h.season + '</td><td>' + h.title + '</td><td>' + GDU.euro(h.money) + '</td></tr>').join('');
  GDU.modal(titles[s.result] || 'SAISON VORBEI',
    '<p class="season-title">Dein Titel: <b>' + title + '</b></p>' +
    '<p>' + texts[s.result] + '</p>' +
    '<div class="result-top"><div><small>Kapital</small><b>' + GDU.euro(s.money) + '</b></div><div><small>Ruf</small><b>' + s.rep + '</b></div><div><small>Partys</small><b>' + s.parties + '</b></div></div>' +
    (rows ? '<table class="bill history">' + rows + '</table>' : '') +
    (hall ? '<h3 class="small-h">Bestenliste</h3><table class="bill history">' + hall + '</table>' : ''),
    [['Neue Saison starten', () => {
      GDU.state = GDU.newSeason({ x: s.x, y: s.y, season: s.season, best: s.best, hall: s.hall, mute: s.mute, achievements: s.achievements, harbor: s.harbor, district: s.district });
      GDU.save();
      GDU.close();
    }], ['Schließen', GDU.close, false, 'secondary']], true);
}
