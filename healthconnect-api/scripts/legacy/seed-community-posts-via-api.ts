// seed-community-posts.ts
// Run with: npx ts-node seed-community-posts.ts
// Or: npx tsx seed-community-posts.ts
// ─────────────────────────────────────────────────────────────────────────────
// Seeds 10 inspiring Indian patient stories across communities
// Uses the backend API so all hooks (reactions, notifications) fire correctly
// ─────────────────────────────────────────────────────────────────────────────

const API = process.env.API_URL || 'https://api.healthconnect.sbs/api/v1';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // Set this in env

// Community slugs — adjust if your slugs are different
const COMMUNITIES: Record<string, string> = {
  'diabetes-warriors':      '',
  'heart-health-circle':    '',
  'mental-wellness-india':  '',
  'pcos-sisters':           '',
  'cancer-support-network': '',
  'thyroid-talk':           '',
  'arthritis-joint-warriors':'',
  'hypertension-heroes':    '',
  'nutrition-wellness-hub': '',
};

const POSTS = [
  // ── Diabetes Warriors ────────────────────────────────────────────────────
  {
    community: 'diabetes-warriors',
    title: '🎉 Finally got my HbA1c below 7 after 8 months!',
    body: `After 8 months of consistent effort — meal planning, daily evening walks of 45 minutes, and tracking every meal — I finally got my HbA1c down to 6.8. My doctor was so happy he showed me the graph. It dropped from 9.2.

What actually worked for me:
1. Evening walks right after dinner (blood sugar spikes less)
2. Switching from white rice to millets — bajra roti especially
3. Checking my sugar before and 2 hours after every meal for 2 weeks — the patterns shocked me
4. Stopping the "one cheat day" mentality — replaced it with "one small treat fits the plan"

If you are newly diagnosed and feeling overwhelmed, please know — it gets better. This community helped me so much during the hard months. You are not alone.`,
    postType: 'success',
    isAnonymous: false,
    tags: ['HbA1c', 'success', 'millets', 'exercise'],
    authorName: 'Priya M., Mumbai',
  },
  {
    community: 'diabetes-warriors',
    body: `My father was diagnosed with Type 2 last year at 62. The hardest part was not his medication — it was helping him understand that this is manageable. He grew up in a generation that saw diabetes as a death sentence.

What changed everything: I printed out a simple one-page "What to eat / What to avoid" list in Hindi and stuck it on the fridge. No apps, no glucose tracking sheets. Just that list.

He has lost 8 kg and his sugar is controlled without insulin now. Sometimes the simple solutions are the most powerful ones. Sharing this for anyone caring for an elderly parent with diabetes.`,
    postType: 'tip',
    isAnonymous: false,
    tags: ['type2', 'elderly', 'family', 'diet'],
    authorName: 'Rajesh K., Pune',
  },

  // ── Mental Wellness India ─────────────────────────────────────────────────
  {
    community: 'mental-wellness-india',
    body: `I want to share something I was ashamed of for 3 years. I have OCD. Not the "I like clean desks" kind — the real kind, with intrusive thoughts that made me afraid of leaving my house some days.

I finally told my wife. She did not run. She cried. Then she booked my first psychiatry appointment.

I am 14 months into treatment now. Medication helped me reach a baseline where therapy could actually work. ERP therapy (Exposure Response Prevention) is hard but it works.

If you are hiding something like this — please tell one person. Just one. The secret is often worse than the condition.`,
    postType: 'normal',
    isAnonymous: true,
    tags: ['OCD', 'therapy', 'ERP', 'mental-health'],
    authorName: '',
  },
  {
    community: 'mental-wellness-india',
    title: 'For anyone who thinks therapy is "not for Indians"',
    body: `My mother said therapy is what people do when they have no family support. My father said our generation did not need therapy and we "figured it out."

I went anyway. I have been going for 11 months.

Here is what I will say to anyone who faces this: Our generation is not weaker. We are braver — brave enough to ask for help our parents did not know was available.

Therapy did not make me soft. It made me understand why I kept choosing the wrong relationships, why I was always angry at work, and why I could not sleep. That is not weakness. That is self-knowledge.

You deserve the same. Try one session. Just one.`,
    postType: 'tip',
    isAnonymous: false,
    tags: ['therapy', 'stigma', 'India', 'mental-health'],
    authorName: 'Anika S., Bangalore',
  },

  // ── PCOS Sisters ─────────────────────────────────────────────────────────
  {
    community: 'pcos-sisters',
    title: '2 years, PCOS, and finally pregnant 🌸',
    body: `I was diagnosed with PCOS at 24. The doctor told me "you may have difficulty conceiving." I went home and cried for a week.

Two years of effort later — tracking cycles, managing insulin resistance (metformin 500mg, lifestyle changes), losing 11 kg — I got a positive test last month. I am 9 weeks now.

This community kept me sane during months when my cycle was 60+ days long, when OPKs never showed a peak, when I felt broken.

You are not broken. PCOS is manageable. Fertility with PCOS is possible. It took me longer but here I am.

To everyone still in the waiting — I see you. I was you. Keep going.`,
    postType: 'success',
    isAnonymous: false,
    tags: ['PCOS', 'fertility', 'pregnancy', 'metformin'],
    authorName: 'Deepa R., Chennai',
  },
  {
    community: 'pcos-sisters',
    body: `Something nobody told me about PCOS: the grief. Grieving the body you thought you had. Grieving the timeline you planned. Grieving normal periods that just... never came.

I went through this grief silently for 2 years before I found communities like this one.

If you are newly diagnosed and feeling that same grief — please let yourself feel it. It is real. Then, when you are ready, come back here. We have information, support, and real stories from real women who understand exactly what you are going through.

You are welcome here.`,
    postType: 'normal',
    isAnonymous: true,
    tags: ['PCOS', 'diagnosis', 'grief', 'support'],
    authorName: '',
  },

  // ── Heart Health Circle ───────────────────────────────────────────────────
  {
    community: 'heart-health-circle',
    title: 'My heart attack at 41 — what I wish I had known',
    body: `I had a heart attack at 41. No prior diagnosis. No warnings I recognised — though looking back, there were signs I dismissed.

The crushing chest pressure I thought was acidity for 3 days. The jaw pain I thought was a tooth problem. The fatigue I blamed on work stress.

I am sharing this because the Indian male tendency to ignore symptoms cost me 40% of my heart function. My ejection fraction is 45% now. I am managing, but I will never get those 5 missed years back.

Please — if you feel something is wrong, go to a cardiologist. Not tomorrow. Today. Your "overreaction" is infinitely better than a late diagnosis.

I am 44 now. I walk 5km daily, eat very clean, and take my medications faithfully. Life after a heart attack is still a good life. But prevention is always better.`,
    postType: 'tip',
    isAnonymous: false,
    tags: ['heart-attack', 'symptoms', 'awareness', 'prevention'],
    authorName: 'Suresh N., Delhi',
  },

  // ── Cancer Support Network ────────────────────────────────────────────────
  {
    community: 'cancer-support-network',
    body: `My mother completed her 6th chemo cycle yesterday. I want to write something for the caregivers in this community — because we are also fighting, just differently.

Things I learned that nobody told me:
- You are allowed to cry. Not in front of her — I went to my car. But you need to release it somewhere.
- Hospital food is terrible. Bringing home-cooked soft foods made such a difference to her spirit.
- Nurses know things doctors do not have time to tell you. Be kind to nurses.
- Cancer changes your relationship with time. Suddenly every ordinary Tuesday is precious.

To every caregiver here — you are doing an extraordinary thing. Please do not forget to take care of yourself too.`,
    postType: 'normal',
    isAnonymous: false,
    tags: ['chemo', 'caregiver', 'support', 'family'],
    authorName: 'Vikram P., Hyderabad',
  },

  // ── Thyroid Talk ──────────────────────────────────────────────────────────
  {
    community: 'thyroid-talk',
    body: `Took me 4 years and 3 doctors to get a proper diagnosis. Four years of being told my fatigue was "lifestyle," my weight gain was "diet," my brain fog was "stress." 

Finally saw an endocrinologist who tested my T3 and T4 properly — not just TSH. Hashimoto's thyroiditis confirmed. Started on levothyroxine 50mcg.

Three months in: I remember words again. I can get through a workday without a 2-hour nap. I lost 4kg without trying.

The lesson: know your numbers. TSH alone is not enough. Push for full thyroid panel. You know your body better than anyone.`,
    postType: 'normal',
    isAnonymous: false,
    tags: ['Hashimotos', 'diagnosis', 'T3', 'T4', 'levothyroxine'],
    authorName: 'Meera L., Kochi',
  },

  // ── Hypertension Heroes ───────────────────────────────────────────────────
  {
    community: 'hypertension-heroes',
    body: `My BP was 160/100 for 2 years. I refused medication because my father said "once you start, you never stop."

My doctor finally said something that changed my mind: "Your kidneys, eyes, and brain are paying the price of that belief right now — silently."

I started amlodipine. BP is 118/76 today. I feel no different taking the medication. But my silent organs are being protected.

There is no shame in medication. The shame is in avoidable damage. Sharing this for anyone in the same boat I was in.`,
    postType: 'tip',
    isAnonymous: false,
    tags: ['BP', 'amlodipine', 'medication', 'awareness'],
    authorName: 'Harish B., Ahmedabad',
  },
];

