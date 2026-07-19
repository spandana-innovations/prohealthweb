#!/usr/bin/env bash
# ============================================================
# Connect the website to the Worker API.
#
#   ./connect-api.sh https://prohealth-api.YOURNAME.workers.dev
#   ./connect-api.sh                 <- finds it from wrangler
#   ./connect-api.sh --status        <- what is it set to right now?
#   ./connect-api.sh --disconnect
#   ./connect-api.sh <url> --force   <- skip the reachability check
#
# Injects window.PROHEALTH_API into every page so the forms, the chatbot
# and the footer staff button all talk to your backend.
# Safe to re-run: it replaces any previous value rather than stacking.
# ============================================================
set -e
cd "$(dirname "$0")"
[ -d site ] || { echo "Run this from the folder that contains 'site'."; exit 1; }

TAG_RE='<script>window\.PROHEALTH_API=[^<]*</script>'

status() {
  local cur n total
  # only the injected <script> tag counts; STAFF_JS also mentions the variable
  cur=$(grep -ho '<script>window\.PROHEALTH_API="[^"]*"' site/index.html 2>/dev/null | head -1 | sed 's/.*="//; s/"$//')
  n=$(grep -rl '<script>window.PROHEALTH_API=' site --include=index.html 2>/dev/null | wc -l | tr -d ' ')
  total=$(find site -name index.html | wc -l | tr -d ' ')
  if [ -n "$cur" ]; then
    echo "Connected to: $cur"
    echo "Set on $n of $total pages."
  else
    echo "Not connected. Forms log to the browser console and the staff button explains itself."
  fi
}

[ "$1" = "--status" ] && { status; exit 0; }

if [ "$1" = "--disconnect" ]; then
  find site -name index.html -print0 | xargs -0 perl -0pi -e "s|$TAG_RE||g"
  echo "Disconnected. Run ./deploy.sh to publish."
  exit 0
fi

FORCE=0
for a in "$@"; do [ "$a" = "--force" ] && FORCE=1; done
API=""
for a in "$@"; do case "$a" in --*) ;; *) [ -z "$API" ] && API="$a" ;; esac; done

# --- find the worker URL if we were not given one ---
if [ -z "$API" ]; then
  echo "Looking for your Worker..."
  if [ -d worker ]; then
    OUT=$(cd worker && wrangler deployments list 2>/dev/null | head -40 || true)
    API=$(echo "$OUT" | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1 || true)
  fi
  if [ -z "$API" ]; then
    NAME=$(grep -oE '^name[[:space:]]*=[[:space:]]*"[^"]+"' worker/wrangler.toml 2>/dev/null | sed 's/.*"\(.*\)"/\1/')
    SUB=$(wrangler whoami 2>/dev/null | grep -oE '[a-z0-9-]+\.workers\.dev' | head -1 || true)
    [ -n "$NAME" ] && [ -n "$SUB" ] && API="https://$NAME.$SUB"
  fi
  if [ -z "$API" ]; then
    echo ""
    echo "  Could not work it out. Pass it in:"
    echo "    ./connect-api.sh https://prohealth-api.YOURNAME.workers.dev"
    echo ""
    echo "  It is the URL 'wrangler deploy' printed when you ran worker/setup.sh."
    exit 1
  fi
  echo "Found: $API"
fi

API="${API%/}"
case "$API" in https://*) ;; *) echo "The URL must start with https://"; exit 1 ;; esac

# --- is it actually alive? ---
echo -n "Checking $API/health ... "
if command -v curl >/dev/null && curl -fsS --max-time 8 "$API/health" >/dev/null 2>&1; then
  echo "responding"
else
  echo "no response"
  if [ "$FORCE" = "1" ]; then
    echo "  --force given, wiring it up anyway."
  elif [ -t 0 ] && [ -r /dev/tty ]; then
    echo ""
    echo "  The API did not answer. Deploy it first:"
    echo "    cd worker && ./setup.sh"
    echo ""
    printf "  Wire it up anyway? [y/N] "
    read -r A </dev/tty || A=""
    case "$A" in [yY]*) ;; *) exit 1 ;; esac
  else
    echo ""
    echo "  The API did not answer, and this is not an interactive shell."
    echo "  Deploy it first:   cd worker && ./setup.sh"
    echo "  Or force it:       ./connect-api.sh $API --force"
    exit 1
  fi
fi

# --- inject (replace any previous tag first, so re-running is safe) ---
TAG="<script>window.PROHEALTH_API=\"$API\";</script>"
COUNT=0
while IFS= read -r f; do
  perl -0pi -e "s|$TAG_RE||g" "$f"
  perl -0pi -e "s|</body>|${TAG}</body>|" "$f"
  COUNT=$((COUNT+1))
done < <(find site -name index.html)

echo ""
echo "  ------------------------------------------------"
echo "  Connected $COUNT pages to $API"
echo "  ------------------------------------------------"
echo ""
echo "  Now live once you deploy:"
echo "    - chatbot callbacks and every form post to the API"
echo "    - careers page reads openings from the admin"
echo "    - footer 'Staff login' opens the dashboard"
echo ""
echo "  Next:"
echo "    ./deploy.sh"
echo "    open $API/admin      (admin / admin@2026)"
echo ""
