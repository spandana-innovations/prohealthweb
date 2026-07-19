#!/usr/bin/env bash
# ============================================================
# ProHealth backend setup. Run once.
#   cd worker && ./setup.sh
# Creates the database, storage and config store, writes the IDs
# into wrangler.toml for you, and deploys.
# Safe to re-run: anything that already exists is left alone.
# ============================================================
set -e
cd "$(dirname "$0")"
TOML=wrangler.toml
[ -f "$TOML" ] || { echo "Run this from the worker/ folder."; exit 1; }

echo ""
echo "  ProHealth backend setup"
echo "  ======================="
echo ""

# ---------- 0. wrangler ----------
command -v wrangler >/dev/null || { echo "Installing wrangler..."; npm i -g wrangler; }
wrangler whoami >/dev/null 2>&1 || { echo "Signing you in to Cloudflare..."; wrangler login; }
echo "Cloudflare account: OK"


UUID_RE='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
KVID_RE='[0-9a-f]{32}'

# Wrangler prints a TABLE by default and pretty JSON with --json, and the shape
# changes between versions. Rather than betting on one, try them all and take
# the first id that appears. Never guess.
find_id() {           # find_id <name> <regex> <cmd...>
  local name="$1" re="$2"; shift 2
  local out id
  out=$("$@" 2>/dev/null || true)
  [ -z "$out" ] && { printf ''; return 0; }
  # a) same line as the name (table output)
  id=$(printf '%s' "$out" | grep -- "$name" | grep -oE "$re" | head -1)
  [ -n "$id" ] && { printf '%s' "$id"; return 0; }
  # b) flattened JSON object containing the name (pretty JSON)
  id=$(printf '%s' "$out" | tr -d ' \t\n' | sed 's/},{/}\n{/g' \
       | grep -- "\"$name\"" | grep -oE "$re" | head -1)
  [ -n "$id" ] && { printf '%s' "$id"; return 0; }
  # c) single-object output (info): any id at all
  id=$(printf '%s' "$out" | grep -oE "$re" | head -1 || true)
  printf '%s' "$id"
  return 0
}

d1_lookup() {
  local id
  for try in "wrangler d1 info prohealth-leads --json" \
             "wrangler d1 info prohealth-leads" \
             "wrangler d1 list --json" \
             "wrangler d1 list"; do
    id=$(find_id "prohealth-leads" "$UUID_RE" $try || true)
    [ -n "$id" ] && { printf '%s' "$id"; return 0; }
  done
  return 0          # found nothing: say so quietly, do not trip `set -e`
}

kv_lookup() {
  local id
  for try in "wrangler kv namespace list --json" "wrangler kv namespace list"; do
    for title in "CONFIG" "prohealth-api-CONFIG"; do
      id=$(find_id "$title" "$KVID_RE" $try || true)
      [ -n "$id" ] && { printf '%s' "$id"; return 0; }
    done
  done
  return 0          # found nothing: say so quietly, do not trip `set -e`
}

# A fresh unzip always ships placeholder IDs. Keep a copy outside the package so
# the next unzip restores them instead of failing with "namespace is not valid".
IDFILE="$HOME/.prohealth-ids"
if [ -f "$IDFILE" ]; then
  . "$IDFILE" 2>/dev/null || true
  if [ -n "$SAVED_D1" ] && grep -q 'PASTE_ID_FROM__wrangler_d1_create' "$TOML"; then
    sed -i.tmp "s|PASTE_ID_FROM__wrangler_d1_create|$SAVED_D1|" "$TOML" && rm -f "$TOML.tmp"
    echo "Restored database id from $IDFILE"
  fi
  if [ -n "$SAVED_KV" ] && grep -q 'PASTE_ID_FROM__wrangler_kv_namespace_create_CONFIG' "$TOML"; then
    sed -i.tmp "s|PASTE_ID_FROM__wrangler_kv_namespace_create_CONFIG|$SAVED_KV|" "$TOML" && rm -f "$TOML.tmp"
    echo "Restored config store id from $IDFILE"
  fi
fi

cp "$TOML" "$TOML.bak"
echo "Backed up wrangler.toml -> wrangler.toml.bak"
echo ""

# ---------- 1. D1 database ----------
if grep -q 'PASTE_ID_FROM__wrangler_d1_create' "$TOML"; then
  echo "[1/5] Creating the database..."
  OUT=$(wrangler d1 create prohealth-leads 2>&1 || true)
  ID=$(printf '%s' "$OUT" | grep -oE "$UUID_RE" | head -1)
  if [ -z "$ID" ]; then
    if printf '%s' "$OUT" | grep -qi "already exists"; then
      echo "      database prohealth-leads already exists, looking up its id..."
    fi
    ID=$(d1_lookup || true)
  fi
  if [ -z "$ID" ]; then
    echo ""
    echo "  Could not find or create the database. List yours with:"
    echo "    wrangler d1 list"
    echo "  Then paste its database_id into wrangler.toml and re-run ./setup.sh"
    exit 1
  fi
  sed -i.tmp "s|PASTE_ID_FROM__wrangler_d1_create|$ID|" "$TOML" && rm -f "$TOML.tmp"
  echo "      database: $ID"
else
  echo "[1/5] Database already configured, skipping."
fi

