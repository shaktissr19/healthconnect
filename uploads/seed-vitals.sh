#!/bin/bash
# Run on VPS: seeds vitals for rahul@demo.hc and creates uploads folder

WEB=/var/www/healthconnect/healthconnect-web
API=/var/www/healthconnect/healthconnect-api

echo "=== Step 1: Ensure uploads folder exists ==="
mkdir -p /var/www/healthconnect/uploads
chmod 755 /var/www/healthconnect/uploads
echo "  /var/www/healthconnect/uploads ✅"

echo ""
echo "=== Step 2: Seed vitals via Prisma ==="
cat > /tmp/seed-vitals.ts << 'TSEOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find Rahul
  const user = await prisma.user.findUnique({ where: { email: 'rahul@demo.hc' } });
  if (!user) { console.log('User not found'); return; }
  console.log('Found user:', user.firstName, user.lastName);

  // Delete existing vitals to avoid duplicates
  await prisma.vital.deleteMany({ where: { patientId: user.id } });

  const now = new Date();
  const vitals = [];

  // Generate 30 days of vitals
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    vitals.push(
      // Blood Pressure
      { patientId: user.id, type: 'BLOOD_PRESSURE', systolic: 118 + Math.floor(Math.random()*15), diastolic: 76 + Math.floor(Math.random()*10), unit: 'mmHg', recordedAt: new Date(date) },
      // Heart Rate
      { patientId: user.id, type: 'HEART_RATE', value: 68 + Math.floor(Math.random()*20), unit: 'bpm', recordedAt: new Date(date) },
      // Blood Sugar (every 3 days)
      ...(i % 3 === 0 ? [{ patientId: user.id, type: 'BLOOD_SUGAR', value: 95 + Math.floor(Math.random()*30), unit: 'mg/dL', recordedAt: new Date(date) }] : []),
      // Weight (weekly)
      ...(i % 7 === 0 ? [{ patientId: user.id, type: 'WEIGHT', value: 72.5 + (Math.random() * 2 - 1), unit: 'kg', recordedAt: new Date(date) }] : []),
    );
  }

  // Add today's SpO2 and temperature
  vitals.push(
    { patientId: user.id, type: 'SPO2',        value: 98,   unit: '%',  recordedAt: now },
    { patientId: user.id, type: 'TEMPERATURE', value: 98.4, unit: '°F', recordedAt: now },
  );

  await prisma.vital.createMany({ data: vitals, skipDuplicates: true });
  console.log(`Seeded ${vitals.length} vitals for ${user.firstName} ${user.lastName}`);

  // Refresh health score
  const hs = await prisma.healthScore.findFirst({ where: { patientId: user.id } });
  if (hs) {
    await prisma.healthScore.update({
      where: { id: hs.id },
      data: { calculatedAt: now, trend: 'improving' }
    });
    console.log('Health score updated');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
TSEOF

cd $API
npx ts-node /tmp/seed-vitals.ts
echo ""
echo "=== Step 3: Verify reports endpoint ==="
curl -s https://api.healthconnect.sbs/api/v1/patient/reports \
  -H "Authorization: Bearer $(curl -s -X POST https://api.healthconnect.sbs/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"rahul@demo.hc","password":"patient@123"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["token"])')" \
  | python3 -m json.tool | head -20
