#!/bin/bash
# HealthConnect Landing Page — Full Dynamic Upgrade
# Run this entire script on your server as root

set -e
API=/var/www/healthconnect/healthconnect-api
WEB=/var/www/healthconnect/healthconnect-web

echo "========================================"
echo " STEP 1: Add Testimonial model to Prisma"
echo "========================================"

# Append Testimonial model to schema if not already there
if ! grep -q "model Testimonial" $API/prisma/schema.prisma; then
  cat >> $API/prisma/schema.prisma << 'PRISMA'

model Testimonial {
  id          String   @id @default(uuid())
  name        String   @unique
  role        String
  location    String?
  condition   String?
  emoji       String   @default("👤")
  quote       String
  stars       Int      @default(5)
  isPublished Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
}
PRISMA
  echo "✅ Testimonial model added to schema"
else
  echo "⚠️  Testimonial model already exists, skipping"
fi

echo ""
echo "========================================"
echo " STEP 2: Run Prisma migration"
echo "========================================"
cd $API
npx prisma migrate dev --name add_testimonial_table --skip-seed
echo "✅ Migration complete"

echo ""
echo "========================================"
echo " STEP 3: Seed testimonials"
echo "========================================"
cat > /tmp/seed-testimonials.ts << 'SEED'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const data = [
    { name:'Meena Patel',      role:'Patient',  location:'Chennai',     condition:'Type 2 Diabetes', emoji:'👩',    quote:'My HbA1c dropped from 9.2 to 5.8 in 8 months. The combination of tracking tools, community support, and finding the right endocrinologist changed everything.', stars:5, isPublished:true, sortOrder:1 },
    { name:'Dr. Arvind Sharma',role:'Doctor',   location:'AIIMS Delhi', condition:'Cardiologist',    emoji:'👨‍⚕️', quote:'Managing 30+ patients a day was overwhelming. HealthConnect dashboard gives me everything at a glance — health history, recent reports, medication lists.', stars:5, isPublished:true, sortOrder:2 },
    { name:'Anonymous Member', role:'Patient',  location:'Mumbai',      condition:'Mental Health',   emoji:'🧑',    quote:'I have never spoken about my mental health journey publicly. But the anonymous posting here felt safe. The community gave me the courage to finally seek professional help.', stars:5, isPublished:true, sortOrder:3 },
    { name:'Rajesh Kumar',     role:'Patient',  location:'Bangalore',   condition:'Hypertension',    emoji:'👨',    quote:'The medication reminders alone changed my adherence from 60% to 98%. My doctor noticed the improvement within weeks.', stars:5, isPublished:true, sortOrder:4 },
  ];
  for (const t of data) {
    await (prisma as any).testimonial.upsert({ where:{ name:t.name }, create:t, update:t });
  }
  console.log('✅ Testimonials seeded');
  await prisma.$disconnect();
}
main().catch(e=>{ console.error(e); process.exit(1); });
SEED

cp /tmp/seed-testimonials.ts $API/seed-testimonials.ts
cd $API && npx ts-node seed-testimonials.ts
rm $API/seed-testimonials.ts
echo "✅ Testimonials seeded"

echo ""
echo "========================================"
echo " STEP 4: Add public routes to backend"
echo "========================================"

cat > $API/src/routes/public.routes.ts << 'PUBLICROUTES'
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const ok  = (res: any, data: any) => res.json({ success: true, data });
const err = (res: any, msg: string, code = 500) => res.status(code).json({ success: false, message: msg });

