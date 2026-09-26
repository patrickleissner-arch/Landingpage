# Website patrickleissner.de

Landingpage von Patrick Leißner — Energieberatung (Photovoltaik & Wärmepumpe) und Versicherungsvermittlung.

**Aktualisiert:** 2026-09-26

---

## Tatsächlicher Tech Stack (geprüft, nicht angenommen)

- **Frontend:** Klassisches HTML, CSS, Vanilla JavaScript. KEIN Framework (kein React/Next.js/Tailwind/Framer).
  - Seiten: `index.html` (Start) + Unterseiten (`termin.html`, `impressum.html`, `datenschutz.html` u.a.). Rechner: `nutzen.html` (Nutzen-/Live-Cockpit), `heizkosten.html`, `unabhaengigkeit.html`, `spotpreis.html` (die alten Namen `energierechner.html`/`solarisator.html`/`waermepumpe-rechner.html` wurden am 2026-06-18 umbenannt; unter den alten Pfaden liegen nur noch Meta-Refresh-Weiterleitungen).
  - **Relaunch 26.09.2026:** Alle Seiten im neuen Design. Styles: `css/style.css` (global) + `css/pages.css` (Unterseiten). Logik: `js/main.js` (Navigation, GSAP-Animationen, Kontaktformular, Bestätigungs-Banner), `js/pages.js` (Unterseiten, FAQ), `js/scenes3d.js` (Three.js-Szenen, gebündelt und minimiert). GSAP und ScrollTrigger lokal in `assets/vendor/`, Bilder als WebP in `assets/img/`, Schrift `assets/fonts/Outfit-Variable.ttf`.
  - Neue Seite `/batteriespeicher` (Batteriespeicher & Energiehandel) mit Ertragsrechner auf echten Marktdaten 2026. Herstellerneutral: keine Hersteller- oder Anbieternamen auf der Seite.
  - Die Seiten werden aus einem Generator außerhalb des Repos gebaut (Google Drive `Website-AI-3D/src/`). Änderungen an Seiten dort vornehmen und neu bauen, sonst gehen sie beim nächsten Relaunch-Build verloren.
  - Altbestand `style.css`, `subpage.css`, `main.js` im Root wird von den neuen Seiten nicht mehr geladen und kann nach einer Übergangszeit entfallen.
- **Backend:** Node.js + Express + Nodemailer (`server.js`) für allen E-Mail-Versand: Double-Opt-in, Benachrichtigung an MAIL_TO und die Analyse-Mail des Energierechners. Config über `dotenv` (`.env`, nicht committen).
- **Drittdienste:** keine für Formulare, Versand oder CRM. Brevo ist am 25.09.2026 vollständig entfallen — Kontakt, Vertriebsvorgang und Verlauf laufen ins eigene CRM, alle Mails über den eigenen Mailserver bei Hostinger. Selbst gehostet: chart.js (`assets/vendor/`), Schrift Outfit.
- **Terminbuchung:** eigenes Easy!Appointments auf einem eigenen VPS, als iframe von `termin.patrickleissner.de` eingebunden (seit 25.09.2026, vorher Brevo Meetings). Die Einbettung funktioniert nur, weil Traefik dort `X-Frame-Options` durch `frame-ancestors 'self' https://patrickleissner.de` ersetzt — Easy!Appointments setzt die Sperre sonst selbst und der iframe bliebe leer. Höhe: `assets/js/booking-embed.js` übernimmt sie per `postMessage` vom Gegenstück `pl-embed.js` im Container (`/docker/patrick-termin/custom/`).
- **Eigenes CRM:** Bestätigte Anfragen laufen über einen n8n-Webhook (`CRM_WEBHOOK_URL`/`CRM_WEBHOOK_TOKEN`) in eine eigene PostgreSQL-Kundenverwaltung auf demselben VPS. `crmLead()` in `server.js` wirft nie — ein Ausfall darf weder die Bestätigung des Besuchers noch die Benachrichtigung blockieren.
- **Server/Deploy:** Express (`server.js`, Node ≥ 18) liefert alles aus – auch HTML/CSS. `.htaccess` wirkt dort **nicht**: Zugriffssperre (nur öffentliche Dateiendungen, keine Interna) und saubere URLs (`/termin` ohne Schrägstrich, 301 für Varianten) stehen in `server.js`. Deploy: GitHub (`patrickleissner-arch/Landingpage`, Branch `master`) → Hostinger, automatisch bei Push.

---

## Strategischer Kontext (Source-of-Truth im Vault)

