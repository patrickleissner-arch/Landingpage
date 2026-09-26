# Neue Website patrickleissner.de: Hinweise

## Dateien
- `index.html`: neue Startseite (ersetzt die bisherige index.html)
- `css/style.css`: komplettes Design (Outfit-Schrift, Grün/Gold, responsiv)
- `js/main.js`: Navigation, GSAP-Scroll-Animationen, Partner-Marquee, 3-Schritt-Kontaktformular
- `js/hero3d.js`: 3D-Partikelsonne im Hero (Three.js, fertig gebündelt und minimiert)
- `js/hero3d.src.js`: lesbarer Quellcode der 3D-Szene (wird nicht geladen)
- `assets/img/`: web-optimierte Bilder (WebP), Logos, Partnerlogos
- `assets/vendor/gsap.min.js`, `assets/vendor/ScrollTrigger.min.js`: GSAP 3, lokal (kein CDN, DSGVO-freundlich)
- `assets/fonts/Outfit-Variable.ttf`: Schrift lokal eingebunden

## Unterseiten (alle im neuen Design)
- Leistungen: `beratung-technik.html`, `koordination-netzwerk.html`, `waermepumpe-heizlast.html`, `mieterstrom.html`
- `ratgeber/index.html`, `termin.html`, `spotpreis.html`
- Rechner: `unabhaengigkeit.html`, `heizkosten.html`, `nutzen.html`
- Ratgeber-Artikel: `ratgeber/solarspitzengesetz/index.html`, `ratgeber/14a-enwg/index.html`,
  `ratgeber/heizlastberechnung/index.html`, `ratgeber/pv-speicher-vergleich/index.html`
  (URLs bleiben `/ratgeber/<name>`; Texte unverändert, nur sprachlich geglättet)
- Rechtstexte: `impressum.html`, `datenschutz.html` (Texte wortgleich übernommen, `noindex` wie bisher)
  Die Rechenlogik (Skripte) und die Rechner-Styles wurden unverändert übernommen und per Hash gegen das Original geprüft.
  Schnittstellen unverändert: `/api/spotprice`, `/api/lead`, `assets/js/pv-model.js`, `assets/js/booking-embed.js`, `assets/vendor/chart.umd.js`.
- Gemeinsames Design der Unterseiten: `css/pages.css` (baut auf `css/style.css` auf), Verhalten: `js/pages.js`
- Quellen und Generator: `src/` (je Seite `*.main.html`, bei Rechnern zusätzlich `*.style.css` und `*.script.js`), Seiten neu bauen mit
      python3 src/build.py
- Videos im Hero (90 MB und 18 MB) werden nicht mehr geladen, stattdessen die WebP-Fotos. Schneller, vor allem mobil.

## Was gleich geblieben ist
- Alle Leistungen, Kontaktdaten, Adresse, Erreichbarkeit, Partner und Social-Links
- Alle Unterseiten-Links (/beratung-technik, /waermepumpe-heizlast, /koordination-netzwerk, /mieterstrom, /ratgeber, /termin, Rechner, Impressum, Datenschutz)
- Das Kontaktformular sendet wie bisher per POST (JSON) an `/api/contact` mit denselben Feldern
  (vorname, nachname, email, phone, strasse, plz, ort, themen[], message, consentKontakt, hp_website)
  und erwartet `{ "status": "pending" }` (Double-Opt-in). Der Server muss also nicht angepasst werden.

## Deployment
1. Den Inhalt dieses Ordners (index.html, css/, js/, assets/) in das Web-Root auf dem Server kopieren.
2. Die vorhandenen Unterseiten und der Ordner `assets/` (Fotos, Video usw.) können bleiben, die neuen Dateien kommen hinzu.
3. Optional: die alte `main.js` im Root bleibt für die Unterseiten erhalten, die neue Startseite nutzt sie nicht.

## Neu bauen der 3D-Szene (nur bei Änderungen an hero3d.src.js)
    npm install three esbuild
    npx esbuild js/hero3d.src.js --bundle --minify --format=iife --target=es2019 --outfile=js/hero3d.js

## Performance
- Partikelanzahl und Pixeldichte werden auf Smartphones reduziert, das Rendering pausiert, sobald der Hero nicht sichtbar ist.
- `prefers-reduced-motion` wird respektiert (Standbild statt Animation).
- Bilder liegen in zwei Größen vor (Desktop/Mobil) und werden lazy geladen.
