/* GDU Underground City – Minispiel „Party-Nacht“ im Bunker 99
   Ablauf einer Nacht: planen (Eintritt, Werbung) → Nacht läuft → Abrechnung.
   Nach der letzten Nacht wird die Saison ausgewertet. */
'use strict';

window.GDU = window.GDU || {};
GDU.places = GDU.places || {};

GDU.places.club = () => {
  const s = GDU.state;
  if (s.over) return seasonResult();

  if (!s.gear.sound) {
    return GDU.modal('BUNKER 99', '<p>Die Halle ist leer und still. <b>Ohne Soundanlage keine Party.</b></p><p>Bei <b>Vinyl Junky</b> gibt es eine gebrauchte Anlage.</p>', [['OK', GDU.close]]);
  }
  if (!s.booked) {
    const cheapest = Math.min(...GDU.djs.filter(d => d.minRep <= s.rep).map(d => d.fee));
    if (s.money < cheapest) return endSeason('broke');   // kein DJ mehr bezahlbar
    return GDU.modal('BUNKER 99', '<p>Die Anlage steht, aber <b>niemand legt auf.</b></p><p>Buch bei <b>Beat Dealers</b> einen DJ für heute Nacht.</p>', [['OK', GDU.close]]);
  }
  planner();
};

/* ---------- 1. Planung ---------- */

