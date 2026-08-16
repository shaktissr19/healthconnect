#!/bin/bash
# replace-navbars.sh
# Replaces inline <nav> blocks in all 4 public pages with <PublicNavbar />
# Run from: /var/www/healthconnect/healthconnect-web
# Usage: bash replace-navbars.sh

set -e
BASE="/var/www/healthconnect/healthconnect-web/src/app"

echo "=== Replacing inline navbars with PublicNavbar ==="

# ── 1. HOSPITALS PAGE ────────────────────────────────────────────────────────
# Add PublicNavbar import after 'use client';
# Remove inline <nav> block (lines 118–124 in original)
FILE="$BASE/hospitals/page.tsx"
echo "→ hospitals/page.tsx"

# Add import if not already present
if ! grep -q "PublicNavbar" "$FILE"; then
  sed -i "s|'use client';|'use client';\nimport PublicNavbar from '@/components/PublicNavbar';|" "$FILE"
fi

# Remove the inline nav block and replace with <PublicNavbar />
# The nav starts with: <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(12,10,0
# and ends with: </nav>
python3 - "$FILE" <<'PYEOF'
import sys, re
path = sys.argv[1]
with open(path) as f:
    content = f.read()

# Remove the inline nav block for hospitals (dark amber theme)
old = re.search(
    r'\s*<nav style=\{\{ position: .sticky., top: 0, zIndex: 50, background: .rgba\(12,10,0.*?</nav>',
    content, re.DOTALL
)
if old:
    content = content[:old.start()] + '\n      <PublicNavbar />' + content[old.end():]
    with open(path, 'w') as f:
        f.write(content)
    print("  ✓ Nav replaced")
else:
    print("  ⚠ Nav block not found (may already be replaced)")
PYEOF

# ── 2. LEARN PAGE ────────────────────────────────────────────────────────────
FILE="$BASE/learn/page.tsx"
echo "→ learn/page.tsx"

if ! grep -q "PublicNavbar" "$FILE"; then
  sed -i "s|'use client';|'use client';\nimport PublicNavbar from '@/components/PublicNavbar';|" "$FILE"
fi

python3 - "$FILE" <<'PYEOF'
import sys, re
path = sys.argv[1]
with open(path) as f:
    content = f.read()

# Remove the inline nav block for learn (dark navy theme)
old = re.search(
    r'\s*\{/\* ── Navbar ── \*/\}\s*<nav style=\{\{ background: .#0A1628.*?</nav>',
    content, re.DOTALL
)
if old:
    content = content[:old.start()] + '\n      <PublicNavbar />' + content[old.end():]
    with open(path, 'w') as f:
        f.write(content)
    print("  ✓ Nav replaced")
else:
    # Try without comment
    old = re.search(
        r'\s*<nav style=\{\{ background: .#0A1628.*?</nav>',
        content, re.DOTALL
    )
    if old:
        content = content[:old.start()] + '\n      <PublicNavbar />' + content[old.end():]
        with open(path, 'w') as f:
            f.write(content)
        print("  ✓ Nav replaced (no comment)")
    else:
        print("  ⚠ Nav block not found (may already be replaced)")
PYEOF

# ── 3. DOCTORS PAGE ──────────────────────────────────────────────────────────
FILE="$BASE/doctors/page.tsx"
echo "→ doctors/page.tsx"

if ! grep -q "PublicNavbar" "$FILE"; then
  sed -i "s|'use client';|'use client';\nimport PublicNavbar from '@/components/PublicNavbar';|" "$FILE"
fi

python3 - "$FILE" <<'PYEOF'
import sys, re
path = sys.argv[1]
with open(path) as f:
    content = f.read()

# Remove the inline nav block for doctors (white theme with comment)
old = re.search(
    r'\s*\{/\* ── Navbar.*?──.*?\*/\}\s*<nav style=\{\{ position: .sticky., top: 0, zIndex: 100, background: .#ffffff.*?</nav>',
    content, re.DOTALL
)
if old:
    content = content[:old.start()] + '\n      <PublicNavbar />' + content[old.end():]
    with open(path, 'w') as f:
        f.write(content)
    print("  ✓ Nav replaced")
else:
    # Try without comment
    old = re.search(
        r'\s*<nav style=\{\{ position: .sticky., top: 0, zIndex: 100, background: .#ffffff.*?</nav>',
        content, re.DOTALL
    )
    if old:
        content = content[:old.start()] + '\n      <PublicNavbar />' + content[old.end():]
        with open(path, 'w') as f:
            f.write(content)
        print("  ✓ Nav replaced (no comment)")
    else:
        print("  ⚠ Nav block not found (may already be replaced)")
PYEOF

# ── 4. COMMUNITIES PAGE ──────────────────────────────────────────────────────
FILE="$BASE/communities/page.tsx"
echo "→ communities/page.tsx"

if ! grep -q "PublicNavbar" "$FILE"; then
  sed -i "s|'use client';|'use client';\nimport PublicNavbar from '@/components/PublicNavbar';|" "$FILE"
fi

python3 - "$FILE" <<'PYEOF'
import sys, re
path = sys.argv[1]
with open(path) as f:
    content = f.read()

# Remove the inline nav block for communities
old = re.search(
    r"\s*<nav style=\{\{ background:'#fff', borderBottom:'1px solid #EEF2F7'.*?</nav>",
    content, re.DOTALL
)
if old:
    content = content[:old.start()] + '\n      <PublicNavbar />' + content[old.end():]
    with open(path, 'w') as f:
        f.write(content)
    print("  ✓ Nav replaced")
else:
    print("  ⚠ Nav block not found (may already be replaced)")
PYEOF

echo ""
echo "=== Done. Verifying PublicNavbar imports ==="
grep -l "PublicNavbar" \
  "$BASE/hospitals/page.tsx" \
  "$BASE/learn/page.tsx" \
  "$BASE/doctors/page.tsx" \
  "$BASE/communities/page.tsx" 2>/dev/null | while read f; do
    echo "  ✓ $f"
done

echo ""
echo "=== Verifying no inline <nav> remains ==="
for f in "$BASE/hospitals/page.tsx" "$BASE/learn/page.tsx" "$BASE/doctors/page.tsx" "$BASE/communities/page.tsx"; do
  count=$(grep -c "<nav " "$f" 2>/dev/null || echo 0)
  if [ "$count" -eq 0 ]; then
    echo "  ✓ $(basename $(dirname $f))/page.tsx — no inline nav"
  else
    echo "  ⚠ $(basename $(dirname $f))/page.tsx — $count <nav> still present"
  fi
done
