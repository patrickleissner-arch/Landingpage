# SEO/GEO und Website-Integration · 10.10.2026

Implementiert: sichtbarer thematischer Rechnertitel, datierte Förderübersicht, drei eigene Modellbeispiele, Berechnungsmethode und Grenzen, direkte KfW-PDF-Quelle, Herausgeberhinweis, BreadcrumbList, interne Ratgeberverknüpfung. Startseite, Navigation, Wärmepumpen- und Klimaseite verlinken den Rechner. Keine bezahlte Keywordrecherche und keine Trackingdienste.

Gesamtprüfung vor Veröffentlichung: 23 öffentliche Seiten (21 Sitemap-Seiten plus zwei bewusst nicht indexierte Rechtstextseiten), 452 interne Verweise, 41 direkt eingebundene interne Ressourcen. Keine fehlenden Titel/Beschreibungen, fehlerhaften Canonicals, doppelten IDs, kaputten Links, ungültigen JSON-LD-Blöcke oder fehlenden Bild-Altattributen in diesem Prüfungsumfang. Auch CSS-Ressourcen lokal geprüft. Keine direkt fremd eingebundenen Ressourcen im statischen HTML gefunden; dynamische Ressourcen separat im Browser prüfen.

Korrigiert: noindex-Rechtstexte aus Sitemap entfernt; sechs Seiten mit präziseren/kürzeren Metadaten; tools/ von öffentlicher Auslieferung und Routenerkennung ausgeschlossen. Generatorquelle außerhalb des Repos gezielt ergänzt; kein vollständiger Generatorlauf.

Validierung: 14 Berechnungstests erfolgreich. Alle 23 Seiten über isolierten Express-Server mit produktivem Routing geprüft. 301 für URL-Varianten inklusive Query-Parameter sowie echte 404 für unbekannte und interne Pfade bestätigt. Desktop-Sichtprüfung der neuen Inhalte erfolgreich.

Grenzen: Kein vollständiger Rechts- oder Fachinhaltsaudit aller Ratgeber, kein Rankingnachweis, keine Search-Console- oder CrUX-Felddaten. Keine Testanfrage und keine Terminbuchung abgesendet. Live-Prüfung erfolgt nach Deployment und wird separat dokumentiert.

Wiederholung: python tools/site-audit.py (Dateien) oder python tools/site-audit.py https://patrickleissner.de (HTTP). node --test tools/foerderlogik.test.cjs.
