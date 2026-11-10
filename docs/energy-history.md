# Energiekosten im Monatsvergleich

Neue separate Rubrik /energiekosten-entwicklung, verlinkt von der Startseite. Strom, Heizöl, Erdgas und Tank-Flüssiggas lassen sich einzeln auswählen. Monatliche Verbraucherpreisindizes von Destatis, Datenstand September 2026 (Bericht vom 30.10.2026), mit Zellnachweisen in data.json. Fester Bezug zum Jahresdurchschnitt 2020: (Index / 100 - 1) * 100. Ausschnitte: seit 2020, 3 Jahre und 12 Monate. Keine Prognose, keine abgeleiteten Europreise, keine automatische Aktualisierung.

Quelle: https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Publikationen/Energiepreise/statistischer-bericht-energiepreisentwicklung-5619001.html
Lizenz: Datenlizenz Deutschland – Namensnennung – Version 2.0. Beim Datenupdate Quelle, Monatswerte und Datumsangaben gemeinsam prüfen und aktualisieren.

Gestaltung auf ausdrücklichen Wunsch passend zur bestehenden Website: Dunkelgrün/Gold, räumlich geschichtete Energieszene aus CSS und Inline-SVG, leichte Zeigerreaktion auf dem Einstieg, erhöhte Auswahlbuttons, Lichtkante und Schatten an der unverzerrten Diagrammfläche. Dekoration ist für Screenreader verborgen. Keine neue Bibliothek, keine externen Assets, keine dauerhaft laufende Animationsschleife. Touch erhält eine statische Szene. prefers-reduced-motion und die bestehende Animationspause werden berücksichtigt; Inhalte bleiben auch ohne Animation sichtbar.

Prüfung: node docs/energy-history-test.cjs; Syntaxprüfung aller drei JS-Dateien. Browser bei 1440 px und 390 px, ohne horizontalen Überlauf; Animationspause und Diagrammauswahl geprüft. Diagramm- und Spotpreis-Bestandsdateien außerhalb der neuen Rubrik nicht verändert. /strompreis-entwicklung leitet zur neuen Rubrik weiter.
