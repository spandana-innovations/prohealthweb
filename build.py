#!/usr/bin/env python3
"""
Build the ProHealth website into ./site

    python build.py            # build + validate
    python build.py --no-check # build only, skip validators

Everything is path-relative, so this works from a fresh clone with no setup
beyond Python 3 and Pillow (pip install pillow).
"""
import os, sys, shutil, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(ROOT, 'src')
OUT  = os.path.join(ROOT, 'site')

def run(desc, *cmd, **kw):
    print(f'  {desc}')
    r = subprocess.run(cmd, cwd=kw.get('cwd', SRC),
                       env={**os.environ, 'PROHEALTH_OUT': OUT},
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout); print(r.stderr)
        sys.exit(f'FAILED: {desc}')
    tail = (r.stdout.strip().splitlines() or [''])[-1]
    if tail: print(f'      {tail}')
    return r.stdout

def main():
    check = '--no-check' not in sys.argv

    print('Building ProHealth site ->', OUT)
    # clean output
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)

    # openings fallback used by the careers page
    shutil.copy(os.path.join(SRC, 'data', 'openings.json'),
                os.path.join(OUT, 'data', 'openings.json'))

    # generators (order matters: base is imported by the rest)
    run('pages...',      sys.executable, 'gen2_pages.py')
    run('faqs...',       sys.executable, 'gen2_faq.py')
    run('legal...',      sys.executable, 'gen2_legal.py')
    run('home...',       sys.executable, 'gen2_home.py')

    # assets + static files
    shutil.copytree(os.path.join(SRC, 'assets'),
                    os.path.join(OUT, 'assets'), dirs_exist_ok=True)
    for f in ['_redirects', '_headers', 'robots.txt', 'sitemap.xml', 'site.webmanifest']:
        p = os.path.join(SRC, f)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(OUT, f))

    n = sum(1 for _ in _walk(OUT, '.html'))
    print(f'  built {n} pages')

    if check:
        print('Validating...')
        run('markup + assets + titles...', sys.executable, os.path.join(SRC,'validate.py'), cwd=OUT)
        run('css cascade...',              sys.executable, os.path.join(SRC,'cascade_check.py'), cwd=ROOT)

    print('Done. Serve locally with:  python -m http.server -d site 8000')

def _walk(d, ext):
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(ext):
                yield os.path.join(root, f)

if __name__ == '__main__':
    main()
