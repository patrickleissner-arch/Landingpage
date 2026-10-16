# AgNes-Szenariorechner

Stand der Quellenprüfung: 16.10.2026. `/agnes-rechner` ist direkt gepflegt,
nicht aus dem älteren Drive-Generator erzeugt. Ausgangspunkt war der vom
Auftraggeber bereitgestellte HTML-Entwurf.

## Berechnung und Abgrenzung

Nur der angenommene Kapazitätspreis eines eigenständigen Speichers wird
verglichen: Anschlusskapazität (kW) × angenommener Preis (€/kW/Jahr).
10 €/kW/Jahr ist ausschließlich ein illustrativer Startwert, kein amtlicher
Tarif. Der Stromverbrauch dient als Projektkontext und ist bewusst kein
Rechenfaktor. Die Null im Vergleichsfall unterstellt eine anwendbare
Vollbefreiung über den gesamten gewählten Betrachtungszeitraum.

Keine Berechnung normaler Verbrauchsnetzentgelte, dynamischer Komponenten,
BKZ, Steuern, Betriebskosten, Erlöse, Abzinsung oder Gesamtrendite.
Heimspeicher und gemischte Eigenverbrauchskonzepte zeigen keine pauschale
Euroersparnis. Eine Anfrage ist kein Antrag und keine FID.

## Quellen und Aktualisierung

- https://bundesnetzagentur.de/DE/Beschlusskammern/GBK/Ebene1_Rahmen/AgNes/start.html
- https://bundesnetzagentur.de/DE/Beschlusskammern/GBK/GBK_Termine/GBK_Termine.html
- https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/20260527_AgnesKurzInfo.pdf?__blob=publicationFile&v=3

Vor endgültigem AgNes-Beschluss bzw. Änderungen der Übergangsregeln erneut
prüfen. Der Countdown endet am 01.01.2027, 00:00 Uhr Europe/Berlin, ausdrücklich
als Planungsziel und nicht als garantierte Antragsfrist. Nach Ablauf zeigt er
null und fordert die Prüfung des aktuellen Regelungsstands. Nicht automatisch
verlängern. FID, tatsächliches Inkrafttreten, Inbetriebnahme bis 04.08.2029,
§ 118 Abs. 6 EnWG und Umfang der Befreiung individuell prüfen.

## Technik und Prüfung

Three.js r128 einschließlich MIT-Lizenz lokal in assets/vendor. Keine neuen
Drittabrufe, Cookies oder Tracking. Anfrage per bestehendem E-Mail-Kontakt;
kein automatischer Versand. Reduced motion und Pausentaste werden unterstützt.
Bei fehlendem WebGL oder Bibliotheksfehler bleiben Vergleichswerte und
zweidimensionale Balken verfügbar.

`node tools/agnes.test.cjs` prüft Berechnung, Verbrauchsunabhängigkeit,
Eingabegrenzen, Umschaltung und Fristablauf. Separat mit echtem Chromium auf
1440 px und 390 px geprüft, einschließlich WebGL und reduzierter Bewegung.
