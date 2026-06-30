# Strategie-Briefing für Claude Code

**Zweck:** Diese Datei gibt Claude Code im Website-Repo den strategischen Kontext, ohne den Obsidian-Vault lesen zu müssen. Die Source-of-Truth bleibt im Vault (`G:\Meine Ablage\SECOND-BRAIN\Patrick\`); diese Datei wird aktualisiert, sobald sich die Strategie ändert.

**Stand:** 2026-06-30 · **Version:** 1.3
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
- **Komponenten:** PV + Sigenergy SigenStor (Hybrid-Wechselrichter + Speicher + EMS in einem Turm, optional EV-DC-Lader 25 kW). Aktuelle Geräte-Generation: **SigenStor Neo** (bestätigt aktuell gelistetes Produkt auf sigenergy.com/de).
- **USPs:**
  - LFP-Zellen (sicher), kompakte Bauform (passt in HWR/Keller). Herstellerangabe (sigenergy.com/de, Stand 2026-06-27): 314-Ah-Zellen, 100 % Entladetiefe (nutzbare Kapazität), **5-facher** Rundum-Batterieschutz
  - **Modulare Erweiterung mit eigenem BMS pro Modul** — kalendarische Alterung wird beim Nachrüsten irrelevant
  - **GPT-4o-Integration (mySigen-App)** — entscheidet autonom über Laden/Entladen/Einspeisen auf Basis von Wetter, Verbrauch und Strompreis. Offiziell als „Sigen AI Mode" (Optimierung nach PV-Prognose/dynamischen Tarifen) und „Sigen AI Assistant" (erklärt Systemverhalten in Echtzeit) bezeichnet.
  - Notstrom „praktisch unterbrechungsfrei" (350 ms Backfeed-Schutz) — Sigenergy selbst bewirbt „0 ms Lastumschaltung" als Herstellerangabe; diese Formulierung **nicht** wörtlich übernehmen (siehe Compliance-Anker)
  - **Outdoor-tauglich (IP66, -20 °C bis +55 °C, Heizmodule ab 0 °C)** — einzige Variante mit echtem Außen-Use-Case (Carport, Außenwand, unbeheizte Garage)
  - **EV-Home-Energy-Bridge (V2H/V2G):** bidirektionales Laden bis 25 kW, Herstellerangabe „100 % Ökostrom-Laden". Laut Hersteller fahrzeugabhängig — Funktionsumfang folgt teils erst per OTA nach Veröffentlichung der Standards. Wirtschaftlich relevanter seit 01.01.2026 durch Wegfall der doppelten Netzentgeltbelastung beim bidirektionalen Laden (siehe Rechtsrahmen unten)

### Variante 3 — Solaris² + StromKontoPlus (DWW/DSG)

- **Anbieter:** DWW Deutsche Wärmepumpen Werke GmbH (Speicher, Marke SOLARIS²) + DSG Deutsche Stromhandelsgesellschaft (Stromlieferant für StromKontoPlus-Tarif)
- **Zielgruppe:** Schlechte Dachsituation (Nord, Verschattung, verwinkelt), Platz für 80-kWh-Innen-Speicher, Wunsch nach Planbarkeit
- **Quelle dieses Abschnitts:** Zwei Kunden-/Vertragsdokumente, die Patrick am 2026-06-30 übermittelt hat — ein vereinfachter Kunden-Explainer und eine detailliertere Fassung mit Ziffer-Zitaten aus den AGB/Anlagen. Nicht unabhängig (z. B. direkt beim Lieferanten) gegengeprüft — Kennzeichnung „laut DWW/DSG-Vertragsunterlagen" gilt für den gesamten Abschnitt, analog zur Sigenergy-Herstellerangaben-Konvention (Compliance-Anker Punkt 6).
- **Konzept „Stromkonto" (Brutto-Preise 2026):**
  - 0,00 € Grundpreis
  - Freimenge: PV-kWp × 1.000 = kostenlose kWh/Jahr, berechnet auf Basis der **DC-Leistung** der installierten PV-Module (nicht Wechselrichter-/AC-Leistung), laut AGB Ziffer 2.b/9.1
  - Abrechnung „First-In-First-Out": Freimenge wird zuerst verbraucht; Mehrverbrauch-1-Abrechnung beginnt erst in dem Monat, in dem die Freimenge aufgebraucht ist; bei unterjährigen Verträgen Pro-rata-Berechnung nach 360-Tage-Methode
  - Über Freimenge bis 25.000 kWh: **22 ct/kWh** brutto (Mehrverbrauch 1)
  - Über 25.000 kWh: **33 ct/kWh** brutto (Mehrverbrauch 2), Abrechnung zum Stichtag 31.12.
  - Preise sind „Alles-Inklusive" (Messentgelte, Netzentgelte, Umlagen enthalten)
  - **Übergangsphase:** Bis das Smart-Meter-Gateway (TAF 7) aktiv und vom Netzbetreiber bestätigt ist, gilt ein Übergangspreis von **32 ct/kWh brutto** auf Basis von Standardlastprofilen (SLP). In dieser Phase behält der Kunde die gesetzliche Einspeisevergütung, sie wird mit dem Verbrauch verrechnet.
  - **4 technische Startvoraussetzungen für den Wechsel ins reguläre Modell:** (1) DWW-Speicher betriebsbereit, (2) Smart-Meter + Gateway von inexogy verbaut, (3) Netzbetreiber bestätigt 15-Minuten-Erfassung (TAF 7), (4) Bestätigung nach § 14a EnWG Modul 3
- **Gegenleistung — proaktiv kommunizieren:** Kunde tritt sämtliche EEG-Ansprüche ab (Einspeisevergütung, Marktprämien, Eigenverbrauchsboni; Ziffer 11/Anlage 5); Lieferant erhält zeitlich und mengenmäßig unbegrenztes Nutzungsrecht am Speicher (Ziffer 9) und entscheidet über Einspeisezeitpunkt
  - **Unsicher, nicht gegengeprüft:** Laut der detaillierteren Quelle (Ziffer 10) darf der Lieferant nicht nur den Speicher steuern, sondern auch die **PV-Erzeugung selbst drosseln**, um Netzeinspeisung bei negativen Börsenpreisen zu verhindern — weitreichender als die reine Speichersteuerung. Vor Verwendung in Kundengesprächen oder auf der Website mit dem Vertrag/Lieferanten gegenprüfen.
  - **Unsicher, nicht gegengeprüft:** Einmalige Kosten für den Wechsel des Messstellenbetreibers (inexogy) sowie den Zählerwechsel trägt laut Ziffer 18 der Kunde — steht im Spannungsverhältnis zur „0 € Grundpreis"-Kommunikation und sollte vor Verwendung geprüft werden.
- **Speicher-Specs:** 80,4 kWh LFP, Lade-/Entladeleistung 29,9 kW, IP41 (**nur Innenbereich, nicht outdoor**), -10 bis +45 °C, 725 kg, Modbus RTU (aber „keine Offenlegung der Kommunikationsschnittstellen" laut Hersteller). Netto-Kapazität 9,5 kWh vs. Brutto-Nennkapazität 10,0 kWh pro Batteriemodul (Ziffer 2.8.f).
- **Garantie (Anlage 3) — niemals als pauschal „kostenlose 20-Jahre-Garantie" darstellen:**
  - 20 Jahre Produkt-/Leistungsgarantie, Voraussetzung: ununterbrochener Liefervertrag **und** dauerhafte Internetverbindung des Speichers — ohne dauerhafte Internetverbindung reduziert sich die Garantie auf **5 Jahre**
  - Kapazitäts-Staffel: 90 % bis Jahr 10, 80 % bis Jahr 15, 70 % ab Jahr 16
  - Zuzahlungspflichten: 500 € ab dem 11. Betriebsjahr für Systembauteile; 125 €/kWh bei Akkutausch nach Überschreiten von 12.000 Vollzyklen
  - Haftung des Lieferanten beschränkt auf Vorsatz/grobe Fahrlässigkeit (Ziffer 23); bei Netzstörungen gilt § 18 NAV
- **Service:** Fernüberwachung mit automatisierter Störungserkennung, SmartControl-App für Echtzeit-Transparenz

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
- Gegenleistung — 3 Rabatt-Module: **Modul 1** (ca. 110–190 €/Jahr brutto pauschal, regionsabhängig vom Netzbetreiber) / **Modul 2** (Reduzierung des Netzentgelt-Arbeitspreises **um 60 %** — Quelle: BNetzA, netze-bw.de) / **Modul 3** (zeitvariables Netzentgelt, nur kombinierbar mit Modul 1)
- Voraussetzung: iMSys + Steuerbox
- **Bidirektionales Laden (V2H/V2G):** seit 01.01.2026 entfällt die bisherige doppelte Netzentgeltbelastung für Speicher/bidirektionales Laden (EnWG-Novelle, unabhängig bestätigt) — macht EV-Speicher wirtschaftlich relevanter für die Premium-Variante

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
6. **Herstellerangaben (Sigenergy-Hardware)**: Effizienz-, Garantie-, Kapazitäts- und Sicherheitskennzahlen immer klar als „laut Sigenergy"/Herstellerangabe kennzeichnen, nicht als eigene geprüfte Aussage oder Zusicherung übernehmen — gilt für alles, was nicht unabhängig verifiziert werden konnte (Stand der Direktverifizierung: 2026-06-27).
7. **Bei V2H/V2G (bidirektionales Laden)**: Sigenergy selbst weist darauf hin, dass die V2X-Funktion vom jeweiligen Fahrzeug abhängt und Teile erst nach Veröffentlichung der Standards per OTA folgen. Nicht als pauschal sofort verfügbares Feature darstellen.
8. **Bei Solaris²-Garantiezusagen**: 20 Jahre sind an dauerhafte Internetverbindung **und** ununterbrochenen Liefervertrag gekoppelt (sonst nur 5 Jahre); zusätzlich gestaffelte Kapazitätsgarantie (90 %/80 %/70 %) und Zuzahlungspflichten ab Jahr 11 (500 €) bzw. bei Akkutausch (125 €/kWh). Niemals als pauschal „kostenlose 20-Jahre-Garantie" darstellen.

---

## Aktuelle Aufgaben (Stand 2026-06-01)

Werden im Repo via TODOs in `CLAUDE.md` getrackt. Konzept-Arbeit (Footer/Header, Variantenseiten) läuft im Vault — die Briefings kommen, sobald die Konzepte stehen.

---

## Änderungs-Historie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-06-01 (morgens) | Erstanlage: Tech-Stack, 3 Varianten, Rechtsrahmen, Markenwerte, Compliance-Anker |
| 1.1 | 2026-06-01 (mittags) | „Strategischer Rahmen: Hardware vs. steuerbares System" + Sweet-Spot-Framing für Variante 2; 5 Bedingungen für Eco-Vertretbarkeit; neuer Vault-Verweis auf „Hardware vs HEMS — der Kunden-Mehrwert.md" |
| 1.2 | 2026-06-27 | §14a-Modul-2-Korrektur (60 % statt 40 %) + Modul-1-Spanne; V2H/V2G-Update inkl. Fahrzeug-/OTA-Vorbehalt; Sigenergy-Hardware direkt von sigenergy.com/de verifiziert (314 Ah, 5-facher Schutz, GPT-4o, Sigen AI Mode/Assistant bestätigt; 200 %/97,8 %/SigenAgent/„mySigen 4.0" NICHT übernommen, nicht auffindbar) |
| 1.3 | 2026-06-30 | Variante 3 (Solaris²/StromKontoPlus) deutlich erweitert anhand zweier von Patrick übermittelter Kunden-/Vertragsdokumente: 0 €-Grundpreis, DC-basierte Freimengen-Berechnung, Übergangsphase (32 ct/kWh + Einspeisevergütung bleibt beim Kunden), 4 technische Startvoraussetzungen, vollständige Garantie-Staffel (90/80/70 %) inkl. Zuzahlungspflichten (500 €/125 € pro kWh), Lade-/Entladeleistung 29,9 kW, Netto-/Brutto-Kapazität pro Modul. Zwei Punkte (Messstellenbetreiber-Kosten beim Kunden, Drosselungsrecht auf PV-Erzeugung) explizit als nicht gegengeprüft markiert. Neuer Compliance-Anker-Punkt 8 (Solaris²-Garantie nicht als pauschal „kostenlos" darstellen) |
