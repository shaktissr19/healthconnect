// scripts/seed-community-posts.ts
// Uses exact field names from schema.prisma — no assumptions.
// Post model: id, communityId, authorId, title, body, tags, isAnonymous,
//             anonymousAlias, status, isPinned, viewCount, createdAt, updatedAt
// CommunityMember: id, communityId, userId, role(String), isApproved, joinedAt
//
// Run: npx tsx scripts/seed-community-posts.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const POSTS = [
  {
    communitySlug: 'diabetes-warriors',
    title: '🎉 Finally got my HbA1c below 7 after 8 months!',
    body: `After 8 months of consistent effort — meal planning, daily walks, and tracking every meal — I finally got my HbA1c down to 6.8. My doctor was so happy.

The biggest change? Evening walks of 30 minutes after dinner. Nothing fancy. No gym. Just walking. My blood sugar spikes after dinner used to be terrible, and this simple habit changed everything.

For anyone struggling — it does get better. Small changes compound. You are not alone. 🙏`,
    isAnonymous: false,
    tags: ['HbA1c', 'Type2', 'success', 'walking'],
    daysAgo: 2,
  },
  {
    communitySlug: 'diabetes-warriors',
    title: 'Metformin side effects — what helped me survive the first 6 weeks',
    body: `Started Metformin 3 months ago and the first 6 weeks were rough. Nausea, bloating, loose stools. I almost gave up.

What helped:
1. Taking it with the largest meal of the day, not an empty stomach
2. Starting at half dose and building up slowly (always ask your doctor first)
3. Probiotics — my diabetologist suggested this and it made a real difference

Now I have zero side effects. Please do not give up before trying these.`,
    isAnonymous: false,
    tags: ['Metformin', 'sideeffects', 'tips'],
    daysAgo: 3,
  },
  {
    communitySlug: 'mental-wellness-india',
    title: 'First therapy session done. I cried the whole time and that was okay.',
    body: `I finally went. After two years of telling myself I did not need it, after hiding my anxiety from my family because "log kya sochenge", I finally went for therapy.

I cried for 45 minutes straight. My therapist just listened. She did not judge me. She just let me feel it.

I feel lighter today than I have in months. If you have been thinking about going — please go. You deserve to be heard. 🤍`,
    isAnonymous: true,
    anonymousAlias: 'Hopeful Sparrow',
    tags: ['therapy', 'anxiety', 'firsttime', 'mentalhealth'],
    daysAgo: 1,
  },
  {
    communitySlug: 'mental-wellness-india',
    title: 'How I explained my depression to my Indian parents',
    body: `This took me 2 years. My parents thought I was being dramatic.

What worked: explaining depression as a physical illness. I showed them brain scans. I compared it to diabetes — you would not tell a diabetic to just think positive.

They still do not fully understand. But they stopped dismissing it. And my mother now asks how my therapy is going. That is everything. 💙`,
    isAnonymous: false,
    tags: ['depression', 'family', 'India', 'stigma'],
    daysAgo: 4,
  },
  {
    communitySlug: 'heart-health-circle',
    title: 'Cardiac rehab changed my life after my heart attack',
    body: `Six months ago I had a heart attack at 52. I thought my life was over. Scared to climb stairs, scared to exercise.

My cardiologist enrolled me in cardiac rehab. 12 weeks of supervised exercise, medication education, and peer support.

Today I walk 5 km every morning. My ejection fraction improved from 35% to 52%. I am back at work.

If your doctor suggests cardiac rehab — please do not refuse. It heals your fear too. 🙏❤️`,
    isAnonymous: false,
    tags: ['heartattack', 'cardiacrehab', 'recovery'],
    daysAgo: 5,
  },
  {
    communitySlug: 'pcos-sisters',
    title: 'PCOS at 28 felt like my world ended. I have two kids now.',
    body: `Diagnosed with PCOS at 28. Told conceiving naturally would be very difficult. I cried every time I saw a pregnancy announcement.

Three years of lifestyle changes, inositol, metformin, and one IUI later — I have a 4-year-old and a 2-year-old.

PCOS does not define your fertility story. Harder is not impossible. 🌸`,
    isAnonymous: false,
    tags: ['PCOS', 'fertility', 'IUI', 'inositol', 'hope'],
    daysAgo: 6,
  },
  {
    communitySlug: 'cancer-support-network',
    title: '5 years cancer-free today',
    body: `Five years ago today I heard the word malignant. Breast cancer, Stage 2B. I had two children under 10.

Today I rang the bell. Five years cancer-free.

The chemo, the hair loss, the surgeries, the fear every scan. But I am here.

To everyone in treatment right now — I see you. Keep going. The other side exists. 💙`,
    isAnonymous: false,
    tags: ['breastcancer', 'survivor', '5years', 'cancerfree'],
    daysAgo: 1,
  },
  {
    communitySlug: 'thyroid-talk',
    title: 'Taking thyroid medication with chai was destroying its effectiveness',
    body: `I was taking Eltroxin for 3 years and always felt exhausted despite normal TSH. Turns out I was taking it with morning chai.

Calcium in milk blocks thyroxine absorption by up to 60%. I switched to taking it 45 minutes before any food, plain water only.

Within 6 weeks — same dose — fatigue improved dramatically. Brain fog lifted. Hair stopped falling out.

Check how you are taking your thyroid medication. It matters enormously. 🦋`,
    isAnonymous: false,
    tags: ['thyroid', 'Eltroxin', 'TSH', 'tips', 'absorption'],
    daysAgo: 7,
  },
  {
    communitySlug: 'hypertension-heroes',
    title: 'BP from 160/100 to 118/76 — same medication, different lifestyle',
    body: `My cardiologist was shocked. Same medication for two years, BP completely transformed.

What changed: 10-minute morning meditation (free on YouTube). Stopped reading news after 8 PM. Reduced — not eliminated — salt. Started saying no to things that drained me.

Also bought a home BP monitor and tracked every morning. Seeing numbers improve daily was incredibly motivating.

BP is not just about medication. Your whole life matters. 💊`,
    isAnonymous: false,
    tags: ['hypertension', 'BP', 'lifestyle', 'meditation'],
    daysAgo: 3,
  },
  {
    communitySlug: 'senior-care-india',
    title: 'Caring for my 78-year-old mother — what I wish I had known',
    body: `My mother has lived with us 3 years since her second fall. Osteoporosis, mild cognitive decline, hypertension. I am her primary caregiver while working full-time.

What I wish someone had told me:
1. Caregiver burnout is real. Get respite care — even 2 hours a week matters enormously.
2. Fall-proofing is highest impact: remove rugs, install grab bars, add night lights.
3. See a geriatrician, not just a general physician. They see the whole picture.
4. Your frustration is normal. You are not a bad person for feeling exhausted.

This community helped me see I was not alone. 🙏`,
    isAnonymous: false,
    tags: ['elderlycare', 'caregiver', 'burnout', 'osteoporosis'],
    daysAgo: 2,
  },
];

