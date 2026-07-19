#!/usr/bin/env bash
# ============================================================
# ProHealth: deploy the website.
#
#   ./deploy.sh                 remembers your project after the first run
#   ./deploy.sh prohealth       force a specific project
#   ./deploy.sh --list          show your Pages projects
#
# NOTE: the project NAME and its pages.dev SUBDOMAIN can differ.
# Project "prohealth" is served at "prohealth-1oi.pages.dev" because the
# prohealth.pages.dev subdomain was already taken globally. Always pass the
# NAME (left column of --list), never the subdomain.
# ============================================================
set -e
cd "$(dirname "$0")"
[ -d site ] || { echo "Run this from the folder that contains 'site'."; exit 1; }

command -v wrangler >/dev/null || { echo "Installing wrangler..."; npm i -g wrangler; }
wrangler whoami >/dev/null 2>&1 || { echo "Signing in to Cloudflare..."; wrangler login; }

# Project names = first column only. The old version also matched the subdomain
# column and invented projects that did not exist.
list_projects() {
  wrangler pages project list 2>/dev/null \
    | awk -F'│' 'NF>2 {gsub(/^[ \t]+|[ \t]+$/,"",$2);
        if($2!="" && $2!="Project Name" && $2 !~ /^[-─]+$/) print $2}'
}

if [ "$1" = "--list" ]; then
  echo ""; echo "Your Cloudflare Pages projects (use the NAME, left column):"; echo ""
  wrangler pages project list
  exit 0
fi

PROJ="${1:-}"
[ -z "$PROJ" ] && [ -f .pages-project ] && PROJ="$(cat .pages-project | tr -d '[:space:]')"

if [ -z "$PROJ" ]; then
  MATCHES=$(list_projects | grep -i prohealth || true)
  COUNT=$(printf '%s' "$MATCHES" | grep -c . || true)
  if [ "$COUNT" = "1" ]; then
    PROJ="$MATCHES"
    echo "Using your existing project: $PROJ"
  elif [ "$COUNT" -gt 1 ]; then
    echo ""; echo "You have more than one matching project:"
    printf '%s\n' "$MATCHES" | sed 's/^/    /'
    echo ""
    if [ -t 0 ]; then
      printf "Type the one to use: "
      read -r ANS </dev/tty || ANS=""
      PROJ="${ANS:-$(printf '%s' "$MATCHES" | head -1)}"
    else
      PROJ=$(printf '%s' "$MATCHES" | head -1)
      echo "Not a terminal, defaulting to: $PROJ"
    fi
  else
    PROJ="prohealth"
    echo "No existing project found. Creating 'prohealth'."
  fi
fi

echo ""
echo "Deploying to project: $PROJ"
echo ""

wrangler pages project create "$PROJ" --production-branch=main >/dev/null 2>&1 \
  && echo "Created project $PROJ" \
  || echo "Project $PROJ already exists, updating it"

OUT=$(wrangler pages deploy site --project-name="$PROJ" 2>&1) || {
  echo "$OUT"; echo ""
  echo "  Deploy failed. See your project NAMES with:  ./deploy.sh --list"
  exit 1
}
echo "$OUT" | tail -5
echo "$PROJ" > .pages-project

# what did we actually just ship?
FP=""
grep -q 'class="hs" href' site/index.html 2>/dev/null && FP="$FP hero-tiles"
grep -q 'class="fc-rev' site/index.html 2>/dev/null && FP="$FP floating-reviews"
grep -q 'has-mega.pinned' site/index.html 2>/dev/null && FP="$FP mega-pin"
grep -q 'window.PROHEALTH_API=' site/index.html 2>/dev/null && FP="$FP api-connected" || FP="$FP api-NOT-connected"
PAGES=$(find site -name index.html | wc -l | tr -d ' ')

PREVIEW=$(echo "$OUT" | grep -oE 'https://[a-z0-9]+\.[a-z0-9.-]+\.pages\.dev' | tail -1)
LIVE=$(echo "$OUT" | grep -oE 'https://[a-z0-9.-]+\.pages\.dev' | grep -v "$(echo "$PREVIEW" | sed 's|https://[a-z0-9]*\.||')x" | tail -1)
echo ""
echo "  ------------------------------------------------"
echo "  Shipped:      $PAGES pages ·$FP"
[ -n "$PREVIEW" ] && echo "  This deploy:  $PREVIEW"
echo "  Live site:    https://$(echo "${PREVIEW:-x}" | sed -E 's|https://[a-z0-9]+\.||' | sed 's|^x$||')"
echo "  ------------------------------------------------"
echo ""
echo "  Remembered '$PROJ'. Next time just run:  ./deploy.sh"
echo ""
echo "  Not seeing the change? Hard-refresh with Cmd+Shift+R."
echo ""