# ---------- 2. tables ----------
echo "[2/5] Creating tables..."
wrangler d1 execute prohealth-leads --file=schema.sql --remote --yes >/dev/null 2>&1 \
  || wrangler d1 execute prohealth-leads --file=schema.sql --remote >/dev/null
echo "      leads, applications, data_requests, audit_log: OK"

# ---------- 3. R2 for resumes ----------
echo "[3/5] Creating resume storage..."
R2OUT=$(wrangler r2 bucket create prohealth-resumes 2>&1 || true)
if echo "$R2OUT" | grep -qi "already\|exists"; then
  echo "      bucket prohealth-resumes already exists, reusing it"
elif echo "$R2OUT" | grep -qiE "not enabled|sign up|subscribe|billing"; then
  echo ""
  echo "  R2 is not enabled on this account yet."
  echo "  Enable it once (free tier): Cloudflare dashboard > R2 > Enable"
  echo "  Then re-run ./setup.sh, it will pick up where it left off."
  exit 1
elif echo "$R2OUT" | grep -qi "created\|success"; then
  echo "      bucket created"
else
  echo "      $(echo "$R2OUT" | grep -v '^$' | tail -1)"
fi

# ---------- 4. KV for config ----------
if grep -q 'PASTE_ID_FROM__wrangler_kv_namespace_create_CONFIG' "$TOML"; then
  echo "[4/5] Creating the config store..."
  OUT=$(wrangler kv namespace create CONFIG 2>&1 || true)
  KVID=$(printf '%s' "$OUT" | grep -oE "$KVID_RE" | head -1)
  if [ -z "$KVID" ]; then
    if printf '%s' "$OUT" | grep -qi "already exists"; then
      echo "      namespace CONFIG already exists, looking up its id..."
    fi
    KVID=$(kv_lookup || true)
  fi
  if [ -z "$KVID" ]; then
    echo ""
    echo "  Could not find or create the KV namespace. List yours with:"
    echo "    wrangler kv namespace list"
    echo "  Then paste the id into the [[kv_namespaces]] block in wrangler.toml"
    echo "  and re-run ./setup.sh"
    exit 1
  fi
  sed -i.tmp "s|PASTE_ID_FROM__wrangler_kv_namespace_create_CONFIG|$KVID|" "$TOML" && rm -f "$TOML.tmp"
  echo "      config store: $KVID"
else
  echo "[4/5] Config store already configured, skipping."
fi

# ---------- remember the ids for next time ----------
CUR_D1=$(grep -oE 'database_id[[:space:]]*=[[:space:]]*"[^"]+"' "$TOML" | grep -oE "$UUID_RE" | head -1)
CUR_KV=$(grep -oE '^id[[:space:]]*=[[:space:]]*"[^"]+"' "$TOML" | grep -oE "$KVID_RE" | head -1)
if [ -n "$CUR_D1" ] || [ -n "$CUR_KV" ]; then
  { echo "# ProHealth Cloudflare resource ids. setup.sh restores these after a fresh unzip."
    [ -n "$CUR_D1" ] && echo "SAVED_D1=$CUR_D1"
    [ -n "$CUR_KV" ] && echo "SAVED_KV=$CUR_KV"
  } > "$HOME/.prohealth-ids"
fi

# ---------- 5. deploy ----------
echo "[5/5] Deploying..."
DEPLOY=$(wrangler deploy 2>&1)
echo "$DEPLOY" | grep -iE 'https://.*workers\.dev|Published|Uploaded' | sed 's/^/      /' || true
URL=$(echo "$DEPLOY" | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1)

echo ""
echo "  Done."
echo "  ------------------------------------------------"
if [ -n "$URL" ]; then
  echo "  Admin:  $URL/admin"
  echo "  Health: $URL/health"
else
  echo "  Admin:  https://prohealth-api.<your-subdomain>.workers.dev/admin"
fi
echo ""
echo "  Username: admin"
echo "  Password: admin@2026"
echo "  ------------------------------------------------"
echo ""
# ---------- offer to wire the website up right now ----------
if [ -n "$URL" ] && [ -x ../connect-api.sh ]; then
  echo ""
  ANS="y"
  if [ -t 0 ] && [ -r /dev/tty ]; then
    printf "  Connect the website to this API now? [Y/n] "
    read -r ANS </dev/tty || ANS="y"
  fi
  case "${ANS:-y}" in
    [nN]*) echo "  Skipped. Run later:  ./connect-api.sh $URL" ;;
    *) (cd .. && ./connect-api.sh "$URL" >/dev/null 2>&1) && CONNECTED=1 ;;
  esac
fi

echo ""
if [ "${CONNECTED:-0}" = "1" ]; then
  echo "  Website connected to the API (20 pages)."
  echo ""
  echo "  DO THIS NEXT, or the site will not use the backend:"
  echo "      cd .. && ./deploy.sh"
else
  echo "  Website not connected yet:"
  echo "      cd .. && ./connect-api.sh $URL && ./deploy.sh"
fi
echo ""
echo "  Then, when you are ready:"
echo "    Email     wrangler secret put RESEND_API_KEY        (resend.com, free)"
echo "    Password  node hash-password.mjs \"a long passphrase\""
echo "              wrangler secret put ADMIN_PASS_HASH"
echo "              then delete ADMIN_PASS from wrangler.toml"
echo ""
