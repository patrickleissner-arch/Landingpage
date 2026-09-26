#!/usr/bin/env python3
"""Typografie-Korrektur für Quellseiten: nur Textknoten, nie Attribute,
Skripte oder Styles.

- geschütztes Leerzeichen zwischen Zahl und Einheit (50&nbsp;kW, 12&nbsp;%)
- § und „z. B." mit geschütztem Leerzeichen
- deutsche Anführungszeichen „…“ statt gerader Schlusszeichen
- drei Punkte als Auslassungszeichen …

Aufruf: python3 src/typo.py index.html src/*.main.html   (im Ordner site/)
Idempotent: mehrfaches Ausführen ändert nichts weiter.
"""
import re, sys

EINHEITEN = r'(?:Kilowattstunden|Kilowatt|Megawatt|kWh|kWp|kW|MWh|MW|GWp|GW|ct|€|%|Hz|km|m²|L|Jahre?|Tage?|Monate?|Minuten|Sekunden|Stunden|Uhr|Werktagen|Personen|Varianten)'
ZAHL = r'(\d[\d.,]*)'

def text_korrigieren(t):
    t = re.sub(ZAHL + r' (?=' + EINHEITEN + r'(?![\wäöüß]))', r'\1&nbsp;', t)
    t = re.sub(r'§ (?=\d)', '§&nbsp;', t)
    t = re.sub(r'\bz\. B\.', 'z.&nbsp;B.', t)
    t = re.sub(r'\bu\. a\.', 'u.&nbsp;a.', t)
    t = t.replace('...', '…')
    # Schlusszeichen nach deutschem Anfangszeichen
    t = re.sub(r'„([^“"<]{1,200})"', r'„\1“', t)
    return t

def datei(pfad):
    s = open(pfad, encoding='utf-8').read()
    teile = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<[^>]+>)', s, flags=re.S | re.I)
    neu = []
    for teil in teile:
        if teil.startswith('<'):
            neu.append(teil)
        else:
            neu.append(text_korrigieren(teil))
    out = ''.join(neu)
    if out != s:
        open(pfad, 'w', encoding='utf-8').write(out)
    return sum(1 for a, b in zip(teile, neu) if a != b)

if __name__ == '__main__':
    for pfad in sys.argv[1:]:
        n = datei(pfad)
        if n:
            print(f'{pfad}: {n} Textstellen korrigiert')
