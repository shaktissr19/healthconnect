#!/bin/bash
# deploy-admin.sh
# Run from: /var/www/healthconnect/healthconnect-api
# Handles backend only. Frontend files must be copied separately (see instructions below).

set -e
API_DIR="/var/www/healthconnect/healthconnect-api"
WEB_DIR="/var/www/healthconnect/healthconnect-web"
cd "$API_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  HealthConnect — Admin Panel Full Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Register admin routes ────────────────────────────
echo ""
echo "Step 1 — Registering admin routes in index.ts..."

if grep -q "adminRoutes" "$API_DIR/src/routes/index.ts"; then
  echo "⚠️  Already registered — skipping"
else
  sed -i "s|import doctorDashRoutes|import adminRoutes        from './admin.routes';\nimport doctorDashRoutes|" \
    "$API_DIR/src/routes/index.ts"
  sed -i "s|router.use('/doctor'|router.use('/admin',        adminRoutes);\nrouter.use('/doctor'|" \
    "$API_DIR/src/routes/index.ts"
  echo "✅ Admin routes registered at /api/v1/admin"
fi

# ── Step 2: Seed admin user ──────────────────────────────────
echo ""
echo "Step 2 — Seeding admin user..."

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function run() {
  const existing = await p.user.findFirst({ where: { role: 'ADMIN' } });
  if (existing) {
    console.log('⚠️  Admin already exists:', existing.email);
    await p.\$disconnect();
    return;
  }
  const hash  = await bcrypt.hash('Admin@HC2025!', 12);
  const admin = await p.user.create({
    data: {
      email:           'admin@healthconnect.sbs',
      passwordHash:    hash,
      role:            'ADMIN',
      registrationId:  'HC-ADMIN-001',
      isEmailVerified: true,
      isActive:        true,
    }
  });
  console.log('✅ Admin created:', admin.email);
  console.log('   Password: Admin@HC2025!  ← change after first login');
  await p.\$disconnect();
}
run().catch(e => { console.error(e.message); p.\$disconnect(); process.exit(1); });
"

# ── Step 3: Build API ────────────────────────────────────────
echo ""
echo "Step 3 — Building API..."
npm run build 2>&1 | tail -6
pm2 restart hc-api
echo "✅ API restarted"

# ── Step 4: Test ─────────────────────────────────────────────
echo ""
echo "Step 4 — Testing admin login..."
sleep 3

curl -s -X POST https://api.healthconnect.sbs/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthconnect.sbs","password":"Admin@HC2025!"}' | \
  python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  u = d.get('data',{}).get('user',{})
  print('✅ Login OK — role:', u.get('role'), '| id:', u.get('id','')[:8]+'...')
except:
  print('⚠️  Parse error — check raw output')
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend done! Now deploy frontend:"
echo ""
echo "  FRONTEND FILES TO COPY:"
echo ""
echo "  1. Layout (CREATE folder first):"
echo "     mkdir -p $WEB_DIR/src/app/admin-dashboard"
echo "     admin-layout.tsx  →  src/app/admin-dashboard/layout.tsx"
echo ""
echo "  2. Overview page:"
echo "     admin-overview-page.tsx  →  src/app/admin-dashboard/page.tsx"
echo ""
echo "  3. Users page:"
echo "     mkdir -p $WEB_DIR/src/app/admin-dashboard/users"
echo "     admin-users-page.tsx  →  src/app/admin-dashboard/users/page.tsx"
echo ""
echo "  4. Verification page:"
echo "     mkdir -p $WEB_DIR/src/app/admin-dashboard/verification"
echo "     admin-verification-page.tsx  →  src/app/admin-dashboard/verification/page.tsx"
echo ""
echo "  5. Revenue page:"
echo "     mkdir -p $WEB_DIR/src/app/admin-dashboard/revenue"
echo "     admin-revenue-page.tsx  →  src/app/admin-dashboard/revenue/page.tsx"
echo ""
echo "  6. Communities page:"
echo "     mkdir -p $WEB_DIR/src/app/admin-dashboard/communities"
echo "     admin-communities-page.tsx  →  src/app/admin-dashboard/communities/page.tsx"
echo ""
echo "  7. Updated middleware:"
echo "     middleware.ts  →  src/middleware.ts"
echo ""
echo "  Then run:"
echo "     cd $WEB_DIR && npm run build && pm2 restart hc-web"
echo ""
echo "  Admin URL:      https://healthconnect.sbs/admin-dashboard"
echo "  Admin email:    admin@healthconnect.sbs"
echo "  Admin password: Admin@HC2025!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