async function main() {
  console.log('🌱 HealthConnect Community Post Seeder\n');

  // Get admin user by email only — no Role enum, no user creation
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@healthconnect.sbs' },
  });
  if (!admin) {
    console.error('❌ admin@healthconnect.sbs not found in DB. Exiting.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Found admin: ${admin.email} (${admin.id})\n`);

  let seeded = 0, skipped = 0, failed = 0;

  for (const p of POSTS) {
    try {
      // Find community by slug — exact match first, then partial name
      let community = await prisma.community.findFirst({
        where: { slug: p.communitySlug },
      });
      if (!community) {
        community = await prisma.community.findFirst({
          where: { name: { contains: p.communitySlug.replace(/-/g, ' '), mode: 'insensitive' } },
        });
      }
      if (!community) {
        // Try first keyword
        const keyword = p.communitySlug.split('-')[0];
        community = await prisma.community.findFirst({
          where: { name: { contains: keyword, mode: 'insensitive' } },
        });
      }

      if (!community) {
        console.log(`⚠️  Not found: "${p.communitySlug}" — skipping`);
        skipped++;
        continue;
      }

      // Skip duplicate
      const existing = await prisma.post.findFirst({
        where: {
          communityId: community.id,
          title: { contains: p.title.slice(0, 20), mode: 'insensitive' },
        },
      });
      if (existing) {
        console.log(`⏭  Exists: "${p.title.slice(0, 55)}"`);
        skipped++;
        continue;
      }

      // Ensure admin is a member — role is plain String per schema
      await prisma.communityMember.upsert({
        where: { communityId_userId: { communityId: community.id, userId: admin.id } },
        create: { communityId: community.id, userId: admin.id, role: 'MEMBER' },
        update: {},
      });

      // Create post with EXACT schema field names only
      const daysMs = (p.daysAgo || 1) * 24 * 60 * 60 * 1000;
      const rnd = Math.random() * 6 * 60 * 60 * 1000;
      const createdAt = new Date(Date.now() - daysMs - rnd);

      await prisma.post.create({
        data: {
          communityId:    community.id,
          authorId:       admin.id,
          title:          p.title,
          body:           p.body,
          tags:           p.tags || [],
          isAnonymous:    p.isAnonymous || false,
          anonymousAlias: p.isAnonymous ? ((p as any).anonymousAlias ?? null) : null,
          status:         'PUBLISHED',   // PostStatus enum value
          isPinned:       false,
          viewCount:      0,
          createdAt,
          updatedAt:      createdAt,
        },
      });

      console.log(`✅ "${p.title.slice(0, 60)}" → ${community.name}`);
      seeded++;

    } catch (err: any) {
      console.log(`❌ "${p.title.slice(0, 50)}"\n   ${err?.message?.slice(0, 200)}`);
      failed++;
    }
  }

  console.log(`\n✅ Seeded: ${seeded} | ⏭  Skipped: ${skipped} | ❌ Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('❌ Fatal:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
