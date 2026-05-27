# Website patrickleissner.de

Landingpage von Patrick Leißner — Energieberatung (Photovoltaik & Wärmepumpe) und Versicherungsvermittlung.

## Tatsächlicher Tech Stack (geprüft, nicht angenommen)

- **Frontend:** Klassisches HTML, CSS, Vanilla JavaScript. KEIN Framework (kein React/Next.js/Tailwind/Framer).
  - Seiten: `index.html` (Start) + Unterseiten (`termin.html`, `impressum.html`, `datenschutz.html`, `energierechner.html`, `solarisator.html` u.a.)
  - Styles: `style.css` (global) + `subpage.css` (Unterseiten). Reines CSS mit CSS-Variablen und Media Queries.
  - Logik: `main.js` (Navigation, Animationen, Zeeg-Consent, Kontaktformular)
- **Backend:** Node.js + Express + Nodemailer (`server.js`) für den E-Mail-Versand des Kontaktformulars (Double-Opt-in). Config über `dotenv` (`.env`, nicht committen).
- **Drittdienste:** Zeeg (Terminbuchung, nur nach Consent geladen). Selbst gehostet: chart.js (`assets/vendor/`), Schrift Outfit.
- **Server/Deploy:** Apache (`.htaccess`), Node ≥ 18. Deploy: GitHub (`patrickleissner-arch/Landingpage`, Branch `master`) → Hostinger, automatisch bei Push.

## Deploy-Disziplin: Erst kontrollieren, dann pushen

Jeder Push deployt sofort live. Vor jedem Push:
- `git status` prüfen — nur beabsichtigte Dateien stagen, kein blindes `git add -A`
- Bei Rechtstexten: Code muss mit Impressum/Datenschutz übereinstimmen
- Nach dem Push: Live-Test (Cache leeren), besonders mobil

## Rechtskonformität (Deutschland)

- Impressum (§5 TMG) und Datenschutzerklärung (DSGVO) müssen stets aktuell sein und mit dem tatsächlichen Verhalten der Seite übereinstimmen.
- Patrick ist Versicherungsvermittler nach §34d GewO → erhöhte Sorgfalt, keine Produkt-/Renditeversprechen, nichts dem Zufall überlassen.
- Keine externen Ressourcen ohne Consent laden (keine externen Fonts/CDNs/Tracker).
- Mobile First.

## Design-Regeln

- Marke: Dunkelgrün #2E4F3C, Gold #D0AB3B, Beige #F1F0E9. Schrift: Outfit.
- Keine generischen AI-Aesthetics. Bold, distinctive Design-Choices.
- Performance-optimiert (Core Web Vitals).
- Für UI-Entscheidungen den frontend-design Skill nutzen; bei größeren Designfragen Patrick per AskUserQuestion einbinden.

## Wichtig: Doku gegen Realität prüfen

Diese Datei wurde am 2026-05-28 korrigiert. Sie behauptete fälschlich einen Next.js-Stack, obwohl die Seite reines HTML/CSS/JS ist. Lehre: Vor dem Befolgen dieser Doku immer gegen die tatsächlichen Dateien abgleichen. Bei Abweichung die Doku korrigieren, nicht ihr blind folgen.
