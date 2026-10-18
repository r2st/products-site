"""Normalize legacy HTML links using parsed tags; run before release.py."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import re

ROOT = Path(__file__).resolve().parents[1]
UNAVAILABLE = {'caflow', 'convert', 'fincalc', 'payslip', 'pitchcraft', 'rent',
               'rentbanao', 'dpdp', 'pdf', 'legal', 'shayari', 'emibuddy'}
ALIASES = {'invoice': 'https://invoicer.doaide.com', '409a': 'https://409.doaide.com',
           'homenex': 'https://realty.doaide.com', 'documedic': 'https://med.doaide.com',
           'emi': 'https://doaide.com/emi-calculator.html'}

class Repair(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.offsets = [0]
        for line in source.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.edits = []
        self.anchor = None
    def pos(self):
        line, col = self.getpos()
        return self.offsets[line - 1] + col
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        raw = self.get_starttag_text()
        start = self.pos()
        href = data.get('href', '')
        url = urlsplit(href)
        host = url.hostname or ''
        sub = host.removesuffix('.doaide.com') if host.endswith('.doaide.com') else ''
        if tag == 'a':
            # Remove cards for retired products, and nonexistent policy destinations.
            remove = (sub in UNAVAILABLE and 'tool-card' in data.get('class', '')) or (
                host == 'doaide.com' and url.path in ('/privacy', '/terms', '/privacy.html', '/terms.html'))
            self.anchor = (start, remove)
            if sub in UNAVAILABLE and not remove:
                new = re.sub(r'\s+(?:href|target|rel)\s*=\s*([\'"]).*?\1', '', raw)
                new = new[:-1] + ' aria-disabled="true" title="Currently unavailable">'
                self.edits.append((start, start + len(raw), new))
                return
        replacement = None
        if sub in ALIASES:
            replacement = ALIASES[sub] + (url.path if sub != 'emi' else '')
        elif href == '/#free-tools':
            replacement = '/#products'
        elif host == 'documedic.aiknol.com':
            replacement = 'https://med.doaide.com/'
        if replacement:
            new = raw.replace(href, escape(replacement, quote=True))
            self.edits.append((start, start + len(raw), new))
    def handle_endtag(self, tag):
        if tag == 'a' and self.anchor:
            start, remove = self.anchor
            if remove:
                end = self.pos() + len('</a>')
                self.edits = [e for e in self.edits if e[0] < start]
                self.edits.append((start, end, ''))
            self.anchor = None
    def result(self):
        result = self.source
        for start, end, replacement in reversed(self.edits):
            result = result[:start] + replacement + result[end:]
        return result

for path in list(ROOT.glob('*.html')) + list((ROOT / 'blog').glob('*.html')):
    source = path.read_text()
    parser = Repair(source)
    parser.feed(source)
    updated = parser.result()
    # Do not advertise unavailable products in machine-readable search metadata.
    def schema(match):
        try:
            data = json.loads(match.group(2))
        except ValueError:
            return match.group(0)
        if isinstance(data, list):
            filtered = [item for item in data if urlsplit(item.get('url', '')).hostname not in
                    {name + '.doaide.com' for name in UNAVAILABLE}]
            if filtered != data:
                return match.group(1) + json.dumps(filtered, ensure_ascii=False) + match.group(3)
        return match.group(0)
    updated = re.sub(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', schema, updated, flags=re.S)
    if updated != source:
        path.write_text(updated)

# Retain old bookmarks without suggesting the unavailable application is usable.
for slug, name in {'convert': 'Convert', 'fincalc': 'FinCalc',
                   'payslipmaker': 'PaySlipMaker', 'rentbanao': 'RentBanao'}.items():
    (ROOT / (slug + '.html')).write_text(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DoAide {name} - Currently unavailable</title><meta name="robots" content="noindex,follow">
<link rel="stylesheet" href="styles.css"></head>
<body><main style="max-width:640px;margin:12vh auto;padding:24px">
<a href="index.html">DoAide</a><h1 style="font-size:32px;margin:24px 0">{name} is currently unavailable</h1>
<p>This product is not accepting new sessions. Explore the tools currently available in the DoAide directory.</p>
<p style="margin-top:24px"><a href="index.html#products">Browse available tools</a></p>
</main></body></html>
''')
