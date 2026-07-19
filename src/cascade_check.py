import os
"""Which rules actually win on .mega-card? Compute specificity + source order."""
import re, sys, os
BASE=os.path.dirname(os.path.abspath(__file__))
REPO=os.path.dirname(BASE)                       # src/ -> repo root
IDX=os.environ.get('PROHEALTH_INDEX', os.path.join(REPO,'site','index.html'))
s = open(IDX, encoding='utf-8').read()
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)   # strip comments: they confuse the selector regex

def spec(sel):
    sel = re.sub(r'::?[a-z-]+(\([^)]*\))?', '', sel)
    a = len(re.findall(r'#[\w-]+', sel))
    b = len(re.findall(r'\.[\w-]+', sel)) + len(re.findall(r'\[[^\]]+\]', sel))
    c = len(re.findall(r'(?:^|[\s>+~])([a-zA-Z][\w-]*)', sel))
    return (a, b, c)

# does a selector target an <a class="mega-card"> nested in nav.links > .has-mega > .mega > .mega-grid?
def hits_mega_card(sel):
    sel = sel.strip()
    if '@' in sel or not sel: return False
    if re.search(r'\.mega-card\b', sel): return True
    # a bare descendant 'a' under nav.links also reaches it
    if re.match(r'^nav\.links\s+a\b', sel): return True
    if re.match(r'^\.mega\s+a\b', sel): return True
    return False

wins = {}
order = 0
for block in re.finditer(r'([^{}@]+)\{([^}]*)\}', css):
    sels, body = block.group(1), block.group(2)
    for sel in sels.split(','):
        sel = sel.strip()
        if not hits_mega_card(sel): continue
        order += 1
        for decl in body.split(';'):
            if ':' not in decl: continue
            prop, val = decl.split(':', 1)
            prop, val = prop.strip(), val.strip()
            imp = '!important' in val
            key = prop
            cand = (imp, spec(sel), order, sel, val)
            if key not in wins or cand[:3] > wins[key][:3]:
                wins[key] = cand

print("COMPUTED WINNER for each property on .mega-card:\n")
for p in ['display', 'flex-direction', 'align-items', 'white-space', 'line-height', 'padding', 'font-size', 'overflow']:
    if p in wins:
        imp, sp, o, sel, val = wins[p]
        flag = '  <-- LEAK' if 'mega' not in sel else ''
        print(f"  {p:16s} {val:34s} from  {sel:34s} spec={sp}{flag}")
    else:
        print(f"  {p:16s} (not set)")

bad = [p for p, v in wins.items() if 'mega' not in v[3] and p in ('align-items','white-space','line-height','display')]
print("\nLEAKED PROPERTIES:", bad if bad else "none")
sys.exit(1 if bad else 0)
