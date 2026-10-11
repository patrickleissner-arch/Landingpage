# Heizkostenrechner – Überarbeitung am 11.10.2026

Neuer Einstieg im freigegebenen Stil: Dunkelgrün/Creme, lokale Outfit-Schrift, perspektivische Wärmepumpen-Illustration mit pausierbarem Ventilator. Mobile Komposition, gemeinsame Kopf-/Fußnavigation mit Unabhängigkeitsrechner. Räumliche Kostensäulen zeigen dieselben Jahreswerte wie die Vergleichstabelle. Eingaben, Charts und weiterführende Inhalte bleiben verfügbar.

Inline-CSS und Berechnung in eigene Dateien ausgelagert. Formeln unverändert. Bezugsjahr 2025 explizit benannt. Automatische Neuberechnung verschiebt nicht mehr bei jedem Tastendruck die Seite. Brennstoffwahl ergänzt um aria-pressed; Klimazuordnung als Region beschriftet.

## Verifikation
- Browser Desktop 1440 × 1000; mobil 390 × 844 und 360 × 640, kein horizontaler Seitenüberlauf.
- Öl-Standardfall alt/neu identisch: 1.900 € fossil, 2.304 € WP, 479 € WP+PV, 1.421 € Differenz, JAZ 2,5.
- Erdgas 20.000 kWh mit PLZ 06792: Region Halle/Dessau, 2.400 € in Tabelle und Kostensäule konsistent.
- Erweiterte Annahmen geöffnet, PV-Schieberegler bedient; Neuberechnung ohne erzwungenen Sprung zum Ergebnis.
- Animation pausiert sichtbar; reduced-motion, Offscreen- und Tab-Sichtbarkeit im Code berücksichtigt. Echte Betriebssystem-Einstellung für reduced-motion nicht separat getestet.
- JavaScript Syntaxprüfung erfolgreich. Website-Audit: 23 Seiten, 453 interne Links, 46 eingebundene lokale Assets; keine gemeldeten Probleme.

Keine neue fachliche/finanzielle Prüfung der bestehenden Modellannahmen, kein Lighthouse/CrUX-Test. Überarbeitung betrifft Darstellung und Bedienung.
