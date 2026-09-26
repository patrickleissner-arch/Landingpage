#!/usr/bin/env python3
"""Baut die Unterseiten aus den Quellsegmenten in src/ und dem Shell von index.html.

Aufruf: python3 src/build.py   (im Ordner site/)
"""
import os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

index = read(os.path.join(ROOT, 'index.html'))

def grab(pattern):
    m = re.search(pattern, index, re.S)
    assert m, pattern
    return m.group(0)

nav = grab(r'<header class="nav".*?</header>')
footer = grab(r'<footer class="footer">.*?</footer>')
dock = grab(r'<div class="dock".*?</div>')

# Startseiten-Anker und Asset-Pfade auf Unterseiten root-relativ machen
def rootify(s):
    s = s.replace('href="#leistungen"', 'href="/#leistungen"')
    s = s.replace('href="#arbeitsweise"', 'href="/#arbeitsweise"')
    s = s.replace('href="#ueber-mich"', 'href="/#ueber-mich"')
    s = s.replace('href="#kontakt"', 'href="/#kontakt"')
    s = s.replace('href="#top"', 'href="/"')
    s = s.replace('src="assets/', 'src="/assets/')
    return s

nav, footer, dock = rootify(nav), rootify(footer), rootify(dock)

IMG_MAP = {
    "assets/Foto/leistung-pv.jpg": "/assets/img/leistung-pv-1200.webp",
    "assets/Foto/leistung-wp.jpg": "/assets/img/leistung-wp-1376.webp",
    "assets/Foto/Netzwerk_Koordination_Beratung.jpg": "/assets/img/netzwerk-1600.webp",
    "assets/Foto/Mieterstrom_Solaranlage_Wohngebaeude.jpg": "/assets/img/mieterstrom-1600.webp",
    "assets/Logo/Initialien-Name-Positiv-frei.png": "/assets/Logo/Initialien-Name-Positiv-frei.png",
}

def breadcrumb(items):
    parts = ['<a href="/">Startseite</a>']
    for label, href in items[:-1]:
        parts.append(f'<a href="{href}">{label}</a>')
    parts.append(f'<span class="sp-bc-current">{items[-1][0]}</span>')
    inner = '<span class="sp-bc-sep" aria-hidden="true">›</span>'.join(parts)
    return f'<nav class="sp-breadcrumb" aria-label="Brotkrumen-Navigation"><div class="sp-breadcrumb-inner">{inner}</div></nav>'

