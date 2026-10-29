# GDU Underground City – Warehouse District

**Build your empire. Live the night.**

Browserbasiertes Aufbau- und Nightlife-Management-Spiel aus dem Abschlussprojekt der WordPress-CMS-Weiterbildung (WBS). Das Spiel ist eine eigenständige HTML5-/JavaScript-Anwendung und wird über ein iframe in die WordPress-Website eingebunden.

**Live-Version:** https://unufreee.github.io/gdu-underground-city-course/

## Spielidee

Du steuerst Maria durch den Warehouse District. Die Stadt ist die **Zentrale**: Jedes Gebäude ist ein Ort oder ein Minispiel. Alle Minispiele teilen sich denselben Spielstand – Kapital, Ruf und Saisonfortschritt.

### Minispiel „Party-Nacht“ (spielbar)

Eine Saison hat **5 Nächte**. Ziel: **5.000 € Kapital nach der letzten Nacht**. Startkapital: 300 €.

1. **Vinyl Junky** (Plattenladen): Soundanlage kaufen (Pflicht), später Nebelmaschine, Lichtshow und Bar-Upgrade für mehr Stimmung und Umsatz.
2. **Beat Dealers** (DJ-Agentur): Für jede Nacht einen DJ buchen. Jeder DJ hat Genre, Gage, Fans und Einfluss auf die Stimmung. Die Headlinerin Nova Black bucht nur, wer genug Ruf hat.
3. **Bunker 99** (Club): Eintrittspreis und Werbung festlegen, Party starten, Abrechnung ansehen.

Jede Nacht hat ein **Ereignis** (z. B. Techno-Hype, Semesterstart, Starkregen, Hafenfestival). Wer den DJ passend zum Abend bucht, bekommt deutlich mehr Gäste. Ein zu hoher Eintritt kostet Stimmung und Ruf, zu wenig Werbung kostet Gäste. Rutscht das Kapital unter null, ist der Club pleite.

### Minispiel „Beat-Battle“ (spielbar)

Vor jeder Party kann Maria im Bunker 99 selbst das **Warm-up am DJ-Pult** spielen (Button „Warm-up spielen“ in der Party-Planung). Noten fallen in vier Spuren und werden im Takt getroffen: Tasten D F J K oder Pfeiltasten, auf dem Handy die vier Spur-Buttons. Ein Warm-up dauert etwa 15 Sekunden, das Tempo richtet sich nach dem gebuchten DJ (House 122, Techno 128, Drum & Bass 140 BPM).

| Trefferquote | Stimmung in der Party-Nacht |
|---|---|
| ab 90 % | +10 |
| ab 75 % | +7 |
| ab 55 % | +4 |
| ab 35 % | ±0 |
| darunter | −4 |

Pro Nacht gibt es einen Versuch. Wer abbricht, verbraucht den Versuch ohne Bonus. Die Musik (Kick, Hi-Hat, Snare, Bass) wird live im Browser per Web Audio erzeugt; ohne Ton läuft das Spiel genauso. Das Warm-up ist freiwillig, die Saison bleibt auch ohne es schaffbar.

### Minispiel „Türsteher“ (spielbar)

In der Party-Planung im Bunker 99 über „🚪 Türsteher“. Zehn Gäste kommen einzeln an die Tür, für jeden gibt es 6 Sekunden: **Rein** (D oder →) oder **Draußen** (A oder ←).

Regeln: Ohne Ausweis kein Einlass. Wer betrunken ist, bleibt draußen, auch mit Gästeliste. Wer auf der Gästeliste steht, kommt rein, egal was er anhat. Dazu kommt eine wechselnde Kleiderregel pro Nacht (dunkler Dresscode, kein Dresscode oder Motto „Neon Night“). Pro Runde dürfen immer 4 bis 6 von 10 Gästen rein, damit sich stures Durchwinken nicht lohnt.

| Richtige Entscheidungen | Stimmung in der Party-Nacht |
|---|---|
| ab 90 % | +6 |
| ab 70 % | +3 |
| ab 50 % | ±0 |
| darunter | −5 |

### Minispiel „Crate Digging“ (spielbar)

Bei Vinyl Junky über „🎵 In der Kiste wühlen“, sobald ein DJ gebucht ist. In 25 Sekunden bis zu 6 Platten aus einer Kiste mit 16 wählen, die zum Set passen: richtiges Genre **und** passendes Tempo (House 118–126, Techno 126–136, Drum & Bass 170–176 BPM). Jede richtige Platte bringt **+3 Gäste**, jede falsche kostet **3 Gäste**, also höchstens +18.

Alle drei Zusatzspiele (Crate Digging, Warm-up, Türsteher) sind freiwillig und einmal pro Nacht spielbar. Ihr Ergebnis gilt für die nächste Party und wird in der Party-Planung und in der Seitenleiste angezeigt.

