# GDU Underground City – Warehouse District

**Build your empire. Live the night.**

Browserbasiertes Aufbau- und Nightlife-Management-Spiel aus dem Abschlussprojekt der WordPress-CMS-Weiterbildung (WBS). Das Spiel ist eine eigenständige HTML5-/JavaScript-Anwendung und wird über ein iframe in die WordPress-Website eingebunden.

**Live-Version:** https://unufreee.github.io/gdu-underground-city-course/

## Spielidee

Du steuerst Maria durch den Warehouse District, einen kleinen Industrie-Stadtbezirk. Mit einem Startkapital von 300 € baust du deinen ersten Underground-Club auf.

### Mission 01

1. Bei **Beat Dealers** (DJ-Agentur) einen DJ buchen – 120 €
2. Bei **Vinyl Junky** (Plattenladen) eine Soundanlage kaufen – 90 €
3. Im **Bunker 99** (Club) den Eintrittspreis festlegen und die erste Party veranstalten – 40 € Eventkosten

Der Eintrittspreis (5–25 €) beeinflusst Gästezahl, Umsatz, Gästezufriedenheit und Ruf.

## Steuerung

| Aktion | Tastatur | Touch |
|---|---|---|
| Laufen | WASD oder Pfeiltasten | Pfeil-Buttons unter dem Spielfeld |
| Gebäude betreten | E oder Enter (auf dem türkisen Eingangsfeld) | Button „E / Aktion“ |
| Fenster schließen | Esc | „Zurück“ / „Schließen“ |
| Buttons im Fenster | Tab zum Wechseln, Enter oder Leertaste zum Auslösen | antippen |

Weitere Funktionen: Tag/Nacht-Umschaltung, Minikarte, Passanten (NPCs), automatisches Speichern des Spielstands im Browser (localStorage), „Neues Spiel“ zum Zurücksetzen.

## Technik

- Reines HTML5, CSS und JavaScript – keine Bibliotheken, keine externen Bilder oder Schriften
- Grafik komplett per Canvas 2D gezeichnet (isometrische Karte 20 × 20 Felder)
- Responsive: unter 900 px Breite einspaltig mit Touch-Steuerung
- Barrierefreiheit: Dialoge mit `role="dialog"`, Fokus springt in den Dialog und zurück, Tab bleibt im Dialog, sichtbarer Tastaturfokus

### Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenaufbau: Spielfeld, Seitenleiste, Dialogfenster |
| `style.css` | Gestaltung und responsive Anpassungen |
| `game.js` | Spielwelt, Zeichenfunktionen, Spiellogik, Dialoge, Eingabe |

## Einbindung in WordPress

Auf der Seite „Spiel starten“ in einem Block **„Individuelles HTML“**:

```html
<iframe src="https://unufreee.github.io/gdu-underground-city-course/"
        title="GDU Underground City – Browsergame"
        style="width:100%; aspect-ratio:16/10; min-height:620px; border:0; border-radius:16px;"
        loading="lazy"></iframe>
```

Das iframe trennt die Gestaltung des Spiels vom Astra-Theme. Änderungen am Spiel werden über GitHub Pages veröffentlicht und erscheinen automatisch auf der WordPress-Seite.

Hinweis: Für die Tastatursteuerung muss einmal ins Spielfeld geklickt werden, damit das iframe den Fokus hat.

## Versionshistorie

| Version | Änderungen |
|---|---|
| 0.2 | Erste spielbare Version: Karte, Spielfigur, drei Gebäude, Mission 01, Speichern |
| 0.3 | Neue Grafik: Skyline, Fassaden, Dachdetails, Tag/Nacht |
| 0.4 | Passanten, Minikarte, Laufanimation |
| 0.5 | Überarbeitete Gebäude und Spielfigur, Warteschlange vor Bunker 99 |
| 1.0 | Kursversion: Code in `index.html`, `style.css` und `game.js` aufgeteilt und kommentiert, doppelte Funktionsversionen entfernt; Enter-Taste in Dialogen repariert; Fokussteuerung für Dialoge; doppelt gezeichnete Laufanimation entfernt; Hintergrund über volle Seitenhöhe; kleinere Minikarte auf dem Handy; einheitliche Versionsangaben. Spielmechanik, Grafik und Spielstände unverändert. |

## Entwicklung

Konzeption, Gestaltung und Umsetzung durch Maria Hristova, unterstützt durch KI-Werkzeuge (ChatGPT, Claude) bei Code, Fehlersuche und Dokumentation.

## Projektgrenze

Dieses Repository ist das separate Kursprojekt. Die ursprüngliche Website „going deeper underground“ und ihre Versionen sind davon unabhängig und werden hier nicht verändert.