Die inhaltliche Strategie wird **im Obsidian-Vault von Patrick** entwickelt (`G:\Meine Ablage\SECOND-BRAIN\Patrick\`), nicht in diesem Repo. Diese Datei und `docs/strategy-brief.md` geben dir den nötigen Kontext, ohne dass du den Vault selbst lesen musst.

**Aktuelle strategische Eckpfeiler (Stand KW22/2026):**

- **Drei klar abgegrenzte PV-Anlagenvarianten** als Beratungsleistung:
  1. **Eco** — klassische PV mit Standard-Speicher (Budget)
  2. **Premium Sigenergy SigenStor** — 5-in-1, GPT-4o-EMS, Outdoor-tauglich, modular
  3. **Solaris² + StromKontoPlus** (DWW/DSG) — Großspeicher-Modell, Stromkonto-Tarif
- **Positionierung:** „Es gibt nicht *die* PV-Anlage. Es gibt deine." — ehrlicher, beratender Energie-Experte statt Einheits-Vertrieb
- **Markenfarben:** Dunkelgrün `#2E4F3C`, Gold `#D0AB3B`, Beige `#F1F0E9`. Schrift: Outfit

Details in `docs/strategy-brief.md`.

---

## Deploy-Disziplin: Erst kontrollieren, dann pushen

Jeder Push deployt sofort live. Vor jedem Push:
- `git status` prüfen — nur beabsichtigte Dateien stagen, kein blindes `git add -A`
- Bei Rechtstexten: Code muss mit Impressum/Datenschutz übereinstimmen
- Nach dem Push: Live-Test (Cache leeren), besonders mobil
- **Keine Stand-/Aktualitätsdaten** in Rechtstexten auf „aktuell" setzen, solange das Dokument noch bekannte Fehler enthält

---

## Rechtskonformität (Deutschland)

- Impressum nach **§ 5 DDG** (Digitale-Dienste-Gesetz — hat 2024 das TMG abgelöst) und § 18 Abs. 2 MStV
- Datenschutzerklärung **DSGVO + TDDDG**, stets aktuell und mit dem tatsächlichen Verhalten der Seite übereinstimmend
- Patrick ist **Versicherungsvermittler nach § 34d GewO** (Reg.-Nr. D-ABP9-EILM2-37, IHK Halle-Dessau) → erhöhte Sorgfalt:
  - Keine Produkt-, Beitrags- oder Renditeversprechen
  - Nichts dem Zufall überlassen — bei Rechtsfragen konservative Variante wählen
  - Unsicherheiten offen kennzeichnen, statt sie zu überspielen
  - **Harte Regel:** Über diese Website werden **keine Versicherungsleistungen vermarktet**
    (Entscheidung 25.09.2026). Das Thema „Versicherungscheck" gibt es im Formular nicht mehr,
    die Seite `/analyse-vorsorge` ist entfernt und per 301 umgeleitet. Der Schutz sitzt jetzt
    in der Eingangsprüfung von `/api/contact`: `themen` wird gegen `THEMEN_LABELS` gefiltert,
    unbekannte Themen werden verworfen. Das greift auch, wenn jemand mit einer
    zwischengespeicherten Seite das alte Thema absendet — solche Daten dürfen das eigene CRM
    nicht berühren. Beim Erweitern von `THEMEN_LABELS` diese Wirkung mitbedenken.
  - Die Vermittlerangaben nach § 34d stehen weiterhin im **Impressum** und bleiben dort, bis
    anwaltlich geklärt ist, ob sie ohne Vermittlung über die Website entbehrlich sind.
- Keine externen Ressourcen ohne Consent laden (keine externen Fonts/CDNs/Tracker)
- **Mobile First** — Pflicht, nicht Option

---

## Design-Regeln

- Marke: Dunkelgrün #2E4F3C, Gold #D0AB3B, Beige #F1F0E9. Schrift: Outfit.
- Keine generischen AI-Aesthetics. Bold, distinctive Design-Choices.
- Performance-optimiert (Core Web Vitals).
- Für UI-Entscheidungen den frontend-design Skill nutzen; bei größeren Designfragen Patrick per AskUserQuestion einbinden.

---

## Pending Tasks (Quelle: Vault — Website und Markenauftritt)

**Bereits in Konzeptarbeit im Vault (warten auf Briefing):**
- [ ] Footer/Header-Refactor — Konzept wird im Vault erarbeitet, dann Briefing hierher
- [ ] Unterseiten je Variante anlegen (`/eco`, `/premium`, `/stromkontoplus` oder ähnlich) — Inhaltsstruktur kommt aus Vault
- [ ] Content-Refresh auf bestehenden Leistungs-Unterseiten anhand der drei Varianten + Rechtsrahmen 2026

**Sofort umsetzbar:**
- [x] Verwaiste Datei `impressum - Kopie.html` — war nie im Repo, erledigt
- [x] Kontaktformular SMTP — `.env` fehlte auf Server; GitHub Actions Workflow (`.github/workflows/deploy-env.yml`) schreibt sie jetzt bei jedem Push automatisch via SSH. Bestätigt 2026-06-01.

---

## Wichtig: Doku gegen Realität prüfen

- **Vor wichtigen Aussagen oder Änderungen die Realität prüfen** (tatsächliche Dateien, echter Code, Live-Stand) statt sich auf Beschreibungen zu verlassen.
- **Bei Abweichung zwischen Doku und Realität:** die Doku korrigieren, nicht ihr folgen. Patrick auf die Diskrepanz hinweisen.
- **Doku ist nur so gut wie ihr letzter Abgleich mit der Wirklichkeit.** Bei jeder Änderung mitziehen.

Diese Datei wurde am 2026-05-28 erstmals korrigiert (vorher fälschlich Next.js-Stack behauptet) und am 2026-06-01 strategisch erweitert.

---

## Briefing-Protokoll für Patrick

Beim Start einer neuen Claude-Code-Session:
1. „Lies `CLAUDE.md` und `docs/strategy-brief.md`."
2. Aktuelle Aufgabe(n) konkret benennen.
3. Wenn Aufgabe aus dem Vault kommt: Patrick gibt den Vault-Auszug als Briefing-Prompt mit (Claude Code hat keinen Vault-Zugriff).
