# Strategie-Briefing für Claude Code

**Zweck:** Diese Datei gibt Claude Code im Website-Repo den strategischen Kontext, ohne den Obsidian-Vault lesen zu müssen. Die Source-of-Truth bleibt im Vault (`G:\Meine Ablage\SECOND-BRAIN\Patrick\`); diese Datei wird aktualisiert, sobald sich die Strategie ändert.

**Stand:** 2026-06-01 (KW23) · **Version:** 1.1
**Vault-Referenzen:** Angebot `00 Kontext/Angebot.md` · Projekt `02 Projekte/Website und Markenauftritt.md` · Rechtsbasis `04 Ressourcen/Photovoltaik und Wärmepumpe/Rechtsrahmen PV 2026.md` · Argumentation `04 Ressourcen/Photovoltaik und Wärmepumpe/Hardware vs HEMS — der Kunden-Mehrwert.md`

---

## Patricks Positionierung

Patrick Leißner — Energieberater und Versicherungsvermittler aus Bitterfeld-Wolfen.

**Differenzierung:** Patrick verkauft nicht *eine* PV-Anlage, sondern berät ehrlich, welche von **drei abgegrenzten Varianten** zu Haus, Budget und Anspruch des Kunden passt. Kernbotschaft: **„Es gibt nicht *die* PV-Anlage. Es gibt deine."**

Gegen-Positionierung: Distanzierung von Anbietern, die alle Kunden gleich behandeln oder die teuerste Variante drängen.

---

## Produktportfolio (3 Varianten) — Kurzfassung

### Strategischer Rahmen: Hardware vs. steuerbares System

> **Eine einfache PV-Anlage verkauft Hardware. Eine intelligente PV-Anlage mit HEMS verkauft ein steuerbares Energiesystem.**

Die Gesetzeslage 2026 (Solarspitzengesetz + § 14a EnWG) macht diesen Unterschied wirtschaftlich messbar:

- Einspeisespitzen sind weniger wert geworden → Eigenverbrauch und Lastmanagement gewinnen
- § 14a-Rabatte (besonders Modul 3) werden nur mit intelligentem EMS automatisch maximal abgeholt
- 60-%-Abregelung entfällt erst mit iMSys + Fernsteuerbarkeit

**„Sweet Spot" für die meisten Eigenheim-Kunden 2026:** Variante 2 (Premium Sigenergy) ist der **rationale Standard**, nicht ein Premium-Luxus. Die Eco-Variante bleibt vertretbar **nur**, wenn **alle** folgenden Bedingungen gleichzeitig zutreffen:

1. Minimale Anfangskosten zwingend
2. Keine Wallbox geplant
3. Keine Wärmepumpe geplant
4. Kein dynamischer Tarif gewünscht
5. Bereit, geringere Optimierung zu akzeptieren

Sobald **eine** dieser Bedingungen kippt — Sektorkopplung, variable Tarife, Erweiterbarkeit, Netzdienlichkeit → intelligente Variante ist die bessere Beratungslösung.

**Konsequenz für Website-Texte:** Die Sprache muss diese Logik tragen. Eco nicht herunterspielen, aber klar als enge Ausnahme positionieren. Premium nicht als „mehr Features" verkaufen, sondern als „rationaler Standard 2026". Diese Botschaft sachlich aus der Gesetzeslogik ableiten, **nicht** als Marketingbehauptung.

### Variante 1 — Eco

- **Zielgruppe:** Budget-bewusste Einsteiger mit klarem Süddach
- **Komponenten:** PV + konventioneller Standard-Speicher („dummer" Speicher, kein intelligentes EMS)
- **Vorteil:** Niedrigster Preis, schnelle Amortisation bei guter Dachsituation
- **Einschränkung:** Reagiert nicht auf den Strommarkt → bei negativen Strompreisen (§ 51 EEG, Solarspitzengesetz) keine Einspeisevergütung, Speicher kann nicht gegensteuern

### Variante 2 — Premium Sigenergy SigenStor (5-in-1)

- **Zielgruppe:** Anspruchsvoll, zukunftsorientiert, Wert auf Autarkie + Erweiterbarkeit + Notstrom
- **Komponenten:** PV + Sigenergy SigenStor (Hybrid-Wechselrichter + Speicher + EMS in einem Turm, optional EV-DC-Lader 25 kW)
- **USPs:**
  - LFP-Zellen (sicher), kompakte Bauform (passt in HWR/Keller)
  - **Modulare Erweiterung mit eigenem BMS pro Modul** — kalendarische Alterung wird beim Nachrüsten irrelevant
  - **GPT-4o-Integration (mySigen-App)** — entscheidet autonom über Laden/Entladen/Einspeisen auf Basis von Wetter, Verbrauch und Strompreis
  - Notstrom „praktisch unterbrechungsfrei" (350 ms Backfeed-Schutz)
  - **Outdoor-tauglich (IP66, -20 °C bis +55 °C, Heizmodule ab 0 °C)** — einzige Variante mit echtem Außen-Use-Case (Carport, Außenwand, unbeheizte Garage)

### Variante 3 — Solaris² + StromKontoPlus (DWW/DSG)

- **Anbieter:** DWW Deutsche Wärmepumpen Werke GmbH (Speicher, Marke SOLARIS²) + DSG (Stromlieferant für StromKontoPlus-Tarif)
- **Zielgruppe:** Schlechte Dachsituation (Nord, Verschattung, verwinkelt), Platz für 80-kWh-Innen-Speicher, Wunsch nach Planbarkeit
- **Konzept „Stromkonto" (Brutto-Preise 2026):**
  - Freimenge: PV-kWp × 1.000 = kostenlose kWh/Jahr (0 € Grundpreis, 0 € Arbeitspreis innerhalb Freimenge)
  - Über Freimenge bis 25.000 kWh: **22 ct/kWh** brutto
  - Über 25.000 kWh: **33 ct/kWh** brutto
- **Gegenleistung — proaktiv kommunizieren:** Vertraglich gibt der Kunde dem Lieferanten zeitlich und mengenmäßig unbegrenzte Nutzung des Speichers ab; Einspeisevergütung wird abgetreten; Lieferant entscheidet über Einspeisezeitpunkt
- **Speicher-Specs:** 80,4 kWh LFP, IP41 (**nur Innenbereich, nicht outdoor**), -10 bis +45 °C, 725 kg, Modbus RTU (aber „keine Offenlegung der Kommunikationsschnittstellen" laut Hersteller)

---

## Rechtsrahmen 2026 (relevant für jede Anlage)

### § 51 + § 51a EEG — Solarspitzengesetz (seit 25.02.2025)

- Bei negativem Spotmarktpreis: **keine Einspeisevergütung mehr ab erster Viertelstunde**
- Alte 3-Stunden-Karenz ist gestrichen
- Kompensation: verlorene Viertelstunden × 0,5 werden ans Ende der 20-Jahre-Förderung gehängt
- **60-%-Abregelung** bis Smart Meter (iMSys) eingebaut ist (für PV ≤ 100 kWp)
- Einspeisevergütungssätze ab 01.02.2026: bis 10 kWp **7,78 ct/kWh** (Teil) / **12,35 ct/kWh** (Voll)

### § 14a EnWG — netzdienliche Steuerung (seit 01.01.2024)

- Betrifft neue **steuerbare Verbrauchseinrichtungen > 4,2 kW**: Wärmepumpen, Wallboxen, Klimageräte, Batteriespeicher mit Netzbezug
- Netzbetreiber darf bei Engpass auf min. 4,2 kW herunterregeln (nie ganz abschalten)
- Gegenleistung — 3 Rabatt-Module: **Modul 1** (~165 €/Jahr pauschal) / **Modul 2** (40 % Arbeitspreis Netzentgelt) / **Modul 3** (zeitvariables Netzentgelt)
- Voraussetzung: iMSys + Steuerbox

### Konsequenz für die Anlagenvarianten

| Variante | Solarspitzengesetz | § 14a EnWG |
|---|---|---|
| Eco | „Dummer" Speicher reagiert nicht → Verlust nur durch § 51a teilkompensiert | Erfüllt Pflicht, holt aber Modul 3 nicht ab |
| Premium Sigenergy | EMS lädt bei negativen Preisen + maximiert Modul-3-Rabatt automatisch | Vorteil im scheinbaren Nachteil |
| Solaris² / StromKontoPlus | Einspeisevergütung wurde sowieso abgetreten — Lieferant trägt das Risiko | Lieferant steuert ohnehin netzdienlich → Vertragsbestandteil |

---

## Markenwerte und Design-Regeln

- **Farben:** Dunkelgrün `#2E4F3C`, Gold `#D0AB3B`, Beige `#F1F0E9`
- **Schrift:** Outfit (self-hosted, kein Google Fonts)
- **Look:** Bold, ehrlich, sachlich — keine generischen AI-Aesthetics
- **Mobile First** — Pflicht
- **Performance:** Core Web Vitals optimieren
- **Sprache:** „Würde vor Dramatik" — sachlich und empathisch, nie Angst-Hebel

---

## Compliance-Anker für jede Änderung

Bei allen Änderungen an Texten — besonders rechtlich oder produktbezogen — gilt:

1. **§ 34d GewO**: keine Produkt-, Beitrags- oder Renditezusagen. Kein Versprechen, das nicht im Vertrag steht.
2. **Bei Solaris²/StromKontoPlus**: Tauschgeschäft (Freimenge gegen Einspeisevergütung + Speicherhoheit) **immer transparent benennen** — sonst Reputations- und §34d-Risiko.
3. **Bei Sigenergy**: „0 ms Notstrom" ist Marketing — korrekt: „praktisch unterbrechungsfrei, ms-Bereich, 350 ms Backfeed-Schutz".
4. **Bei Eco**: ehrlich kommunizieren, dass diese Variante das Solarspitzengesetz nicht intelligent abfedert.
5. **Outdoor-Aufstellung**: **nur Sigenergy** ist outdoor-tauglich. Bei Solaris²: IP41, nur Innen. Nicht verwechseln.

---

## Aktuelle Aufgaben (Stand 2026-06-01)

Werden im Repo via TODOs in `CLAUDE.md` getrackt. Konzept-Arbeit (Footer/Header, Variantenseiten) läuft im Vault — die Briefings kommen, sobald die Konzepte stehen.

---

## Änderungs-Historie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-06-01 (morgens) | Erstanlage: Tech-Stack, 3 Varianten, Rechtsrahmen, Markenwerte, Compliance-Anker |
| 1.1 | 2026-06-01 (mittags) | „Strategischer Rahmen: Hardware vs. steuerbares System" + Sweet-Spot-Framing für Variante 2; 5 Bedingungen für Eco-Vertretbarkeit; neuer Vault-Verweis auf „Hardware vs HEMS — der Kunden-Mehrwert.md" |
