#!/usr/bin/env bash
# ============================================================
# Point prohealth.us at the new site.
#
#   ./golive.sh --check      what is the current state? (safe, read only)
#   ./golive.sh              do it
#
# This does the CLOUDFLARE side. The nameserver change at your registrar is
# manual and is the one step nobody can automate.
#
# READ PRE-LAUNCH.md FIRST. Especially the email section.
# ============================================================
set -e
cd "$(dirname "$0")"
DOMAIN="prohealth.us"
PROJ="$(cat .pages-project 2>/dev/null || echo prohealth)"
API_SUB="api.$DOMAIN"

say()  { printf '  %s\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

command -v wrangler >/dev/null || { echo "Install wrangler first: npm i -g wrangler"; exit 1; }
wrangler whoami >/dev/null 2>&1 || wrangler login

echo ""
echo "  Go live: $DOMAIN"
echo "  ================================"
echo ""

# ---------- 1. is the zone on Cloudflare yet? ----------
ZONE_OK=0
if wrangler dns record list "$DOMAIN" >/dev/null 2>&1; then ZONE_OK=1; fi
if [ "$ZONE_OK" = "0" ]; then
  NS=$(dig "$DOMAIN" NS +short 2>/dev/null | tr '\n' ' ')
  case "$NS" in
    *ns.cloudflare.com*) ZONE_OK=1 ;;
  esac
fi

if [ "$ZONE_OK" = "1" ]; then
  ok "$DOMAIN is on Cloudflare nameservers"
else
  bad "$DOMAIN is NOT on Cloudflare yet"
  echo ""
  say "Current nameservers:"
  dig "$DOMAIN" NS +short 2>/dev/null | sed 's/^/      /' || say "      (could not resolve)"
  echo ""
  say "Do this first, in the Cloudflare dashboard:"
  say "  1. Add a domain  ->  $DOMAIN  ->  Free plan"
  say "  2. Cloudflare scans your existing DNS. CHECK THE MX AND TXT RECORDS"
  say "     CAME ACROSS before continuing. This is where email breaks."
  say "  3. Change the nameservers at your registrar to the two Cloudflare gives you"
  say "  4. Wait for Cloudflare to say Active (minutes to a few hours)"
  say "  5. Re-run ./golive.sh"
  echo ""
  exit 1
fi

# ---------- 2. email sanity, before we touch anything ----------
echo ""
say "Email records on $DOMAIN:"
MX=$(dig "$DOMAIN" MX +short 2>/dev/null | head -5)
if [ -n "$MX" ]; then
  echo "$MX" | sed 's/^/      /'
  ok "MX records resolve, mail should still be delivered"
else
  warn "NO MX RECORDS FOUND."
  warn "If $DOMAIN receives email, it is broken right now. Fix that before anything else."
fi
SPF=$(dig "$DOMAIN" TXT +short 2>/dev/null | grep -i 'v=spf1' | head -1)
[ -n "$SPF" ] && ok "SPF present" || warn "No SPF record. Mail you send may land in spam."

if [ "$1" = "--check" ]; then
  echo ""
  say "Read-only check finished. Nothing was changed."
  echo ""
  exit 0
fi

# ---------- 3. custom domains on Pages ----------
echo ""
say "Attaching $DOMAIN and www.$DOMAIN to Pages project '$PROJ'..."
for D in "$DOMAIN" "www.$DOMAIN"; do
  if wrangler pages domain add "$D" --project-name="$PROJ" >/dev/null 2>&1; then
    ok "added $D"
  else
    warn "$D not added automatically (it may already exist)"
    say "    If needed: dashboard > Workers & Pages > $PROJ > Custom domains"
  fi
done

# ---------- 4. the API on its own subdomain ----------
echo ""
say "Putting the API on $API_SUB..."
TOML=worker/wrangler.toml
if grep -q '^# routes = \[' "$TOML" 2>/dev/null || grep -q '^#   { pattern = "api.prohealth.us"' "$TOML" 2>/dev/null; then
  perl -0pi -e 's/^# routes = \[\n#   \{ pattern = "api\.prohealth\.us", custom_domain = true \}\n# \]/routes = [\n  { pattern = "api.prohealth.us", custom_domain = true }\n]/m' "$TOML"
  ok "uncommented the api.prohealth.us route"
else
  say "    route already configured (or shaped differently, check $TOML)"
fi

# the footer staff button needs a cookie both hosts can read
if grep -q '^# COOKIE_DOMAIN' "$TOML"; then
  perl -0pi -e 's/^# COOKIE_DOMAIN = "\.prohealth\.us"/COOKIE_DOMAIN = ".prohealth.us"/m' "$TOML"
  ok 'enabled COOKIE_DOMAIN (footer will say "View dashboard" once signed in)'
fi

say "Deploying the Worker..."
(cd worker && wrangler deploy 2>&1 | grep -E 'https://|Deployed' | sed 's/^/      /') || bad "worker deploy failed"

# ---------- 5. point the site at the new API host ----------
echo ""
say "Pointing the site at https://$API_SUB ..."
./connect-api.sh "https://$API_SUB" --force >/dev/null 2>&1 && ok "20 pages connected" || warn "connect-api failed, run it by hand"

# ---------- 6. ship ----------
echo ""
say "Deploying the site..."
./deploy.sh 2>&1 | grep -E 'Shipped|Live site' | sed 's/^/      /'

# ---------- 7. did it work? ----------
echo ""
say "Checking..."
sleep 3
for U in "https://$DOMAIN/" "https://www.$DOMAIN/" "https://$API_SUB/health"; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 "$U" 2>/dev/null || echo 000)
  case "$CODE" in
    200) ok "$U  ($CODE)" ;;
    000) warn "$U  no response yet. SSL can take a few minutes on a new custom domain." ;;
    *)   warn "$U  ($CODE)" ;;
  esac
done

# the two redirects that must survive launch
for U in "https://$DOMAIN/volunteer/" "https://$DOMAIN/coverage/"; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 "$U" 2>/dev/null || echo 000)
  [ "$CODE" = "200" ] && ok "$U redirects correctly ($CODE)" || warn "$U -> $CODE"
done

echo ""
echo "  ------------------------------------------------"
echo "  Site:   https://$DOMAIN"
echo "  Admin:  https://$API_SUB/admin"
echo "  ------------------------------------------------"
echo ""
say "Still to do by hand:"
say "  1. Google Search Console: verify $DOMAIN, submit sitemap.xml"
say "  2. Request indexing on /home-care/ and /locations/ (the two moved URLs)"
say "  3. Watch Coverage for 404s for 30 days"
say "  4. Send yourself an email at $DOMAIN to prove mail still works"
echo ""
