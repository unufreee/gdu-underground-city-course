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
 * @param {object} p  { rep, gear, dj, price, promo, trend, warmup? }
 * @param {function} rnd  Zufallsfunktion 0..1 (für Tests austauschbar)
 * @returns {object} Ergebnis mit Gästen, Stimmung, Umsätzen, Gewinn und Ruf-Änderung
 */
GDU.simulateNight = (p, rnd = Math.random) => {
  const c = GDU.config;
  const events = [];

  // Gäste
  const base = 15 + p.rep * 2 + p.dj.fans + p.promo.guests;
  let guests = Math.round(base * GDU.trendFactor(p.trend, p.dj) * GDU.priceFactor(p.price) * (0.9 + rnd() * 0.2));
  if (guests > c.capacity) { guests = c.capacity; events.push('Die Schlange reicht bis zur Metro. Ausverkauft!'); }

  // Stimmung
  let vibe = 50 + p.dj.vibe + (rnd() * 10 - 5);
  if (p.warmup) {   // Bonus oder Malus aus dem Beat-Battle
    vibe += p.warmup;
    events.push(p.warmup > 0 ? 'Marias Warm-up hat die Crowd schon angeheizt.' : 'Das Warm-up holpert. Der DJ muss die Stimmung erst retten.');
  }
  for (const g of GDU.gear) if (p.gear[g.id] && g.vibe) vibe += g.vibe;
  if (p.price > 12) vibe -= (p.price - 12) * 3;
  if (p.dj.wild) {
    const swing = rnd() * 35 - 15;
    vibe += swing;
    events.push(swing > 8 ? p.dj.name + ' dreht völlig durch. Die Crowd eskaliert!' : swing < -5 ? p.dj.name + ' verliert den Faden. Die Tanzfläche leert sich.' : p.dj.name + ' liefert ein solides Set.');
  }
  if (guests >= c.capacity * 0.95) { vibe -= 8; events.push('Es ist brechend voll. Nicht alle finden das gut.'); }
  if (guests < 30) { vibe -= 10; events.push('Der Club wirkt leer. Die Stimmung kommt nicht in Fahrt.'); }
  const happy = Math.round(GDU.clamp(vibe, 5, 100));

  // Geld
  const tickets = guests * p.price;
  const barRate = p.gear.bar ? (GDU.gear.find(g => g.id === 'bar').bar) : c.barPerGuest;
  const bar = Math.round(guests * barRate * (happy / 75));
  const operating = c.operatingCost;
  const net = tickets + bar - operating;   // DJ-Gage und Werbung wurden schon vorher bezahlt

  // Ruf
  let rep = Math.round((happy - 55) / 5) + (guests >= 100 ? 2 : 0);

  if (happy >= 80) events.push('Die Leute reden noch Tage über diese Nacht.');
  else if (happy < 40) events.push('Viele gehen früh. Das spricht sich herum.');

  return { guests, happy, tickets, bar, operating, net, rep, events };
};
