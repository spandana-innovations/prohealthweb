# ProHealth Home Care — website & backend

Marketing site (static, generated) plus a Cloudflare Worker backend with a lead/
applicant/data-request admin dashboard.

## Quick start

```bash
git clone <your-repo-url> prohealth
cd prohealth
pip install pillow          # the only build dependency
python3 build.py            # generates ./site and validates it
python3 -m http.server -d site 8000   # preview at localhost:8000
```

## How it works

The site is **generated**, not hand-edited. Python scripts in `src/` produce the 20
HTML pages into `site/`, which is what Cloudflare serves. `site/` is git-ignored — it's
rebuilt on demand.

```
src/         generators, CSS, JS, assets, tests   <- edit here
build.py     runs the generators + validators     <- run this
site/        output (git-ignored)                 <- never edit by hand
worker/      Cloudflare Worker backend + admin
```

See **CLAUDE.md** for the full map and the project's hard-won lessons.

## Everyday commands

| | |
|---|---|
| `python3 build.py` | build the site into `./site` |
| `python3 build.py --no-check` | build without running validators |
| `npm run serve` | preview locally on :8000 |
| `npm test` | run site + worker test suites |
| `./deploy.sh` | deploy `site/` to Cloudflare Pages |
| `cd worker && ./setup.sh` | create backend resources + deploy the Worker |
| `./connect-api.sh <url>` | point the site at the Worker API |
| `./golive.sh` | migrate to the prohealth.us domain (read `PRE-LAUNCH.md`) |

## Requirements

- **Python 3** + **Pillow** (`pip install pillow`) — for the build
- **Node 18+** — for the tests and the Worker
- **wrangler** (`npm i -g wrangler`) — for deploying

## Deploying

**Site:**
```bash
python3 build.py
./deploy.sh
```

**Backend** (first time, or after cloning):
```bash
cd worker
./setup.sh          # creates D1 + KV + R2, writes wrangler.toml, deploys
```
Then connect the site to it and redeploy:
```bash
cd ..
./connect-api.sh https://prohealth-api.<your-subdomain>.workers.dev
./deploy.sh
```

Admin dashboard: `<worker-url>/admin` — default login `admin` / `admin@2026`
(change it — see `worker/README-ADMIN.md`).

## Going live on prohealth.us

**Read `PRE-LAUNCH.md` first.** The website is the easy part; the risk is email
continuity when nameservers move to Cloudflare. Then:

```bash
./golive.sh --check    # read-only: is the zone live, does mail resolve?
./golive.sh            # attach domain, move API, redeploy, verify
```

## Docs in this repo

- **CLAUDE.md** — architecture + lessons (read before changing anything)
- **PRE-LAUNCH.md** — the domain migration, and the risks to check first
- **SEO-PLAYBOOK.md** — what actually ranks in this segment (mostly off-site)
- **LEGAL-REVIEW.md** — what to have counsel check on the compliance pages
- **worker/README-ADMIN.md** — backend + dashboard operations
