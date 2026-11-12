# AgNes-Rechner ersetzt
Seit 12.11.2026 ist /agnes-kostenrechner der einzige AgNes-Einstieg.
Der dort bereits vorhandene Rechner bleibt in Berechnung und Darstellung unverändert.

server.js leitet /agnes-rechner, /agnes-rechner.html und /agnes-rechner/index.html
einschließlich Slash-/Großschreibungsvarianten per 301 auf /agnes-kostenrechner um.
Queryparameter bleiben erhalten. agnes-rechner.html dient als statischer Fallback.
Startseitenmenü, Rechnerübersicht und Sitemap verwenden die neue Adresse.
Der bisherige Rücklink zum Schnellcheck führt jetzt zur Rechnerübersicht.

Prüfung: node tools/agnes.test.cjs und node tools/agnes-kosten.test.cjs.
