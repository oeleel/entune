#!/usr/bin/env bash
# Pre-demo MVP check — run before every demo to catch issues early
set -euo pipefail

PASS=0
FAIL=0
RESULTS=""

check() {
  local name="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    RESULTS+="  ✓ $name"$'\n'
    PASS=$((PASS + 1))
  else
    RESULTS+="  ✗ $name"$'\n'
    FAIL=$((FAIL + 1))
  fi
}

echo "Running MVP checks..."
echo ""

# Build
check "npm run build" npm run build

# Lint
check "npm run lint" npm run lint

# TypeScript
check "tsc --noEmit" npx tsc --noEmit

# Route files exist
ROUTES=(
  src/app/api/session/create/route.ts
  src/app/api/session/join/route.ts
  src/app/api/session/end/route.ts
  src/app/api/translate/route.ts
  src/app/api/chat/route.ts
  src/app/api/health/route.ts
  src/app/api/tts/route.ts
  src/app/api/summary/route.ts
  src/app/api/auth/callback/route.ts
)

ALL_ROUTES=true
for route in "${ROUTES[@]}"; do
  if [ ! -f "$route" ]; then
    RESULTS+="  ✗ Missing: $route"$'\n'
    FAIL=$((FAIL + 1))
    ALL_ROUTES=false
  fi
done
if $ALL_ROUTES; then
  RESULTS+="  ✓ All route files exist (${#ROUTES[@]} routes)"$'\n'
  PASS=$((PASS + 1))
fi

# Health endpoint — try dev server first, else spin up temp server
HEALTH_OK=false
if curl -sf "http://localhost:3000/api/health" | grep -q '"status":"ok"'; then
  HEALTH_OK=true
elif [ -d ".next" ]; then
  PORT=3939
  npx next start -p $PORT &>/dev/null &
  SERVER_PID=$!
  for i in 1 2 3 4 5 6 7 8; do
    sleep 2
    if curl -sf "http://localhost:$PORT/api/health" | grep -q '"status":"ok"'; then
      HEALTH_OK=true
      break
    fi
  done
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
fi

if $HEALTH_OK; then
  RESULTS+="  ✓ /api/health returns ok"$'\n'
  PASS=$((PASS + 1))
else
  RESULTS+="  ✗ /api/health did not return ok"$'\n'
  FAIL=$((FAIL + 1))
fi

# Page files exist
PAGES=(
  "src/app/(marketing)/page.tsx"
  "src/app/(marketing)/login/page.tsx"
  "src/app/(marketing)/join/page.tsx"
  src/app/dashboard/page.tsx
  src/app/session/doctor/page.tsx
  src/app/session/patient/page.tsx
)

ALL_PAGES=true
for page in "${PAGES[@]}"; do
  if [ ! -f "$page" ]; then
    RESULTS+="  ✗ Missing: $page"$'\n'
    FAIL=$((FAIL + 1))
    ALL_PAGES=false
  fi
done
if $ALL_PAGES; then
  RESULTS+="  ✓ All page files exist (${#PAGES[@]} pages)"$'\n'
  PASS=$((PASS + 1))
fi

echo "Results:"
echo "$RESULTS"
echo "---"
echo "$PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
