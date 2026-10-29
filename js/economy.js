/* GDU Underground City – Wirtschaft der Party-Nacht
   Reine Berechnung ohne Grafik: Aus den Entscheidungen der Spielerin und dem Zufall
   entsteht das Ergebnis einer Nacht. Dadurch lässt sich die Balance auch ohne Browser testen. */
'use strict';

window.GDU = window.GDU || {};

GDU.clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Wie viele Gäste ein Eintrittspreis noch anzieht (5 € → 115 %, 15 € → 75 %, 25 € → 35 %)
GDU.priceFactor = price => GDU.clamp(1.35 - price * 0.04, 0.3, 1.2);

// Faktor des Abend-Ereignisses für einen DJ
GDU.trendFactor = (trend, dj) => {
  if (!trend) return 1;
  if (trend.genre) return trend.genre === dj.genre ? trend.mult : 1;
  return trend.mult;
};

/**
 * Berechnet eine Party-Nacht.
 * @param {object} p  { rep, gear, dj, price, promo, trend, warmup?, door?, crate?, mod?, radio?, club? (Ausbaustufe 0–3), venue? ('bunker' | 'pier') }
 * @param {function} rnd  Zufallsfunktion 0..1 (für Tests austauschbar)
 * @returns {object} Ergebnis mit Gästen, Stimmung, Umsätzen, Gewinn und Ruf-Änderung
 */
GDU.simulateNight = (p, rnd = Math.random) => {
  const c = GDU.config;
  const events = [];

  // Ort: Bunker 99 (mit Ausbaustufen) oder Pier 7 Open Air
  const pier = p.venue === 'pier';
  const levels = pier ? [] : GDU.clubLevels.slice(0, p.club || 0);
  const capacity = pier ? GDU.pier.capacity : c.capacity + levels.reduce((n, l) => n + (l.cap || 0), 0);
  const rain = p.trend && p.trend.id === 'rain';

  // Gäste
  const mod = p.mod || { guests: 0, vibe: 0 };   // Folgen einer Ereigniskarte
  const base = Math.max(5, 15 + p.rep * 2 + p.dj.fans + p.promo.guests + (p.crate || 0) + mod.guests + (p.radio || 0));   // Crate Digging und Radio-Spot: Gäste-Bonus
  const venueMult = pier ? (rain ? GDU.pier.rainMult : GDU.pier.mult) : 1;
  let guests = Math.round(base * GDU.trendFactor(p.trend, p.dj) * GDU.priceFactor(p.price) * venueMult * (0.9 + rnd() * 0.2));
  if (guests > capacity) { guests = capacity; events.push(pier ? 'Der ganze Kai ist voll. Mehr passt nicht an den Pier.' : 'Die Schlange reicht bis zur Metro. Ausverkauft!'); }

  // Stimmung
  let vibe = 50 + p.dj.vibe + (rnd() * 10 - 5);
  if (pier) {
    if (rain) { vibe += GDU.pier.rainVibe; events.push('Open Air im Starkregen. Die Harten tanzen trotzdem, alle anderen flüchten.'); }
    else { vibe += 6; events.push('Sternenhimmel, Kräne im Licht, der Bass über dem Wasser. Pier 7 bebt.'); }
  }
  for (const l of levels) vibe += l.vibe || 0;
  if (p.radio) events.push('Der Spot im Radio Hafenfunk lockt zusätzliche Leute an.');
  if (p.warmup) {   // Bonus oder Malus aus dem Beat-Battle
    vibe += p.warmup;
    events.push(p.warmup > 0 ? 'Marias Warm-up hat die Crowd schon angeheizt.' : 'Das Warm-up holpert. Der DJ muss die Stimmung erst retten.');
  }
  if (mod.guests || mod.vibe) { vibe += mod.vibe; events.push('Nachwirkung von „' + mod.title + '“: ' + (mod.guests + mod.vibe >= 0 ? 'das zahlt sich heute aus.' : 'das spürt man heute.')); }
  if (p.crate) events.push(p.crate > 0 ? 'Die neuen Platten aus der Kiste ziehen zusätzliche Fans an.' : 'Ein paar Platten passen nicht ins Set. Manche Fans bleiben weg.');
  if (p.door) {   // Bonus oder Malus aus dem Türsteher-Spiel
    vibe += p.door;
    events.push(p.door > 0 ? 'An der Tür lief alles glatt. Drinnen ist die richtige Crowd.' : 'An der Tür ist einiges schiefgelaufen. Drinnen gibt es Ärger.');
  }
  for (const g of GDU.gear) if (p.gear[g.id] && g.vibe) vibe += g.vibe;
  if (p.price > 12) vibe -= (p.price - 12) * 3;
  if (p.dj.wild) {
    const swing = rnd() * 35 - 15;
    vibe += swing;
    events.push(swing > 8 ? p.dj.name + ' dreht völlig durch. Die Crowd eskaliert!' : swing < -5 ? p.dj.name + ' verliert den Faden. Die Tanzfläche leert sich.' : p.dj.name + ' liefert ein solides Set.');
  }
  if (guests >= capacity * 0.95) { vibe -= 8; events.push('Es ist brechend voll. Nicht alle finden das gut.'); }
  if (guests < 30) { vibe -= 10; events.push('Der Club wirkt leer. Die Stimmung kommt nicht in Fahrt.'); }
  const happy = Math.round(GDU.clamp(vibe, 5, 100));

  // Geld
  const tickets = guests * p.price;
  const barRate = (p.gear.bar ? (GDU.gear.find(g => g.id === 'bar').bar) : c.barPerGuest) + levels.reduce((n, l) => n + (l.bar || 0), 0);
  const bar = Math.round(guests * barRate * (happy / 75));
  const operating = pier ? GDU.pier.operatingCost : c.operatingCost + (p.club || 0) * 40;   // größerer Club = etwas mehr Personal
  const net = tickets + bar - operating;   // DJ-Gage und Werbung wurden schon vorher bezahlt

  // Ruf
  let rep = Math.round((happy - 55) / 5) + (guests >= 100 ? 2 : 0) + levels.reduce((n, l) => n + (l.rep || 0), 0) + (pier && !rain && happy >= 70 ? 3 : 0);

  if (happy >= 80) events.push('Die Leute reden noch Tage über diese Nacht.');
  else if (happy < 40) events.push('Viele gehen früh. Das spricht sich herum.');

  return { guests, happy, tickets, bar, operating, net, rep, events, capacity, venue: pier ? 'pier' : 'bunker' };
};