### Live-Party (ab Version 3.0)

Startet man im Bunker 99 die Party, läuft sie als animierte Szene ab: DJ am Pult, eine tanzende Crowd (Anzahl nach Gästen, Sprunghöhe und Arme oben nach Stimmung), Laserfächer bei gekaufter Lichtshow, Bodennebel bei Nebelmaschine, beleuchtete Bar beim Bar-Upgrade. Dazu spielt Club-Musik im Genre des DJs, live im Browser erzeugt. Die Ereignisse des Abends erscheinen als Einblendung. Gäste und Stimmung zählen hoch, nach etwa 11 Sekunden geht es zur Abrechnung. Die Szene lässt sich jederzeit mit „Zur Abrechnung“ überspringen, das Ergebnis steht vorher fest.

### Lebendige Stadt (ab Version 3.0)

- Neonschilder leuchten sanft pulsierend (kein Blinken).
- Mit gekaufter Lichtshow schießen nachts Laser aus dem Dach von Bunker 99, mit Nebelmaschine quillt Nebel aus der Tür.
- Beim Ereignis „Starkregen“ regnet es über dem Viertel.
- **Bass durch die Wand:** Je näher Maria an Bunker 99 steht, desto lauter und klarer wird der gedämpfte Bass aus dem Club.
- Schalter **„Ton an / Ton aus“** in der Steuerung gilt für alle Klänge und wird gespeichert. Ton startet erst nach dem ersten Tastendruck oder Klick (Browser-Regel).

### Titel und Bestenliste (ab Version 3.0)

Am Saisonende gibt es einen Titel nach Kapital: Kellerkind (unter 2.500 €), Szene-Insider, Szene-Größe (Ziel erreicht), Club-Legende (ab 7.000 €), Königin der Nacht (ab 9.000 €), bei Pleite „Pleitegeier“. Die fünf besten Saisons stehen in der Bestenliste; die Bestleistung zeigt auch die Seitenleiste.

### Ereigniskarten (ab Version 3.1)

Nach der Abrechnung einer Nacht kommt meistens (in etwa 75 % der Fälle) eine **Durchsage** aus dem Viertel mit zwei Entscheidungen, zum Beispiel Lärmbeschwerde, Influencer an der Tür, Stromausfall, Plattenflohmarkt, Freibier bei der Konkurrenz, Fundsache an der Bar, Taxistreik, Werbespot im Nachtradio, Streetart-Crew oder Afterhour-Anfrage. Die Folgen wirken sofort (Geld, Ruf) oder in der nächsten Nacht (Gäste, Stimmung); manche Entscheidungen sind ein Risiko. Jede Karte kommt höchstens einmal pro Saison. Alle Figuren sind erfunden. Neue Karten lassen sich in `js/events.js` ergänzen.

### Erfolge (ab Version 3.1)

Zwölf Erfolge, zum Beispiel „Ausverkauft“, „Ekstase“ (90 % Stimmung), „Perfekte Tür“, „Goldene Kiste“, „Volles Programm“ (alle drei Zusatzspiele in einer Nacht), „Ehrliche Haut“ oder „Königin der Nacht“. Beim Freischalten erscheint ein Pop-up, die Sammlung steht in der Seitenleiste. Erfolge und Bestenliste bleiben über Saisons hinweg erhalten; nur „Neues Spiel“ setzt sie zurück.

### Sprechende Passanten (ab Version 3.1)

Steht Maria direkt neben einem Passanten, bleibt er stehen und sagt etwas: Sprüche aus dem Viertel und versteckte Tipps, etwa welches Genre heute gefragt ist oder ab welchem Ruf die Headlinerin bucht.

### Barrierefreiheit und Effekte

Höchstens 3 Lichtblitze pro Sekunde (der Strobe in der Live-Party blitzt nur alle zwei Takte und nur bei sehr guter Stimmung). Bei der Systemeinstellung „Bewegung reduzieren“ steht die Stadt still, die Crowd tanzt nicht, Laser schwenken nicht, Regen und Nebel ziehen nicht, und es gibt keinen Strobe.

## Steuerung

| Aktion | Tastatur | Touch |
|---|---|---|
| Laufen | WASD oder Pfeiltasten | Pfeil-Buttons unter dem Spielfeld |
| Gebäude betreten | E oder Enter (auf dem türkisen Eingangsfeld) | Button „E / Betreten“ |
| Fenster schließen | Esc | „Zurück“ / „Schließen“ |
| Im Fenster | Tab wechseln, Enter oder Leertaste auslösen, Pfeiltasten für Regler und Auswahl | antippen |
| Beat-Battle | D F J K oder Pfeiltasten, Esc bricht ab | Spur-Buttons unter dem Spielfeld |
| Türsteher | D oder → = Rein, A oder ← = Draußen | Buttons „Rein“ / „Draußen“ |
| Crate Digging | Tab und Enter | Platten antippen |