function planner() {
  const s = GDU.state, c = GDU.config;
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
    '<p class="small muted">Nach der Party fallen <b>' + GDU.euro(c.operatingCost) + '</b> Betriebskosten an (Miete, Security, Personal).</p>';

  // Optionale Minispiele vor der Party: Status und Effekt für heute Nacht
  const sg = n => (n > 0 ? '+' : '') + n;
  const warm = GDU.tonight('warmup'), door = GDU.tonight('door'), crate = GDU.tonight('crate');
  const line = (done, text) => '<li class="' + (done ? 'done' : 'muted') + '">' + (done ? '✓ ' : '○ ') + text + '</li>';
  const extras = '<div class="warmup"><b>Vor der Party (optional):</b><ul class="extras">' +
    line(!!crate, crate ? 'Crate Digging: ' + (crate.aborted ? 'abgebrochen' : crate.hits + ' Treffer') + ', <b>' + sg(crate.guests) + ' Gäste</b>' : 'Crate Digging bei Vinyl Junky: passende Platten bringen bis zu +18 Gäste') +
    line(!!warm, warm ? 'Warm-up: ' + (warm.aborted ? 'abgebrochen' : warm.acc + ' % getroffen') + ', <b>' + sg(warm.bonus) + ' Stimmung</b>' : 'Warm-up am DJ-Pult (Beat-Battle): bis zu +10 Stimmung') +
    line(!!door, door ? 'Türsteher: ' + (door.aborted ? 'abgebrochen' : door.acc + ' % richtig') + ', <b>' + sg(door.bonus) + ' Stimmung</b>' : 'Türsteher: die richtige Crowd reinlassen, bis zu +6 Stimmung') +
    '</ul></div>';

  GDU.modal('BUNKER 99 · Party-Nacht', html + extras, [
    ['PARTY STARTEN', startNight],
    [warm ? 'Warm-up gespielt' : '🎧 Warm-up', () => GDU.beat.open(), !!warm, 'secondary'],
    [door ? 'Tür erledigt' : '🚪 Türsteher', () => GDU.door.open(), !!door, 'secondary'],
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

/* ---------- 2. Die Nacht läuft ---------- */

function startNight() {
  const s = GDU.state, c = GDU.config;
  const chosen = document.querySelector('input[name="promo"]:checked');
  const promo = GDU.promo(chosen ? chosen.value : 'none');
  if (s.money < promo.price) return;
  const dj = GDU.dj(s.booked), trend = GDU.trend(s.trend);
  const price = Number(document.getElementById('entry').value);

  // Ergebnis sofort berechnen und speichern (die Animation ist nur Show)
  const nightNo = s.night;
  s.money -= promo.price;
  const warm = GDU.tonight('warmup'), door = GDU.tonight('door'), crate = GDU.tonight('crate');
  const r = GDU.simulateNight({ rep: s.rep, gear: s.gear, dj, price, promo, trend,
    warmup: warm ? warm.bonus : 0, door: door ? door.bonus : 0, crate: crate ? crate.guests : 0 });
  s.warmup = null; s.door = null; s.crate = null;
  s.money += r.net;
  s.rep = Math.max(0, s.rep + r.rep);
  s.lastHappy = r.happy;
  s.parties++;
  s.entry = price;
  s.promo = promo.id;
  s.history.push({ night: nightNo, dj: dj.name, trend: trend.title, guests: r.guests, happy: r.happy, net: r.net });
  s.booked = null;
  const finished = s.night >= c.nights;
  const broke = s.money < 0;
  if (finished || broke) {
    // Saisonende sofort festhalten, auch wenn das Fenster vorzeitig geschlossen wird
    s.over = true;
    s.result = broke ? 'broke' : s.money >= c.goal ? 'won' : 'goal';
    s.best = Math.max(s.best, s.money);
  } else {
    s.night++;
    s.trend = GDU.rollTrend(s.trend);
  }
  GDU.save();

  const report = { r, dj, promo, price, finished, broke };
  const lines = [
    'Türen auf. ' + dj.name + ' startet das Set.',
    ...r.events.slice(0, -1),
    r.guests + ' Gäste im Bunker.',
    ...r.events.slice(-1)
  ];

  GDU.holdHUD = true;   // Ergebnis in der Seitenleiste erst bei der Abrechnung zeigen
  GDU.modal('Nacht ' + nightNo + ' läuft …',
    '<div class="live"><div class="meter"><i id="liveBar"></i></div><ul id="liveLog" aria-live="polite"></ul></div>',
    [['Zur Abrechnung', () => settlement(report)]]);

  const log = document.getElementById('liveLog'), bar = document.getElementById('liveBar');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lines.forEach((text, i) => {
    const show = () => {
      if (!document.body.contains(log)) return;
      const li = document.createElement('li'); li.textContent = text; log.append(li);
      bar.style.width = Math.round((i + 1) / lines.length * 100) + '%';
    };
    reduced ? show() : setTimeout(show, 450 + i * 650);
  });
}

/* ---------- 3. Abrechnung ---------- */

function settlement({ r, dj, promo, price, finished, broke }) {
  const s = GDU.state;
  GDU.holdHUD = false;
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

  const next = broke || finished ? seasonResult : GDU.close;
  GDU.modal(r.net >= 0 ? 'ABRECHNUNG · Starke Nacht' : 'ABRECHNUNG · Verlust', html,
    [[broke || finished ? 'Saison auswerten' : 'Weiter', next]]);
}

/* ---------- 4. Saisonende ---------- */

function endSeason(result) {
  const s = GDU.state;
  s.over = true;
  s.result = result;
  s.best = Math.max(s.best, s.money);
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
    won: 'Bunker 99 ist die Nummer eins im Warehouse District. Die Stadt gehört dir.',
    goal: 'Der Club läuft, aber das Ziel von ' + GDU.euro(c.goal) + ' hast du verfehlt. Nächste Saison klappt es.',
    broke: 'Das Geld ist weg. Bunker 99 muss vorerst schließen.'
  };
  const rows = s.history.map(h =>
    '<tr><td>Nacht ' + h.night + '</td><td>' + h.dj + '</td><td>' + h.guests + ' Gäste</td><td>' + h.happy + ' %</td><td class="' + (h.net >= 0 ? 'done' : 'warn') + '">' + (h.net >= 0 ? '+' : '−') + GDU.euro(Math.abs(h.net)) + '</td></tr>'
  ).join('');

  GDU.modal(titles[s.result] || 'SAISON VORBEI',
    '<p>' + texts[s.result] + '</p>' +
    '<div class="result-top"><div><small>Kapital</small><b>' + GDU.euro(s.money) + '</b></div><div><small>Ruf</small><b>' + s.rep + '</b></div><div><small>Partys</small><b>' + s.parties + '</b></div></div>' +
    (rows ? '<table class="bill history">' + rows + '</table>' : ''),
    [['Neue Saison starten', () => {
      GDU.state = GDU.newSeason({ x: s.x, y: s.y, season: s.season, best: s.best });
      GDU.save();
      GDU.close();
    }], ['Schließen', GDU.close, false, 'secondary']], true);
}
