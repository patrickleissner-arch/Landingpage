# AgNes-Rechner: Lastspitzen und Kostenrisiko

Überarbeitet am 11.11.2026. Direkt gepflegte Seite agnes-rechner.html,
Logik assets/js/agnes-model.js und assets/js/agnes-rechner.js.

## Ablauf
Tarif zunächst unbekannt: keine Eurozahl. Gewerbe mit Jahresleistungspreis:
gemessene Jahreshöchstleistung, gewünschte Begrenzung und tatsächlicher Preis.
Keine vorgeschlagenen Einsparquoten und kein aus Jahresverbrauch erfundener Peak.
Expliziter Beispielknopf setzt 100/70 kW und 100 EUR/kW/Jahr, als Beispiel markiert.
Haushalte/ohne Jahresleistungspreis erhalten Hinweise ohne Leistungskostenrechnung.
CTA führt zu bestehender Terminbuchung; Datenübergabe wird im Gespräch vereinbart.
Kein Upload, kein neuer Versand, keine Speicherung oder Übermittlung der Eingaben.

## Berechnung
Aktuell = Peak * Jahresleistungspreis.
Vergleich = Zielpeak * derselbe Preis.
Differenz = aktuell - Vergleich, optional mal 1/3/5 Jahre.
Nur netto Leistungskosten vor Investition und laufenden Maßnahmenkosten.
Bestätigung derselben Tarifklasse ist erforderlich; Benutzungsstunden können
sich ändern und einen Tarifwechsel auslösen. Keine Zusage der Machbarkeit.
Bereits entstandene Jahresspitzen werden nicht rückwirkend reduziert.
Mehrjahresvergleich ist konstantes Modell, kein AgNes-Zukunftstarif.

## AgNes
Getrennter qualitativer Ausblick zu bestellter Kapazität und Überschreitungen.
Keine pauschale Haushalt-Spitzengebühr, kein 2027-Countdown, kein Befreiungsvergleich.
Quellen: BNetzA Pressemitteilung 06.08.2026, Festlegungsentwurf Abschnitt 8;
EAM Netz Preissystem/Jahreshöchstleistung. Geprüft 11.11.2026.
Bei endgültiger Festlegung Inhalte erneut prüfen.

## Checks
node tools/agnes.test.cjs
Browserprüfung: unbekannter Tarif, Beispiel, Eingabefehler, Haushalt und Mobilansicht.