Weitere Funktionen: Tag/Nacht-Umschaltung, Minikarte, Passanten, automatisches Speichern im Browser (localStorage), „Neues Spiel“ zum kompletten Zurücksetzen.

## Technik

- Reines HTML5, CSS und JavaScript – keine Bibliotheken, keine externen Bilder oder Schriften
- Grafik komplett per Canvas 2D gezeichnet (isometrische Karte 20 × 20 Felder)
- Responsive: unter 900 px Breite einspaltig mit Touch-Steuerung
- Barrierefreiheit: Dialoge mit `role="dialog"`, Fokus springt in den Dialog und zurück, Tab bleibt im Dialog, sichtbarer Tastaturfokus, Fortschrittsbalken mit ARIA-Werten, Animationen respektieren „Bewegung reduzieren“

### Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenaufbau: Spielfeld, Seitenleiste, Dialogfenster |
| `style.css` | Gestaltung und responsive Anpassungen |
| `js/data.js` | Alle Spieldaten: DJs, Ausstattung, Werbung, Ereignisse, Saisonziel |
| `js/economy.js` | Berechnung einer Party-Nacht (Gäste, Stimmung, Umsatz, Ruf) |
| `js/core.js` | Spielstand, Speichern, Seitenleiste, Dialogfenster |
| `js/city.js` | Die Stadt: Karte, Gebäude, Spielfigur, Passanten, Minikarte |
| `js/locations.js` | Orte: Beat Dealers und Vinyl Junky |
| `js/events.js` | Ereigniskarten zwischen den Nächten |
| `js/achievements.js` | Erfolge, Pop-ups und Sammlung in der Seitenleiste |
| `js/audio.js` | Sound: Club-Musik per Web Audio, Bass durch die Wand, Ton an/aus |
| `js/games/live-show.js` | Live-Party: animierte Club-Szene mit Crowd, Licht, Nebel und Musik |
| `js/games/party-night.js` | Minispiel Party-Nacht: Planung, Nacht, Abrechnung, Saisonende |
| `js/games/beat-battle.js` | Minispiel Beat-Battle: Notenmuster, Musik per Web Audio, Treffer, Bonus |
| `js/games/door.js` | Minispiel Türsteher: Gäste, Regeln des Abends, Zeitlimit, Bonus |
| `js/games/crate-digging.js` | Minispiel Crate Digging: Plattenkiste nach Genre und BPM, Gäste-Bonus |
| `js/main.js` | Start, Tastatur- und Touch-Steuerung |

### Ein neues Minispiel ergänzen

1. Neue Datei unter `js/games/` anlegen, die eine Funktion `GDU.places.<gebäude-id>` bereitstellt.
2. In `index.html` vor `js/main.js` einbinden.
3. Bei Bedarf ein Gebäude in `GDU.buildings` (`js/city.js`) ergänzen und den Eintrag in `GDU.minigames` (`js/data.js`) auf `ready: true` setzen.

### Spielbalance

Die Zahlen in `js/data.js` wurden mit einer Simulation von je 4.000 Saisons geprüft. Mit Version 2.3 stieg das Saisonziel von 4.000 € auf 5.000 €, weil die neuen Minispiele zusätzliche Gäste und Stimmung bringen. So zählen die Minispiele spürbar:

| Spielweise | ohne Minispiele | mit mittleren Minispiel-Ergebnissen | mit guten Minispiel-Ergebnissen |
|---|---|---|---|
| Durchdacht (DJ passend zum Abend, Werbung, Technik) | ca. 99 % | ca. 100 % | ca. 100 % |
| Solide (immer DJ Voltage, 12 € Eintritt, Flyer) | ca. 8 % | ca. 55 % | ca. 87 % |
| Zufällige Entscheidungen | ca. 0 % | ca. 4 % | ca. 13 % |
| Billigster DJ ohne Werbung / Abzocke mit 25 € Eintritt | 0 % | 0 % | 0 % |

## Einbindung in WordPress

Auf der Seite „Spiel starten“ in einem Block **„Individuelles HTML“**:

```html
<iframe src="https://unufreee.github.io/gdu-underground-city-course/"
        title="GDU Underground City – Browsergame"
        style="width:100%; aspect-ratio:16/10; min-height:620px; border:0; border-radius:16px;"
        loading="lazy"></iframe>
```

Das iframe trennt die Gestaltung des Spiels vom Astra-Theme. Änderungen am Spiel werden über GitHub Pages veröffentlicht und erscheinen automatisch auf der WordPress-Seite.

Hinweis: Für die Tastatursteuerung muss einmal ins Spielfeld geklickt werden, damit das iframe den Fokus hat. Solange das Spiel keinen Fokus hat, blendet es selbst den Hinweis „Ins Spiel klicken, um zu starten“ ein.

