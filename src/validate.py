#!/usr/bin/env python3
"""Build validator. Run after generating: python3 validate.py"""
import re,glob,json,subprocess,os,hashlib,sys
BASE=os.path.dirname(os.path.abspath(__file__))   # src/, where the test .js files live
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
      'path','circle','rect','line','polygon','polyline','stop','use','ellipse'}
fails=[]; hdrs=set(); pages=sorted(glob.glob('**/index.html',recursive=True))
for f in pages:
    s=open(f,encoding='utf-8').read()
    # 1. markup balance (catches orphaned </div> that break grids)
    body=s[s.index('<body>')+6:s.rindex('</body>')]
    body=re.sub(r'<script\b.*?</script>','',body,flags=re.S)
    body=re.sub(r'<style\b.*?</style>','',body,flags=re.S)
    body=re.sub(r'<!--.*?-->','',body,flags=re.S)
    st=[]
    for m in re.finditer(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(/?)>',body):
        c,t,sc=m.group(1),m.group(2).lower(),m.group(3)
        if t in VOID or sc: continue
        if not c: st.append(t)
        elif not st: fails.append(f'{f}: stray </{t}>'); break
        elif st[-1]!=t: fails.append(f'{f}: </{t}> closes <{st[-1]}>'); break
        else: st.pop()
    else:
        if st: fails.append(f'{f}: unclosed {st[-3:]}')
    # 2. JS syntax + RUNTIME (strict DOM: only IDs that really exist resolve)
    ids=sorted(set(re.findall(r'\bid="([^"]+)"',s)))
    cls=sorted({c for a in re.findall(r'\bclass="([^"]+)"',s) for c in a.split()})
    for i,b in enumerate(re.findall(r'<script>(.*?)</script>',s,re.S)):
        open('/tmp/_v.js','w').write(b)
        r=subprocess.run(['node','--check','/tmp/_v.js'],capture_output=True,text=True)
        if r.returncode:
            fails.append(f'{f}: JS#{i} syntax {r.stderr.splitlines()[1][:50] if len(r.stderr.splitlines())>1 else ""}')
            continue
        hp=os.path.join(BASE,'runtime_harness.js')
        r=subprocess.run(['node',hp,json.dumps(ids),json.dumps(cls),'/tmp/_v.js'],capture_output=True,text=True)
        if not r.stdout.strip().startswith('CLEAN'):
            fails.append(f'{f}: JS#{i} RUNTIME {r.stdout.strip()[:90]}')
    # 3. JSON-LD
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):
        try: json.loads(b)
        except Exception as e: fails.append(f'{f}: bad JSON-LD')
    # 4. internal links resolve
    for m in set(re.findall(r'href="(/[a-z0-9/-]*/)"',s)):
        p=m.strip('/')
        if p and not os.path.exists(os.path.join(p,'index.html')): fails.append(f'{f}: dead link {m}')
    # 5. assets exist
    for m in set(re.findall(r'(?:src|href)="(/assets/[^"]+)"',s)):
        if not os.path.exists(m.lstrip('/')): fails.append(f'{f}: missing asset {m}')
    # 6. header identical everywhere
    hm=re.search(r'<header>.*?</header>',s,re.S)
    if hm and f != 'index.html': hdrs.add(hashlib.md5(re.sub(r'\s*aria-current="page"','',hm.group(0)).encode()).hexdigest())
    # 7. regressions
    if re.search(r'\.hero>\*\{position:relative',s): fails.append(f'{f}: hero-bg positioning bug returned')
    if ' \u2014 ' in s: fails.append(f'{f}: em-dash')
    for need,label in [('@media print','print styles'),('id="drawer"','mobile drawer'),
                       ("getElementById('menuBtn')",'drawer JS'),('position:absolute!important','bg layer guard')]:
        if need not in s: fails.append(f'{f}: missing {label}')
if len(hdrs)>1: fails.append(f'HEADER MISMATCH across pages ({len(hdrs)} variants)')
# 10. titles must fit Google's ~60 char display limit or they truncate in results
for _tf in glob.glob('**/index.html',recursive=True):
    _tm=re.search(r'<title>([^<]*)</title>', open(_tf).read())
    if _tm and len(_tm.group(1).replace('&amp;','&'))>60:
        fails.append(f'{_tf}: title too long ({len(_tm.group(1))} chars, truncates in Google)')
# 9. homepage must not repeat a content photo (mega menus excluded)
if os.path.exists('index.html'):
    _s=open('index.html').read()
    _body=re.sub(r'<div class="mega[^"]*".*?</div></div></div>','',_s,flags=re.S)
    from collections import Counter as _C
    _c=_C(re.findall(r'/assets/photos/([a-z-]+)\.jpg', _body))
    for _p,_n in _c.items():
        if _n>1: fails.append(f'homepage photo repeated {_n}x: {_p}')
# 8. no duplicated/nested asset folders (a stray `cp -r assets site/assets` does this)
for stray in glob.glob('assets/*/'):
    # photos/ is an intentional subfolder; only assets/assets/ is the bug
    if os.path.basename(stray.rstrip('/')) != 'photos':
        fails.append('nested folder inside assets/: '+stray)
if os.path.isdir('assets/assets'): fails.append('assets/assets exists: images shipped twice')
print(f'{len(pages)} pages | {len(fails)} failures')
for x in fails[:20]: print('  -',x)
sys.exit(1 if fails else 0)
