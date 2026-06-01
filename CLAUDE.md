# Website patrickleissner.de

Landingpage von Patrick Leißner — Energieberatung (Photovoltaik & Wärmepumpe) und Versicherungsvermittlung.

**Aktualisiert:** 2026-06-01

---

## Tatsächlicher Tech Stack (geprüft, nicht angenommen)

- **Frontend:** Klassisches HTML, CSS, Vanilla JavaScript. KEIN Framework (kein React/Next.js/Tailwind/Framer).
  - Seiten: `index.html` (Start) + Unterseiten (`termin.html`, `impressum.html`, `datenschutz.html`, `energierechner.html`, `solarisator.html` u.a.)
  - Styles: `style.css` (global) + `subpage.css` (Unterseiten). Reines CSS mit CSS-Variablen und Media Queries.
  - Logik: `main.js` (Navigation, Animationen, Zeeg-Consent, Kontaktformular)
- **Backend:** Node.js + Express + Nodemailer (`server.js`) für den E-Mail-Versand des Kontaktformulars (Double-Opt-in). Config über `dotenv` (`.env`, nicht committen).
- **Drittdienste:** Zeeg (Terminbuchung, nur nach Consent geladen). Selbst gehostet: chart.js (`assets/vendor/`), Schrift Outfit.
- **Server/Deploy:** Apache (`.htaccess`), Node ≥ 18. Deploy: GitHub (`patrickleissner-arch/Landingpage`, Branch `master`) → Hostinger, automatisch bei Push.

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
- [ ] Datenschutz §5 (Zeeg-Abschnitt): AVV-Block aus HTML-Kommentar einkommentieren, sobald Patrick den Zeeg-AVV bestätigt hat
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
