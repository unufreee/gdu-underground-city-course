/* GDU Underground City – Ereigniskarten zwischen den Nächten
   Nach der Abrechnung kommt (meistens) eine Durchsage aus dem Viertel mit zwei Entscheidungen.
   Folgen: sofort Geld und Ruf, oder Gäste und Stimmung in der nächsten Nacht.
   Alle Figuren sind erfunden. Neue Karten lassen sich einfach unten in der Liste ergänzen. */
'use strict';

window.GDU = window.GDU || {};

GDU.events = (() => {
  // Jede Wahl: { label, money?, rep?, guests?, vibe?, risk? (Wahrscheinlichkeit für „bad“), bad?: {…}, text }
  const CARDS = [
    { id: 'noise', title: 'Lärmbeschwerde', text: 'Frau Kowalski aus dem Haus gegenüber hat genug. Sie droht mit dem Ordnungsamt, wenn der Bass noch einmal ihre Gläser zum Tanzen bringt.',
      a: { label: 'Schallschutz-Matten kaufen · 120 €', money: -120, text: 'Die Matten hängen. Frau Kowalski schläft. Der Bass bleibt.' },
      b: { label: 'Ignorieren', risk: 0.5, text: 'Glück gehabt. Frau Kowalski ist übers Wochenende bei ihrer Schwester.', bad: { money: -200, rep: -2, text: 'Das Ordnungsamt kommt. 200 € Bußgeld, und die Szene redet darüber.' } } },
    { id: 'influencer', title: 'Influencer an der Tür', text: '„Ich hab 80k Follower, Schatz.“ Ein Influencer will mit Plus-Four gratis rein und verspricht eine Story.',
      a: { label: 'Reinlassen', guests: 20, vibe: -4, text: 'Die Story geht viral. Nächste Nacht kommen mehr Leute, aber auch mehr Handykameras auf der Tanzfläche.' },
      b: { label: 'Bezahlen wie alle anderen', rep: 1, text: 'Er zieht beleidigt ab. Die Stammgäste feiern dich für die Haltung.' } },
    { id: 'power', title: 'Stromausfall im Viertel', text: 'Durchsage der Stadtwerke: Morgen Nacht wird am Netz gearbeitet. Es kann flackern.',
      a: { label: 'Notstromaggregat mieten · 150 €', money: -150, text: 'Das Aggregat brummt im Hof. Egal was passiert, die Musik läuft.' },
      b: { label: 'Wird schon gutgehen', risk: 0.5, text: 'Die Leitung hält. Niemand merkt etwas.', bad: { vibe: -10, text: 'Mitten im Drop: Stromausfall. Zehn Minuten Stille. Die Stimmung erholt sich nur langsam.' } } },
    { id: 'flea', title: 'Plattenflohmarkt am Hafen', text: 'Ein alter Seemann verkauft seine Sammlung. Seltene Pressungen, Kiste für 80 €.',
      a: { label: 'Kiste kaufen · 80 €', money: -80, guests: 12, text: 'Die Raritäten sprechen sich herum. Nächste Nacht kommen die Plattennerds.' },
      b: { label: 'Weitergehen', text: 'Du gehst weiter. Irgendwo weint ein Vinyl-Sammler.' } },
    { id: 'rival', title: 'Freibier bei der Konkurrenz', text: 'Der Neonclub auf der anderen Flussseite macht morgen Freibier bis Mitternacht. Deine Gäste schauen schon nach rüber.',
      a: { label: 'Gegenhalten: Welcome-Shot · 100 €', money: -100, guests: 8, text: 'Erster Shot aufs Haus. Die Leute bleiben, ein paar kommen sogar von drüben.' },
      b: { label: 'Ignorieren', guests: -15, text: 'Ein Teil der Crowd ist morgen beim Freibier. Ihre Entscheidung.' } },
    { id: 'wallet', title: 'Fundsache an der Bar', text: 'Unter dem Tresen liegt ein Portemonnaie. 60 € drin und ein Foto von einer Katze mit Sonnenbrille.',
      a: { label: 'Zurückgeben', rep: 2, text: 'Der Besitzer bedankt sich überschwänglich und erzählt es allen. Guter Ruf.' },
      b: { label: 'Behalten', money: 60, rep: -3, text: 'Plus 60 €. Aber die Barkeeperin hat es gesehen. So etwas spricht sich herum.' } },
    { id: 'strike', title: 'Taxistreik', text: 'Durchsage: Morgen Nacht fährt kein Taxi. Die letzte Bahn geht um 0:47.',
      a: { label: 'Shuttlebus mieten · 90 €', money: -90, text: 'Der Bus pendelt bis zum Morgen. Keiner bleibt zu Hause.' },
      b: { label: 'Nichts tun', guests: -12, text: 'Einige bleiben lieber zu Hause. Ist ja auch weit bis zum Hafen.' } },
    { id: 'radio', title: 'Werbespot im Nachtradio', text: 'Radio Hafenfunk bietet einen Spot zur besten Sendezeit: 1:30 Uhr, wenn alle wach sind, die zählen.',
      a: { label: 'Spot buchen · 120 €', money: -120, guests: 18, text: '„Bunker 99. Keine Regeln. Nur Bass.“ Läuft dreimal pro Nacht.' },
      b: { label: 'Kein Budget', text: 'Kein Spot. Die Mundpropaganda muss reichen.' } },
    { id: 'streetart', title: 'Streetart-Crew', text: 'Eine Crew will die Fassade von Bunker 99 bemalen. Sie bringen alles mit, nur die Farbe fehlt.',
      a: { label: 'Farbe sponsern · 100 €', money: -100, rep: 3, text: 'Am Morgen leuchtet ein riesiges Neon-Wandbild. Fotos davon gehen durch die ganze Stadt.' },
      b: { label: 'Lieber nicht', text: 'Die Fassade bleibt grau. Grau ist auch eine Farbe. Irgendwie.' } },
    { id: 'afterhour', title: 'Afterhour-Anfrage', text: 'Die letzte Gruppe will nicht gehen. „Nur noch ein Track!“ Es ist 6:30 Uhr.',
      a: { label: 'Afterhour bis 9 Uhr', money: 140, vibe: -5, text: 'Plus 140 € an der Bar. Aber das Team ist morgen müde, und das merkt man.' },
      b: { label: 'Licht an, Feierabend', rep: 1, text: 'Licht an. Alle stöhnen. Das Team dankt es dir.' } }
  ];

  const seeded = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Nach einer Nacht: in 75 % der Fälle eine Karte, nie dieselbe zweimal pro Saison
  function maybe(done) {
    const s = GDU.state;
    if (s.over) return done();
    const rnd = seeded(s.season * 977 + s.night * 61);
    s.seenEvents = (s.seenEvents || []).filter(e => e.season === s.season);
    const seen = s.seenEvents.map(e => e.id);
    const pool = CARDS.filter(c => !seen.includes(c.id));
    if (!pool.length || rnd() > 0.75) return done();
    show(pool[Math.floor(rnd() * pool.length)], rnd, done);
  }

  function effects(o) {
    const parts = [];
    const sg = n => (n > 0 ? '+' : '−') + Math.abs(n);
    if (o.money) parts.push(sg(o.money) + ' €');
    if (o.rep) parts.push(sg(o.rep) + ' Ruf');
    if (o.guests) parts.push(sg(o.guests) + ' Gäste nächste Nacht');
    if (o.vibe) parts.push(sg(o.vibe) + ' Stimmung nächste Nacht');
    if (o.risk) parts.push('Risiko');
    return parts.join(' · ') || 'keine Folgen';
  }

  function show(card, rnd, done) {
    const s = GDU.state;
    GDU.modal('+++ DURCHSAGE +++',
      '<div class="announce"><small>Warehouse District · vor Nacht ' + s.night + '</small><b>' + card.title + '</b><p>' + card.text + '</p></div>' +
      '<div class="choices">' +
      ['a', 'b'].map(k => '<button class="choice" data-choice="' + k + '"><b>' + card[k].label + '</b><small>' + effects(card[k]) + '</small></button>').join('') +
      '</div>',
      [], true);
    document.querySelectorAll('[data-choice]').forEach(btn => btn.addEventListener('click', () => choose(card, card[btn.dataset.choice], rnd, done)));
  }

  function choose(card, opt, rnd, done) {
    const s = GDU.state;
    const res = opt.risk && rnd() < opt.risk ? { ...opt, ...opt.bad } : opt;
    if (res.money) s.money += res.money;
    if (res.rep) s.rep = Math.max(0, s.rep + res.rep);
    // Folgen für die nächste Nacht (werden in der Party verrechnet)
    s.mod = { night: s.night, season: s.season, guests: res.guests || 0, vibe: res.vibe || 0, title: card.title };
    s.seenEvents = [...(s.seenEvents || []), { id: card.id, season: s.season }];
    GDU.save();
    if (GDU.achieve && card.id === 'wallet' && opt === card.a) GDU.achieve('honest');
    GDU.modal(card.title,
      '<p>' + res.text + '</p><p class="small muted">Folgen: ' + effects({ money: res.money, rep: res.rep, guests: res.guests, vibe: res.vibe }) + '</p>' +
      (s.money < 0 ? '<p class="warn">Achtung: Das Kapital ist im Minus. Die nächste Party muss sitzen.</p>' : ''),
      [['Weiter', done]]);
  }

  return { maybe, CARDS };
})();
