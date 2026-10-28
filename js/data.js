/* GDU Underground City – Spieldaten
   Alle Zahlen und Texte, die das Spiel ausbalancieren, stehen hier an einer Stelle.
   Neue DJs, Ausstattung oder Ereignisse lassen sich ergänzen, ohne die Spiellogik anzufassen. */
'use strict';

window.GDU = window.GDU || {};

GDU.config = {
  startMoney: 300,      // Startkapital
  nights: 5,            // Nächte pro Saison
  goal: 5000,           // Saisonziel: Kapital nach der letzten Nacht
  operatingCost: 150,   // Betriebskosten pro Nacht (Miete, Security, Personal)
  capacity: 160,        // maximale Gäste im Bunker 99
  barPerGuest: 4        // Getränkeumsatz pro Gast bei normaler Stimmung
};

// DJs der Agentur Beat Dealers
// fans: Gäste, die der DJ mitbringt · vibe: Einfluss auf die Stimmung · wild: schwankt stark
GDU.djs = [
  { id: 'lina',    name: 'Lina Loop',   genre: 'House',       fee: 70,  fans: 25, vibe: 14, minRep: 0,
    text: 'Warme Grooves, volle Tanzfläche. Die Crowd liebt sie.' },
  { id: 'bass',    name: 'Bass Bruder', genre: 'Drum & Bass', fee: 50,  fans: 15, vibe: 4,  minRep: 0, wild: true,
    text: 'Unberechenbar. Entweder legendär oder komplettes Chaos.' },
  { id: 'voltage', name: 'DJ Voltage',  genre: 'Techno',      fee: 120, fans: 45, vibe: 10, minRep: 0,
    text: 'Harter Techno, treue Fans. Die solide Wahl.' },
  { id: 'nova',    name: 'Nova Black',  genre: 'Techno',      fee: 280, fans: 95, vibe: 22, minRep: 20,
    text: 'Headlinerin. Spielt nur in Clubs mit Ruf.' }
];

// Ausstattung aus dem Plattenladen Vinyl Junky
GDU.gear = [
  { id: 'sound', name: 'Club-Soundanlage', price: 90,  required: true,
    text: 'Gebraucht, laut, funktioniert. Meistens. Ohne Anlage keine Party.' },
  { id: 'fog',   name: 'Nebelmaschine',    price: 60,  vibe: 6,
    text: 'Geheimnisvolle Atmosphäre. Stimmung +6.' },
  { id: 'light', name: 'Lichtshow',        price: 150, vibe: 12,
    text: 'Laser, Strobo, Moving Heads. Stimmung +12.' },
  { id: 'bar',   name: 'Bar-Upgrade',      price: 200, bar: 6,
    text: 'Neue Theke, mehr Personal. 6 € statt 4 € Getränkeumsatz pro Gast.' }
];

// Werbung vor der Party
GDU.promos = [
  { id: 'none',   name: 'Keine Werbung',    price: 0,  guests: 0 },
  { id: 'flyer',  name: 'Flyer in der Stadt', price: 30, guests: 20 },
  { id: 'social', name: 'Social-Media-Kampagne', price: 80, guests: 45 }
];

// Ereignis des Abends: beeinflusst die Gästezahl, teils nur für ein Genre
GDU.trends = [
  { id: 'normal', title: 'Normaler Freitag',   text: 'Ein ganz normaler Abend im Warehouse District.', mult: 1 },
  { id: 'techno', title: 'Techno-Hype',        text: 'Ein Video aus dem Bunker 99 geht viral. Techno ist gefragt.', genre: 'Techno', mult: 1.35 },
  { id: 'house',  title: 'Semesterstart',      text: 'Die Studis sind zurück und wollen House.', genre: 'House', mult: 1.35 },
  { id: 'dnb',    title: 'Bass-Woche',         text: 'Die Drum-&-Bass-Szene ist in der Stadt.', genre: 'Drum & Bass', mult: 1.45 },
  { id: 'rain',   title: 'Starkregen',         text: 'Es schüttet. Nur die Harten kommen raus.', mult: 0.8 },
  { id: 'rival',  title: 'Hafenfestival',      text: 'Großes Festival am Hafen. Die Konkurrenz ist stark.', mult: 0.75 }
];

// Minispiele der Stadt: spielbar oder geplant
GDU.minigames = [
  { name: 'Party-Nacht',   place: 'Bunker 99',     ready: true },
  { name: 'Beat-Battle',   place: 'Bunker 99 · DJ-Pult', ready: true },
  { name: 'Crate Digging', place: 'Vinyl Junky',   ready: true },
  { name: 'Türsteher',     place: 'Bunker 99 · Tür', ready: true }
];
