# Förderrechner · Umsetzung und Prüfung

## Ergebnis
Bestehende Route /foerderrechner-waermepumpe mit bestehender Marke weiterentwickelt.
CSS-3D-Wärmepumpe mit Ventilator und Zeigerreaktion, echter WebGL-Förderturm mit materiellen Schichten und Partikelhülle.
Stichtagsvergleich verwendet identische Investitionskosten. Eigenanteil, Förderbasis und Bonusbeträge werden getrennt ausgewiesen.
Kinderangabe verändert die Einkommensgrenze, niemals den eingegebenen Betrag. Keine Speicherung oder Übermittlung von Eingaben.
Voraussetzungen, fehlende Eingaben, Mindestinvestition und genaue Inbetriebnahme werden berücksichtigt.
Die Kostenannahme umfasst nur förderfähige Investitionen; es ist keine technische Förderfähigkeitsprüfung.
Scope: Wärmepumpentausch im gesamten Wohngebäude; Sondermaßnahmen im Sondereigentum und bereits verbrauchte Förderhöchstbeträge benötigen individuelle Prüfung.

## Quellen
Nutzer-PDF (Screenshot der KfW-Produktseite vom 09.10.2026), visuell geprüft, insbesondere Seiten 1–2.
https://www.kfw.de/458
https://www.kfw.de/PDF/Download-Center/Förderprogramme-(Inlandsförderung)/PDF-Dokumente/6000005131_M_458.pdf
Merkblatt Stand 09/2026, gültig ab 24.09.2026. Online-Abgleich am 09.10.2026.
Berechnung: Grundförderung 30%, Klimabonus zunächst 16%, Einkommensbonus 40/30/10%, Deckel 80/70%, Familiengrenzen +10.000€.
Gebäudebasis: 28.000€ für erste, 15.000€ für zweite bis sechste, 8.000€ für weitere Einheit; gleichmäßige Kostenaufteilung.
Ab 01.02.2027 halbjährlich: Basis erste Einheit -750€, Klimabonus -4 Prozentpunkte bis null.
Veröffentlichte spätere Änderungen müssen vor einem Produktiv-Update neu geprüft werden; keine Prognose über den dokumentierten Regelstand hinaus.

## Technische Prüfung
`node --test tools/foerderlogik.test.cjs`: 14 Tests erfolgreich, darunter Einkommensgrenzen mit Centbeträgen, Familiengrenzen, Deckel, Defekt, 20-Jahre-Stichtag, Gebäudestaffel, Jahreswechsel, Mindestkosten, Ausschluss und KfW-Mehrfamilienhausbeispiele.
Browser: 22.400€ bei 80%, 21.800€ am nächsten Stichtag bei gleicher 28.000€-Investition; Familienwechsel 55.000€ führt zu 56%; offizielles 41.000€-Beispiel zu 15.580€.
Browser: Gas-Inbetriebnahme 01.12.2006, Antrag im Oktober 2026 vs. Februar 2027, korrekt von 8.400€ auf 11.445€.
Browser: „Voraussetzungen nein“ führt zu 0€ mit entsprechendem Hinweis.
Desktop, 390px und kompakte 360px-Ansicht visuell geprüft. Kein horizontaler Seitenüberlauf bei 360px.
Unbeabsichtigt verdeckender Kontakt-Dock auf dieser Rechnerseite ausgeblendet; Termin-CTA bleibt im Ergebnis.
Einkommensfeld reagiert jetzt bereits während der Eingabe.
Keine Browser-JavaScript-Fehler bei den geprüften Interaktionen.

## Bewegungen und Fallback
Animationen pausieren bei Offscreen/verborgenem Dokument. Globale Bewegungspause und prefers-reduced-motion werden berücksichtigt.
Ohne WebGL bleibt die CSS-Fördergrafik. Ohne JavaScript werden Rechner und Musterzahlen verborgen und ein Hinweis angezeigt.
Echte WebGL-Deaktivierung und Betriebssystem-Reduced-Motion sind nicht durch den Browser emuliert worden.
Druck-CSS und Druckaktion sind implementiert; nativer PDF-Druckdialog wurde nicht automatisiert geprüft.

## Gestaltung
Autorisierte kreative Weiterentwicklung, keine neue Gesamtseite. Die übrigen filmischen/editorialen Grammatiken hätten den eigentlichen Rechner unnötig verdeckt oder verlängert.
Feel-Check: Orientierung im Einstieg, Kontrolle im Rechner, Verständnis beim Stichtagswechsel, nachvollziehbarer Abschluss. Keine absichtlichen leeren Scrollstrecken.
Kein Bild-/Video-Dienst nötig. Vorhandene Schrift, Logo und lokale Three.js-Bibliothek genutzt; keine neuen externen Ressourcen.
SEO: Canonical, Titel, Beschreibung und strukturierte WebApplication-Daten vorhanden. Keine kostenpflichtige Keyword-Recherche beauftragt.

## Build und Übergabe
3D: `npm ci` in tools/foerderturm, danach `npm run build`. Auf diesem Rechner erfolgte der Build wegen Google-Drive-Dateifehlern in einem lokalen SSD-Arbeitsordner mit denselben Abhängigkeiten. Paket-Lockdatei liegt im Projekt.
Entwurf unter http://localhost:3917/foerderrechner-waermepumpe.
Nicht auf patrickleissner.de veröffentlicht, kein Git-Push. Dort löst ein Push auf den Release-Branch einen Live-Deploy aus.

Abschlussprüfung: Bewegungspause/Weiterrechnen im Browser erfolgreich; mobile Bonusaufteilung ergänzt. Sinkender Klimabonus wird beim Euroverlust nur dann als Ursache genannt, wenn er den Gesamtfördersatz tatsächlich senkt.
