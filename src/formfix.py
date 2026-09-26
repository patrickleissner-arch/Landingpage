#!/usr/bin/env python3
"""Formularfelder der drei Rechner nach den Web Interface Guidelines:
name, autocomplete, Platzhalter mit Auslassungszeichen, Beschriftungen,
Schaltfläche statt klickbarem div. Die Rechenlogik bleibt unberührt, es
werden nur Attribute und Vorlagen-Strings ergänzt. Idempotent.

Aufruf: python3 src/formfix.py   (im Ordner site/)
"""
import re, os

SRC = os.path.dirname(os.path.abspath(__file__))

def lesen(n): return open(os.path.join(SRC, n), encoding='utf-8').read()
def schreiben(n, s): open(os.path.join(SRC, n), 'w', encoding='utf-8').write(s)

def attr(tag, name):
    m = re.search(r'\s' + name + r'="([^"]*)"', tag)
    return m.group(1) if m else None

def feld_korrigieren(tag):
    """Ein einzelnes <input>, <select> oder <textarea>-Start-Tag."""
    if attr(tag, 'type') == 'hidden':
        return tag
    ende = '>' if not tag.endswith('/>') else '/>'
    kopf = tag[:-len(ende)]
    fid = attr(tag, 'id')
    if fid and attr(tag, 'name') is None:
        kopf += f' name="{fid}"'
    if attr(tag, 'autocomplete') is None:
        ac = 'postal-code' if fid and re.search(r'(^|-)plz$', fid) else 'off'
        kopf += f' autocomplete="{ac}"'
    ph = attr(kopf, 'placeholder')
    if ph and not ph.endswith('…') and '${' not in ph:
        neu = ph if ph.startswith(('z. B.', '0 =', '+49')) or not re.match(r'^[\d.,]+$', ph) else 'z. B. ' + ph.replace('.', ',')
        kopf = kopf.replace(f'placeholder="{ph}"', f'placeholder="{neu}…"', 1)
    if attr(kopf, 'type') == 'email' and attr(kopf, 'spellcheck') is None:
        kopf += ' spellcheck="false"'
    return kopf + ende

def felder(s):
    return re.sub(r'<(?:input|select|textarea)\b[^>]*>', lambda m: feld_korrigieren(m.group(0)), s)

def sub(s, alt, neu, pflicht=True):
    if neu in s:
        return s
    if pflicht:
        assert s.count(alt) == 1, (alt[:70], s.count(alt))
    return s.replace(alt, neu)

# ---------------- Unabhängigkeitsrechner ----------------
s = lesen('unabhaengigkeit.main.html')
s = sub(s, '<input type="number" id="dr-wp-kwh" class="dr-input"',
        '<input type="number" id="dr-wp-kwh" class="dr-input" aria-label="Stromverbrauch der Wärmepumpe in kWh pro Jahr"')
s = sub(s, '<input type="number" id="dr-ev-km" class="dr-input"',
        '<input type="number" id="dr-ev-km" class="dr-input" aria-label="Fahrleistung des E-Autos in km pro Jahr"')
schreiben('unabhaengigkeit.main.html', felder(s))

s = lesen('unabhaengigkeit.script.js')
s = sub(s, "<select class=\"dr-select\" data-i=\"' + i + '\" data-prop=\"tilt\">",
        "<select class=\"dr-select\" data-i=\"' + i + '\" data-prop=\"tilt\" name=\"tilt-' + i + '\" aria-label=\"Neigung\" autocomplete=\"off\">")
s = sub(s, "data-prop=\"modules\" inputmode=\"numeric\"",
        "data-prop=\"modules\" name=\"modules-' + i + '\" autocomplete=\"off\" inputmode=\"numeric\"")
s = sub(s, "data-prop=\"modulePower\" inputmode=\"numeric\"",
        "data-prop=\"modulePower\" name=\"modulePower-' + i + '\" autocomplete=\"off\" inputmode=\"numeric\"")
schreiben('unabhaengigkeit.script.js', s)

# ---------------- Heizkostenrechner ----------------
s = lesen('heizkosten.main.html')
# Schieberegler: vorhandene Beschriftung mit dem Regler verknüpfen
s = re.sub(r'<label>([^<]+)</label>(<div class="s-row"><input type="range" id="([^"]+)")',
           r'<label for="\3">\1</label>\2', s)
# Klickbarer Kopf des Expertenmodus als echte Schaltfläche
s = sub(s, '<div class="accord-hdr" onclick="toggleExpert()">',
        '<button type="button" class="accord-hdr" aria-expanded="false" aria-controls="accord-body" '
        'onclick="toggleExpert(); this.setAttribute(\'aria-expanded\', String(document.getElementById(\'accord-body\').classList.contains(\'open\')))">')
# zugehöriges schließendes div -> button (erstes </div> nach dem Pfeil-Symbol)
s = sub(s, '<span class="accord-ico" id="accord-ico">▼</span>\n        </div>',
        '<span class="accord-ico" id="accord-ico" aria-hidden="true">▼</span>\n        </button>')
schreiben('heizkosten.main.html', felder(s))

# ---------------- Nutzen-Rechner ----------------
s = lesen('nutzen.main.html')
s = sub(s, '<input type="number" id="inp-elec-kwh" class="er-input"',
        '<input type="number" id="inp-elec-kwh" class="er-input" aria-label="Jährlicher Stromverbrauch in kWh"')
s = sub(s, '<input type="number" id="inp-elec-abschlag" class="er-input"',
        '<input type="number" id="inp-elec-abschlag" class="er-input" aria-label="Monatlicher Stromabschlag in Euro"')
schreiben('nutzen.main.html', felder(s))

s = lesen('nutzen.script.js')
s = sub(s, '<select class="er-select surface-label-sel" data-surf-label="${idx}">',
        '<select class="er-select surface-label-sel" data-surf-label="${idx}" name="surface-label-${idx}" aria-label="Bezeichnung der Dachfläche" autocomplete="off">')
s = sub(s, '<input type="number" class="er-input" data-surf-modules="${idx}"\n           value="${s.modules||\'\'}" placeholder="z. B. 18"',
        '<input type="number" class="er-input" data-surf-modules="${idx}" name="modules-${idx}" aria-label="Anzahl Module" autocomplete="off"\n           value="${s.modules||\'\'}" placeholder="z. B. 18…"')
s = sub(s, '<input type="number" class="er-input" data-surf-wp="${idx}"\n           value="${s.modulePower||\'\'}" placeholder="440"',
        '<input type="number" class="er-input" data-surf-wp="${idx}" name="module-power-${idx}" aria-label="Modulleistung in Wp" autocomplete="off"\n           value="${s.modulePower||\'\'}" placeholder="z. B. 440…"')
s = sub(s, "$('inp-consumption').placeholder = 'z. B. ' + cfg.dflt;",
        "$('inp-consumption').placeholder = 'z. B. ' + new Intl.NumberFormat('de-DE').format(cfg.dflt) + '…';")
s = sub(s, "$('inp-fuelprice').placeholder = cfg.dispDflt;",
        "$('inp-fuelprice').placeholder = 'z. B. ' + new Intl.NumberFormat('de-DE').format(+cfg.dispDflt) + '…';")
schreiben('nutzen.script.js', s)
print('Formularfelder der Rechner korrigiert')
