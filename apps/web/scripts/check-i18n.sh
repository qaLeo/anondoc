#!/bin/bash
# check-i18n.sh — fail if Cyrillic strings appear in already-localised source files.
# Add more paths to LOCALISED_FILES as pages/components are migrated.
# Run via: pnpm i18n:check

set -euo pipefail

LOCALISED_FILES=(
  "src/pages/History.tsx"
  "src/pages/Profile.tsx"
  "src/pages/Auth.tsx"
  "src/pages/Pricing.tsx"
  "src/components/DeanonymizationTab.tsx"
)

cd "$(dirname "$0")/.."   # always run from apps/web/

FAILED=0

for FILE in "${LOCALISED_FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "⚠️  File not found: $FILE (skipping)"
    continue
  fi

  # Find Cyrillic lines, excluding pure comments and regex literals
  HITS=$(node -e "
    const fs = require('fs');
    const src = fs.readFileSync('$FILE', 'utf8').split('\n');
    const bad = src
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => {
        const trimmed = l.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
        // Allow Cyrillic inside regex literals (e.g. /[а-я]/)
        const withoutRegex = l.replace(/\/[^\/\n]+\//g, '');
        return /[а-яА-ЯёЁ]/.test(withoutRegex);
      });
    bad.forEach(([n, l]) => console.log('L' + n + ': ' + l.trim().slice(0, 100)));
    process.exit(bad.length > 0 ? 1 : 0);
  " 2>&1) || true

  if [ -n "$HITS" ]; then
    echo "❌  Cyrillic found in $FILE:"
    echo "$HITS" | sed 's/^/     /'
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "❌  i18n check FAILED — replace Cyrillic strings with t() from useTranslation()"
  exit 1
else
  echo "✅  i18n check passed — no Cyrillic in localised files"
  exit 0
fi
