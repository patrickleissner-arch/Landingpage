# Nutzenrechner – 11.10.2026

Neuer Stil passend zu Heizkosten/Unabhängigkeit. Gemeinsame Navigation und Kontakt-Dock. Ergebnislink mobil im Dokumentfluss statt über dem Kontakt-Dock. Räumlicher Monatskostenvergleich aus vorhandenen Ergebniswerten; dynamische Übergänge berücksichtigen reduced-motion. Bei fehlenden Eingaben keine Beispielkosten; bei negativen Werten verständlicher Überschusshinweis statt irreführender positiver Säulen.

Kontaktformular-Verweis und Analyse-Mail-Formular inklusive Submit-Code entfernt. Direkte Druck/PDF-Schaltfläche hinzugefügt; bestehende Druckstile erhalten. Backend bleibt unverändert. PLZ-Zuordnung ausdrücklich als Region. Keine neue Überprüfung der fachlichen Modellannahmen.

## Tests
- Referenz vor/nach Umbau gleich: PLZ 06792, Strom 4.000 kWh, Heizung 2.000 Liter, Fläche 150 m², 20 Module, Finanzierung 30.000 € → heute 265 €, neu 259 €, Differenz −6 €/Monat. Aufschlüsselung Rate 174 € + Strom 143 € − Einspeisung 58 €.
- Zins 3,5 auf 3,6 %: Monatskosten neu 260 €, Zahlen und Säulen aktualisiert.
- Reset zeigt wieder offene Angaben und keine erfundenen Kosten.
- Browser 1440×1000, 390×844, 360×640; kein Seitenüberlauf; Kontakt-Dock sichtbar, mobiler Ergebnislink nicht fixiert; keine Konsolenfehler.
- JavaScript-Syntaxprüfung und Website-Audit erfolgreich: 23 Seiten, 452 interne Links, 49 lokale Assets, keine gemeldeten Probleme.
- Druckdialog selbst nicht automatisiert ausgeführt; keine E-Mails/Formulare versendet, keine telefonischen Kontakte oder Terminbuchungen ausgelöst.