// Public doctor search
router.get('/doctors', async (req, res) => {
  try {
    const { specialty, search, limit = '12' } = req.query as any;
    const where: any = { user: { role: 'DOCTOR', isActive: true } };
    if (specialty && specialty !== 'all') where.specialization = { contains: specialty, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        { specialization:    { contains: search, mode: 'insensitive' } },
        { hospital:          { contains: search, mode: 'insensitive' } },
      ];
    }
    const doctors = await prisma.doctorProfile.findMany({
      where, take: parseInt(limit), orderBy: { averageRating: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    return ok(res, doctors.map(d => ({
      id: d.id,
      name: `Dr. ${d.user.firstName} ${d.user.lastName}`,
      specialization: d.specialization ?? 'General Physician',
      hospital:       d.hospital       ?? '',
      experience:     d.experience     ?? 0,
      languages:      d.languages      ?? [],
      rating:         Number(d.averageRating ?? 4.5),
      reviews:        d.totalReviews   ?? 0,
      consultationFee: d.consultationFee ?? 500,
      isAvailable:    d.isAvailable    ?? false,
    })));
  } catch (e) { console.error(e); return err(res, 'Failed to fetch doctors'); }
});

// Public communities
router.get('/communities', async (req, res) => {
  try {
    const { limit = '6' } = req.query as any;
    const communities = await prisma.community.findMany({
      where: { isActive: true }, take: parseInt(limit), orderBy: { memberCount: 'desc' },
      select: { id: true, name: true, slug: true, description: true, category: true, type: true, memberCount: true, icon: true, isFeatured: true },
    });
    return ok(res, communities);
  } catch (e) { return err(res, 'Failed to fetch communities'); }
});

// Public community posts
router.get('/communities/:id/posts', async (req, res) => {
  try {
    const { limit = '3' } = req.query as any;
    const posts = await prisma.post.findMany({
      where: { communityId: req.params.id }, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true, role: true } }, _count: { select: { comments: true } } },
    });
    return ok(res, posts.map(p => ({
      id:           p.id,
      body:         p.body,
      isAnonymous:  p.isAnonymous,
      authorName:   p.isAnonymous ? 'Anonymous Member' : `${p.author?.firstName ?? ''} ${p.author?.lastName ?? ''}`.trim(),
      isDoctor:     p.author?.role === 'DOCTOR',
      createdAt:    p.createdAt,
      likeCount:    (p as any).likeCount    ?? 0,
      supportCount: (p as any).supportCount ?? 0,
      helpfulCount: (p as any).helpfulCount ?? 0,
      commentCount: p._count.comments,
    })));
  } catch (e) { return err(res, 'Failed to fetch posts'); }
});

// Public testimonials
router.get('/testimonials', async (_req, res) => {
  try {
    const t = await (prisma as any).testimonial.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' }, take: 6 });
    return ok(res, t);
  } catch (e) { return err(res, 'Failed to fetch testimonials'); }
});

// Public articles
router.get('/articles', async (req, res) => {
  try {
    const { limit = '6', category } = req.query as any;
    const where: any = { isPublished: true };
    if (category && category !== 'all') where.category = category;
    const articles = await prisma.article.findMany({
      where, take: parseInt(limit), orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      select: { id: true, title: true, slug: true, category: true, authorName: true, isVerified: true, readTime: true, difficulty: true, isTrending: true, isFeatured: true, viewCount: true, publishedAt: true },
    });
    return ok(res, articles);
  } catch (e) { return err(res, 'Failed to fetch articles'); }
});

export default router;
PUBLICROUTES

echo "✅ public.routes.ts created"

echo ""
echo "========================================"
echo " STEP 5: Register public routes in index"
echo "========================================"

# Add public routes import and registration if not already there
if ! grep -q "publicRoutes" $API/src/routes/index.ts; then
  sed -i "s/import platformRoutes/import publicRoutes from '.\/public.routes';\nimport platformRoutes/" $API/src/routes/index.ts
  sed -i "s/router.use('\/platform'/router.use('\/public',         publicRoutes);\nrouter.use('\/platform'/" $API/src/routes/index.ts
  echo "✅ Public routes registered"
else
  echo "⚠️  Public routes already registered"
fi

echo ""
echo "========================================"
echo " STEP 6: Build and restart API"
echo "========================================"
cd $API
npm run build 2>&1 | tail -5
pm2 restart hc-api
echo "✅ API restarted"

echo ""
echo "========================================"
echo " STEP 7: Test public endpoints"
echo "========================================"
sleep 2
echo "Testing /public/doctors..."
curl -s https://api.healthconnect.sbs/api/v1/public/doctors?limit=2 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ doctors: {len(d.get(\"data\",[]))} results')" 2>/dev/null || echo "⚠️  Check manually"

echo "Testing /public/communities..."
curl -s https://api.healthconnect.sbs/api/v1/public/communities?limit=2 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ communities: {len(d.get(\"data\",[]))} results')" 2>/dev/null || echo "⚠️  Check manually"

echo "Testing /public/testimonials..."
curl -s https://api.healthconnect.sbs/api/v1/public/testimonials | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ testimonials: {len(d.get(\"data\",[]))} results')" 2>/dev/null || echo "⚠️  Check manually"

echo ""
echo "========================================"
echo " Backend setup complete!"
echo " Now copy the frontend files and rebuild."
echo "========================================"