## Demo-Modus für Präsentationen

Die Adresse **https://unufreee.github.io/gdu-underground-city-course/?demo** startet mit einem vorbereiteten Spielstand: Saison 1, Nacht 3 von 5, 1.250 € Kapital, Ruf 12, Soundanlage und Nebelmaschine gekauft, Ereignis „Techno-Hype“, Maria steht vor Beat Dealers. So lassen sich DJ-Buchung, Beat-Battle, Party-Nacht und Abrechnung in wenigen Minuten zeigen.

- Oben neben dem Kapitel erscheint ein pinkes **DEMO**-Abzeichen.
- Der Demo-Spielstand wird getrennt gespeichert. Der normale Spielstand bleibt unberührt.
- „Demo zurücksetzen“ stellt den Anfangsstand der Demo wieder her.

## Versionshistorie

| Version | Änderungen |
|---|---|
| 0.2 | Erste spielbare Version: Karte, Spielfigur, drei Gebäude, Mission 01, Speichern |
| 0.3 | Neue Grafik: Skyline, Fassaden, Dachdetails, Tag/Nacht |
| 0.4 | Passanten, Minikarte, Laufanimation |
| 0.5 | Überarbeitete Gebäude und Spielfigur, Warteschlange vor Bunker 99 |
| 1.0 | Kursversion: Code aufgeteilt und kommentiert, Enter-Taste und Fokus in Dialogen repariert, einheitliche Versionsangaben. Gesichert im Branch `version-1.0`. |
| 2.0 | Stadt als Zentrale für Minispiele. Neues Minispiel **Party-Nacht** mit Saison über 5 Nächte, Saisonziel, 4 DJs, Ausstattung, Werbung, Abend-Ereignissen, Abrechnung, Sieg- und Niederlagebedingung. Warteschlange vor dem Club wächst mit dem Ruf. Code in Module aufgeteilt, Spielbalance per Simulation geprüft. Gesichert im Branch `version-2.0`. |
| 2.1 | Neues Minispiel **Beat-Battle** am DJ-Pult: Rhythmusspiel mit vier Spuren, live erzeugter Musik je nach DJ-Genre, Stimmungsbonus von −4 bis +10 für die Party-Nacht, ein Versuch pro Nacht, Touch-Buttons für das Handy. Spielstände aus Version 2.0 bleiben erhalten. Gesichert im Branch `version-2.1`. |
| 2.2 | Letzte Version vor dem Feature-Stopp (30.10.): Fokus-Hinweis im iframe („Ins Spiel klicken, um zu starten“), **Demo-Modus** über `?demo` mit vorbereitetem Spielstand für die Präsentation. Spielmechanik, Grafik und Spielstände unverändert. Gesichert im Branch `version-2.2`. |
| 2.3 | Zwei neue Minispiele: **Türsteher** (Gäste nach Regeln einlassen, −5 bis +6 Stimmung) und **Crate Digging** (passende Platten nach Genre und BPM finden, −18 bis +18 Gäste). Party-Planung und Seitenleiste zeigen alle drei Zusatzspiele. Saisonziel von 4.000 € auf 5.000 € angehoben, Balance per Simulation neu geprüft. Spielstände aus 2.2 und Demo-Modus bleiben erhalten. Gesichert im Branch `version-2.3`. |
| 3.0 | **Live-Version:** animierte Live-Party mit tanzender Crowd, Lasern, Nebel und Club-Musik im Genre des DJs; lebendige Stadt mit pulsierenden Neonschildern, Lasern und Nebel am Bunker 99 und Regen bei Starkregen; Bass durch die Wand je nach Nähe zum Club; Ton-an/aus-Schalter; Titel und Bestenliste. Höchstens 3 Lichtblitze pro Sekunde, „Bewegung reduzieren“ wird beachtet. Spielstände aus 2.3 und Demo-Modus bleiben erhalten. Gesichert im Branch `version-3.0`. |
| 3.1 | **Story-Version:** Ereigniskarten zwischen den Nächten mit Entscheidungen und Folgen, zwölf Erfolge mit Pop-ups und Sammlung, sprechende Passanten mit Tipps. Fehler behoben: Ton-Einstellung und Erfolge blieben beim Start einer neuen Saison nicht erhalten. Spielstände aus 3.0 und Demo-Modus bleiben erhalten. |

## Entwicklung

Konzeption, Gestaltung und Umsetzung durch Maria Hristova, unterstützt durch KI-Werkzeuge (ChatGPT, Claude) bei Code, Spielbalance, Fehlersuche und Dokumentation.

## Projektgrenze

Dieses Repository ist das separate Kursprojekt. Die ursprüngliche Website „going deeper underground“ und ihre Versionen sind davon unabhängig und werden hier nicht verändert.