PAGES = [
    dict(slug='beratung-technik', out='beratung-technik.html',
         title='Beratung & Technik | Patrick Leißner Energieberatung',
         desc='Beratung & Technik: individuelle Planung von Photovoltaikanlagen. Standortanalyse, Wirtschaftlichkeitsrechnung und Umsetzungsbegleitung durch Patrick Leißner.',
         scripts=['/js/pages.js']),
    dict(slug='koordination-netzwerk', out='koordination-netzwerk.html',
         title='Koordination & Netzwerk | Patrick Leißner Energieberatung',
         desc='Koordination & Netzwerk: Abstimmung mit Fachpartnern, transparente Schnittstellen und Verantwortlichkeiten bei der Umsetzung deines Energieprojekts.',
         scripts=['/js/pages.js']),
    dict(slug='waermepumpe-heizlast', out='waermepumpe-heizlast.html',
         title='Wärmepumpe & Heizlast | Patrick Leißner Energieberatung',
         desc='Wärmepumpe & Heizlast: Heizlastberechnung nach DIN, raumweise Gebäudeerfassung und 3D-LiDAR-Scan als Planungsgrundlage für Wärmepumpen.',
         scripts=['/js/pages.js']),
    dict(slug='mieterstrom', out='mieterstrom.html',
         title='Mieterstrom & Objektenergie | Patrick Leißner Energieberatung',
         desc='Mieterstrom & Objektenergie: Beratung, Projektierung und Wirtschaftlichkeitsberechnung für Mieterstrom-Modelle auf Mehrfamilienhäusern.',
         scripts=['/js/pages.js']),
    dict(slug='batteriespeicher', out='batteriespeicher.html',
         title='Batteriespeicher & Energiehandel | Patrick Leißner Energieberatung',
         desc='Batteriespeicher und Energiehandel: Flexibilität am Spotmarkt und am Regelenergiemarkt vermarkten oder eigenen Solarstrom besser nutzen. Mit Handelsrechner auf echten Börsenpreisen 2026.',
         scripts=['/assets/vendor/chart.umd.js', '/js/pages.js', '/js/scenes3d.js'], inline_script='batteriespeicher.script.js'),
    dict(slug='ratgeber', out='ratgeber/index.html',
         title='Ratgeber | Patrick Leißner Energieberatung',
         desc='Ratgeber für Photovoltaik, Wärmepumpe und Energierecht: fundierte Erklärungen zu Solarspitzengesetz, § 14a EnWG, Heizlastberechnung und Speichervergleich.',
         scripts=['/js/pages.js']),
    dict(slug='termin', out='termin.html',
         title='Termin buchen | Patrick Leißner Energieberatung',
         desc='Jetzt kostenlosen Beratungstermin mit Patrick Leißner buchen: Energieberatung zu Photovoltaik und Wärmepumpe. Online oder vor Ort in Bitterfeld-Wolfen.',
         scripts=['/js/pages.js', '/assets/js/booking-embed.js']),
    dict(slug='spotpreis', out='spotpreis.html',
         title='Spotpreis-Monitor | Patrick Leißner Energieberatung',
         desc='Aktuelle EPEX-SPOT-Day-Ahead-Strompreise für Deutschland live, inklusive negativer Preisstunden, die § 51 EEG (Solarspitzengesetz) auslösen.',
         scripts=['/assets/vendor/chart.umd.js'], inline_script='spotpreis.script.js'),
    dict(slug='unabhaengigkeit', out='unabhaengigkeit.html',
         title='Unabhängigkeitsrechner | Patrick Leißner Energieberatung',
         desc='Interaktiver Unabhängigkeitsrechner der HTW Berlin: ermittle, wie viel Strom deine PV-Anlage erzeugen könnte und wie viel du selbst nutzen kannst.',
         scripts=['/assets/js/pv-model.js'], inline_style='unabhaengigkeit.style.css', inline_script='unabhaengigkeit.script.js',
         crumbs=[('Rechner', '/#leistungen'), ('Unabhängigkeitsrechner', None)]),
    dict(slug='heizkosten', out='heizkosten.html',
         title='Heizkosten-Rechner | Patrick Leißner Energieberatung',
         desc='Heizkosten-Vergleich: Öl/Gas vs. Wärmepumpe + PV. Berechne Ersparnis, CO₂-ETS-II-Kosten und 20-Jahres-Projektion individuell für dein Gebäude.',
         scripts=['/assets/vendor/chart.umd.js'], inline_style='heizkosten.style.css', inline_script='heizkosten.script.js'),
    dict(slug='nutzen', out='nutzen.html',
         title='Nutzen-Rechner | Patrick Leißner Energieberatung',
         desc='Energiekosten-Rechner von Patrick Leißner: gib deine echten Verbrauchswerte ein und sieh, was PV und Wärmepumpe wirklich für dich bedeuten.',
         scripts=[], inline_style='nutzen.style.css', inline_script='nutzen.script.js',
         topbar=[('Rechner', '/#leistungen'), ('Nutzen-Rechner', None)],
         after_main='''<!-- Mobiles Ergebnis-Dock (immer sichtbares Geld-Ergebnis) -->
  <button type="button" class="ergebnis-dock" id="ergebnis-dock" onclick="scrollToResult()" aria-label="Zum vollständigen Ergebnis springen">
    <span class="dock-col heute"><span class="dock-label">Heute</span><span class="dock-amount" id="dock-heute">–</span></span>
    <span class="dock-col neu"><span class="dock-label">Deine Rate</span><span class="dock-amount" id="dock-neu">–</span></span>
    <span class="dock-arrow" aria-hidden="true">↑</span>
  </button>'''),
    dict(slug='rat-solarspitzengesetz', out='ratgeber/solarspitzengesetz/index.html', canonical='ratgeber/solarspitzengesetz',
         title='Solarspitzengesetz 2025 | Patrick Leißner Energieberatung',
         desc='Solarspitzengesetz 2025 (§ 51 EEG): Seit Februar 2025 entfällt die Einspeisevergütung bei negativen Strompreisen vollständig. Was das bedeutet und wie ein intelligenter Speicher schützt.',
         scripts=[]),
    dict(slug='rat-14a-enwg', out='ratgeber/14a-enwg/index.html', canonical='ratgeber/14a-enwg',
         title='§ 14a EnWG: Netzrabatt abholen | Patrick Leißner Energieberatung',
         desc='§ 14a EnWG: Wer Wallbox, Wärmepumpe oder Klimaanlage betreibt, kann dem Netzbetreiber Steuerungsrechte einräumen und dauerhaft Geld beim Netzentgelt sparen, mit dem richtigen Modul.',
         scripts=[]),
    dict(slug='rat-heizlastberechnung', out='ratgeber/heizlastberechnung/index.html', canonical='ratgeber/heizlastberechnung',
         title='Heizlastberechnung nach DIN | Patrick Leißner Energieberatung',
         desc='Heizlastberechnung nach DIN EN 12831 ist Pflicht für die KfW-Förderung der Wärmepumpe. Ohne korrekte Berechnung droht Rückforderung. Was der LiDAR-Scan damit zu tun hat.',
         scripts=[]),
    dict(slug='rat-pv-speicher-vergleich', out='ratgeber/pv-speicher-vergleich/index.html', canonical='ratgeber/pv-speicher-vergleich',
         title='PV-Speicher im Vergleich | Patrick Leißner Energieberatung',
         desc='PV-Speicher im Vergleich: Eco, Sigenergy SigenStor und Solaris². Drei grundlegend verschiedene Konzepte für drei verschiedene Situationen, ehrlich gegenübergestellt.',
         scripts=[]),
    dict(slug='impressum', out='impressum.html',
         title='Impressum | Patrick Leißner Energieberatung',
         desc='Impressum von Patrick Leißner Energieberatung, Bitterfeld-Wolfen. Pflichtangaben nach § 5 DDG.',
         scripts=[], robots='noindex, follow'),
    dict(slug='datenschutz', out='datenschutz.html',
         title='Datenschutz | Patrick Leißner Energieberatung',
         desc='Datenschutzerklärung von Patrick Leißner Energieberatung. Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.',
         scripts=[], robots='noindex, follow'),
]