async function getCommunityId(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/communities/${slug}`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.data || data;
    return c.id || c._id || null;
  } catch {
    console.error(`Failed to fetch community ${slug}`);
    return null;
  }
}

async function seedPost(post: typeof POSTS[0], communityId: string): Promise<void> {
  try {
    const body: Record<string, any> = {
      body: post.body,
      postType: post.postType,
      isAnonymous: post.isAnonymous,
      tags: post.tags,
    };
    if (post.title) body.title = post.title;
    if (post.isAnonymous && post.postType) body.anonymousAlias = post.authorName || 'Community Member';

    const res = await fetch(`${API}/communities/${communityId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const postId = (data.data || data)?.id || (data.data || data)?._id;
      console.log(`  ✅ Posted: "${(post.title || post.body).slice(0, 50)}…"`);

      // Add some initial reactions to make posts look active
      if (postId) {
        await addReactions(postId, communityId);
      }
    } else {
      const err = await res.text();
      console.error(`  ❌ Failed: ${res.status} — ${err.slice(0, 100)}`);
    }
  } catch (e) {
    console.error(`  ❌ Error posting:`, e);
  }
}

async function addReactions(postId: string, _communityId: string): Promise<void> {
  // Add a few reactions to make the post look active
  try {
    await fetch(`${API}/communities/posts/${postId}/react`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionType: 'LIKE' }),
    });
  } catch { /**/ }
}

