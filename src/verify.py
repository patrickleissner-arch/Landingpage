import hashlib, json, re, sys, os
H=json.load(open('/home/claude/site/src/hashes.json'))
def h(s): return hashlib.sha256(re.sub(r'\s+','',s).encode()).hexdigest()[:16]
slugs=sys.argv[1:] or [k for k in H.keys() if not k.startswith('_')]
for slug in slugs:
    d='/home/claude/site/src/'
    for kind,key in [('main.html','main'),('style.css','styles'),('script.js','scripts'),('script2.js','scripts')]:
        p=d+slug+'.'+kind
        if not os.path.exists(p): continue
        got=h(open(p,encoding='utf-8').read())
        exp=H[slug][key]
        idx=1 if kind=='script2.js' else 0
        exp=exp if isinstance(exp,str) else (exp[idx] if len(exp)>idx else None)
        print(slug, kind, 'OK' if got==exp else f'MISMATCH got {got} exp {exp}')