TEMPLATE = """<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#0f2a23">
  <link rel="canonical" href="https://patrickleissner.de/{canonical}">
{robots}
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="https://patrickleissner.de/assets/img/patrick-1600.webp">
  <meta property="og:locale" content="de_DE">
  <link rel="icon" type="image/webp" href="/assets/img/logo-mark.webp">
  <link rel="preload" href="/assets/fonts/Outfit-Variable.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/pages.css">
{inline_style}</head>
<body class="page page--{slug}">
  <a class="skip-link" href="#main">Zum Inhalt springen</a>

{nav}

{main}

{footer}

{dock}

  <script src="/assets/vendor/gsap.min.js" defer></script>
  <script src="/assets/vendor/ScrollTrigger.min.js" defer></script>
  <script src="/js/main.js" defer></script>
{scripts}{inline_script}</body>
</html>
"""

for cfg in PAGES:
    main = read(os.path.join(SRC, cfg['slug'] + '.main.html'))
    for old, new in IMG_MAP.items():
        main = main.replace(old, new)
    if cfg.get('crumbs') and 'sp-breadcrumb' not in main:
        main = re.sub(r'(<section class="sp-hero"[^>]*>)', lambda m: m.group(1) + '\n' + breadcrumb(cfg['crumbs']), main, count=1)
    if cfg.get('topbar'):
        main = main.replace('<main id="main">', '<main id="main">\n<div class="sp-topbar"><div class="container">' + breadcrumb(cfg['topbar']) + '</div></div>', 1)
    if cfg.get('after_main'):
        main = main + '\n' + cfg['after_main']

    inline_style = ''
    if cfg.get('inline_style'):
        inline_style = '  <style>' + read(os.path.join(SRC, cfg['inline_style'])) + '</style>\n'
    inline_script = ''
    if cfg.get('inline_script'):
        inline_script = '  <script>' + read(os.path.join(SRC, cfg['inline_script'])) + '</script>\n'
    scripts = ''.join(f'  <script src="{s}"></script>\n' for s in cfg['scripts'])

    robots = f'  <meta name="robots" content="{cfg["robots"]}">\n' if cfg.get('robots') else ''
    page = TEMPLATE.format(
        title=html.escape(cfg['title'], quote=True), desc=html.escape(cfg['desc'], quote=True), slug=cfg['slug'],
        canonical=cfg.get('canonical', cfg['slug']), robots=robots,
        inline_style=inline_style, nav=nav, main=main, footer=footer, dock=dock, scripts=scripts, inline_script=inline_script)

    # Asset-Pfade relativ machen, damit die Seiten auch ohne Server (Doppelklick) funktionieren
    prefix = '../' * cfg['out'].count('/')
    for a in ('href="/css/', 'href="/assets/', 'src="/js/', 'src="/assets/', "url('/assets/"):
        page = page.replace(a, a.replace('/', prefix, 1))
    out = os.path.join(ROOT, cfg['out'])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page)
    print('built', cfg['out'], len(page) // 1024, 'KB')