async function main() {
  console.log('🌱 HealthConnect Community Post Seeder');
  console.log(`📡 API: ${API}`);
  console.log(`🔑 Token: ${ADMIN_TOKEN ? '✓ Set' : '❌ NOT SET — set ADMIN_TOKEN env var'}`);
  console.log('');

  if (!ADMIN_TOKEN) {
    console.error('❌ ADMIN_TOKEN is required. Get it from your dashboard or DB.');
    console.error('   Run: ADMIN_TOKEN=your_token_here npx tsx seed-community-posts.ts');
    process.exit(1);
  }

  // Resolve community slugs to IDs
  console.log('🔍 Resolving community IDs...');
  const slugToId: Record<string, string> = {};
  for (const slug of Object.keys(COMMUNITIES)) {
    const id = await getCommunityId(slug);
    if (id) {
      slugToId[slug] = id;
      console.log(`  ✅ ${slug} → ${id}`);
    } else {
      console.log(`  ⚠️  ${slug} → not found (skipping posts for this community)`);
    }
  }

  console.log('');
  console.log('📝 Seeding posts...');

  for (const post of POSTS) {
    const communityId = slugToId[post.community];
    if (!communityId) {
      console.log(`  ⏭️  Skipping post for ${post.community} (community not found)`);
      continue;
    }
    console.log(`\n→ ${post.community}`);
    await seedPost(post, communityId);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n✅ Seeding complete!');
  console.log('\nNext steps:');
  console.log('  1. Visit healthconnect.sbs/communities to see live feed populated');
  console.log('  2. Verify posts appear in each community feed');
  console.log('  3. Add more reactions manually to boost engagement scores');
}

main().catch(console.error);
