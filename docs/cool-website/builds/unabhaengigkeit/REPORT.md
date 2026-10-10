# Unabhängigkeitsrechner · Gestaltungs- und Prüfbericht

## Umsetzung
Räumliche Arbeitsfläche mit präzisem Architekturmodell: Solardach, Speicher, Netzanschluss sowie optional Wärmepumpe und E-Auto. Live-Ergebnisse bleiben rechts beim Scrollen sichtbar. Auf Mobilgeräten führt eine schmale Ergebnisleiste zum Dashboard zurück. Tag/Abend und Blickwinkel sind per Tastatur und Touch bedienbar; Animationspause vorhanden.

Bestehendes pv-model.js unverändert. Die Animation illustriert das Prinzip und behauptet keine stündliche Simulation. Regionsertrag, Flächen, Speicher, EMS und zusätzliche Verbraucher bleiben bedienbar. HTW-Original weiter verfügbar, ausschließlich nach ausdrücklicher Zustimmung. Bestehende pauschale EMS-Versprechen im Begleittext durch eine nüchterne Beschreibung des Modellansatzes ersetzt.

Sämtliche Assets lokal. Three.js 0.169.0, esbuild 0.24.0; Bundle ca. 495 KiB unkomprimiert, erst bei Annäherung geladen. Pixelverhältnis maximal 1,5. Renderpause bei nicht sichtbarer Szene und verborgenem Tab; Reduced Motion ergibt statische Darstellung. Keine neuen Trackingdienste.

## Geprüft
- Desktop 1440×1000, mobile Ansichten 390×844 und 360×640: keine horizontalen Dokumentüberläufe, Eingaben bedienbar.
- Beispielwerte über echte Browserinteraktionen: Ausgangslage 77 % Autarkie, ohne Speicher 44 %, Wärmepumpe + E-Auto 62 %, ohne PV 0 %. Die Werte stammen aus dem bisherigen Modell.
- Zweite Dachfläche hinzufügen/entfernen, Speicher-Schnellvergleich, Tag/Abend, Pause und Druckzusammenfassung.
- Statischer Ersatzpfad mit ansicht=statisch: kein WebGL-Canvas, Originalposter sichtbar, Berechnung bleibt bedienbar.
- Kein HTW-iframe vor Zustimmung vorhanden.
- Gesamtprüfung der 23 öffentlichen Seiten: Metadaten, Canonicals, interne Links und statische Ressourcen ohne Befund.
- Syntaxprüfungen der neuen Scripts; git diff --check.

## Grenzen
Echte WebGL-Nichtverfügbarkeit und Betriebssystem-Reduced-Motion nicht emuliert; der gemeinsam verwendete Ersatzpfad wurde getestet. Nativen Druckdialog nicht automatisiert ausgeführt. Keine Echtgeräte- oder Lighthouse-/CrUX-Messung. Kein neuer Genauigkeitsnachweis für das bestehende Näherungsmodell. Kein Kontaktformular oder Termin versendet.

## Gestaltung
Ergebnisfläche statt langer Einstiegsstrecke: das Haus wird zum Bedienkontext. Farb- und Typografiesystem der bestehenden Website übernommen. Eigenständiges Merkmal gegenüber dem Förderturm: gerichtete Strombewegung zwischen konkreten Gebäudeteilen. Bildschirmaufnahmen dienen zugleich als exakte statische Ersatzdarstellung.
