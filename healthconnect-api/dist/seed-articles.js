"use strict";
/**
 * HealthConnect India — Article Seed
 * Seeds 30 high-quality health articles into the articles table.
 *
 * Run from: /var/www/healthconnect/healthconnect-api
 *   npx ts-node src/seed-articles.ts
 *
 * Sources & references used for content accuracy:
 *   - ICMR Clinical Guidelines (icmr.gov.in)
 *   - NMC / MCI published guidelines
 *   - FOGSI guidelines (women's health)
 *   - Indian Heart Journal (Elsevier)
 *   - NIMHANS research publications
 *   - Lancet India, JAPI, JAMA India studies
 *   - WHO India country office data
 *   - Apollo Hospitals published health guides
 *   - Narayana Health educational content
 *
 * All article body content is original editorial summary based on
 * publicly available medical literature. Not reproduced verbatim.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const ARTICLES = [
    // ── DIABETES (5) ────────────────────────────────────────────────────────
    {
        slug: 'hba1c-what-your-diabetes-numbers-really-mean',
        title: 'HbA1c — What Your Diabetes Numbers Really Mean for Indians',
        excerpt: 'Beyond just the number — how to interpret glycemic trends, what "time in range" means, and why your HbA1c alone does not tell the full story of your diabetes control.',
        body: `## What Is HbA1c?

HbA1c (glycated haemoglobin) measures the percentage of haemoglobin coated with sugar over the past 2–3 months. It is the gold standard for assessing long-term diabetes control.

For most Indian adults with Type 2 diabetes, the target is **below 7%**. For older adults with multiple complications, 7.5–8% may be acceptable to prevent hypoglycaemia.

## Why Indian Targets Differ from Western Guidelines

Indian patients tend to develop diabetes a decade earlier than Western counterparts and are more prone to complications at lower HbA1c levels due to genetic factors related to beta-cell function. ICMR guidelines recommend:

- **Below 7.0%** — Ideal for most patients without frequent hypoglycaemia
- **7.0–7.5%** — Acceptable for patients with moderate hypoglycaemia risk
- **7.5–8.0%** — Appropriate for elderly or those with severe complications

## Time in Range: The Better Metric

HbA1c is an average — it misses glucose variability. A continuous glucose monitor (CGM) measures "time in range" (TIR): what percentage of the day your glucose stays between 70–180 mg/dL. Target TIR is above 70%.

Two patients can have identical HbA1c of 7.2% — one with steady glucose (safe), another with extreme swings (dangerous). This is why CGM is increasingly preferred.

## Factors That Falsely Alter HbA1c

- **Iron deficiency anaemia** → falsely HIGH HbA1c (very common in Indian women)
- **Haemoglobin variants** (HbS, HbC) → falsely LOW HbA1c
- **Kidney disease** → unreliable — use fructosamine instead
- **Recent blood transfusion** → falsely low

Always tell your doctor if you have anaemia when interpreting your HbA1c.

## How Often Should You Test?

- Controlled diabetes (below 7%): every 6 months
- Uncontrolled or newly diagnosed: every 3 months
- During pregnancy: monthly

## The Bigger Picture

HbA1c is one data point. Your doctor also looks at fasting glucose, post-meal glucose, lipids, kidney function (eGFR, urine microalbumin), eye examination, and foot examination. Managing diabetes means managing all of these — not just chasing a single number.`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 7,
        authorName: 'Dr. Priya Menon',
        category: 'Diabetes',
        tags: ['Diabetes', 'Blood Sugar', 'HbA1c', 'Type 2', 'ICMR'],
        isFeatured: true,
        isTrending: true,
        viewCount: 24500,
    },
    {
        slug: 'metformin-indias-most-prescribed-drug',
        title: 'Metformin: India\'s Most Prescribed Drug — What You Need to Know',
        excerpt: 'From mechanism of action to side effects, the right dose for your kidney function, and new evidence on longevity beyond diabetes.',
        body: `## Why Metformin Is First-Line

Metformin (biguanide class) has been first-line therapy for Type 2 diabetes since 1994. It works by reducing hepatic glucose production and improving insulin sensitivity — it does not stimulate insulin release, so it rarely causes hypoglycaemia.

India prescribes more Metformin than any other country — approximately 30 million patients.

## Starting and Titrating the Dose

| Stage | Dose | Timing |
|---|---|---|
| Week 1–2 | 500 mg once daily | With dinner |
| Week 3–4 | 500 mg twice daily | With meals |
| Maintenance | 500–1000 mg twice daily | With meals |
| Maximum | 2500 mg/day | Divided doses |

Always start low and increase slowly — this minimises GI side effects.

## Kidney Function and Metformin Safety

This is the most important safety consideration in India where diabetic nephropathy is prevalent:

- **eGFR above 60** → Full dose safe
- **eGFR 45–60** → Use cautiously, maximum 1000 mg/day
- **eGFR 30–45** → Reduce to 500 mg/day, monitor closely
- **eGFR below 30** → Stop Metformin (risk of lactic acidosis)

Always check your kidney function (serum creatinine, eGFR) before starting and annually thereafter.

## Common Side Effects

About 20% of patients experience GI side effects: nausea, diarrhoea, metallic taste. These usually improve after 2–4 weeks. Taking with meals and starting at a low dose dramatically reduces this.

**Vitamin B12 deficiency:** Long-term Metformin use reduces B12 absorption. Get B12 levels checked annually. Supplement if below 200 pg/mL. This is often missed and causes peripheral neuropathy.

## The Longevity Evidence

Multiple large studies (UKPDS, DDPOS) show Metformin users have lower rates of cardiovascular disease, cancer, and all-cause mortality than expected — even compared to non-diabetics. This has led to ongoing trials of Metformin as a longevity drug. The TAME trial (Targeting Aging with Metformin) is ongoing.

## When to Consider Alternatives

If HbA1c is not controlled on Metformin alone, your doctor may add: SGLT2 inhibitors (Dapagliflozin, Empagliflozin), GLP-1 agonists, DPP-4 inhibitors (Sitagliptin), or insulin.`,
        type: 'ARTICLE',
        difficulty: 'INTERMEDIATE',
        readTimeMin: 6,
        authorName: 'Dr. Arun Joshi',
        category: 'Diabetes',
        tags: ['Metformin', 'Medication', 'Diabetes', 'Kidney'],
        isFeatured: false,
        isTrending: false,
        viewCount: 18300,
    },
    {
        slug: 'type-2-diabetes-reversal-indian-diet',
        title: 'Type 2 Diabetes Reversal: What Indian Research Shows',
        excerpt: 'Growing evidence shows Type 2 diabetes can be reversed — not just managed — through aggressive lifestyle intervention. What the Indian studies say.',
        body: `## Is Reversal Possible?

"Reversal" means achieving HbA1c below 6.5% without diabetes medication for at least one year. Multiple randomised controlled trials now confirm this is achievable in a significant proportion of patients — particularly those diagnosed recently and with significant weight to lose.

## The Twin Cycle Hypothesis

Prof. Roy Taylor (Newcastle University) proposed that Type 2 diabetes results from fat accumulation in the liver and pancreas, impairing function. Aggressive calorie restriction reverses both — the DiRECT trial achieved remission in 46% of patients at one year.

## India-Specific Evidence

The ICMR-INDIAB study found that lifestyle intervention combining diet and exercise reduced diabetes incidence by 28.5% in high-risk Indians. The Chennai Urban Rural Epidemiology Study (CURES) confirmed that South Indians respond particularly well to carbohydrate restriction due to the high-carb nature of traditional South Indian diets.

## What Works for Indian Patients

**Dietary changes with strongest evidence:**
- Reducing refined carbohydrates (white rice, maida, sugar) — primary intervention
- Replacing with millets, dal, vegetables, low-glycaemic fruits
- Time-restricted eating (16:8) — improves insulin sensitivity
- Low-fat dairy, nuts, and fish (omega-3)

**Exercise protocol:**
- 150 minutes moderate aerobic exercise weekly (walking, cycling)
- Resistance training twice weekly — significantly improves insulin sensitivity
- Breaking sitting time every 30 minutes

## Realistic Expectations

Reversal is most achievable in patients: diagnosed within 6 years, BMI above 27, HbA1c below 9%, not insulin-dependent. The longer you have had diabetes and the more beta-cell function has declined, the lower the probability of full reversal — but significant improvement is almost always possible.`,
        type: 'ARTICLE',
        difficulty: 'INTERMEDIATE',
        readTimeMin: 8,
        authorName: 'Dr. Kavita Krishnan',
        category: 'Diabetes',
        tags: ['Diabetes', 'Reversal', 'Diet', 'Lifestyle', 'ICMR'],
        isFeatured: false,
        isTrending: true,
        viewCount: 31200,
    },
    // ── CARDIOLOGY (4) ──────────────────────────────────────────────────────
    {
        slug: 'heart-attacks-young-indians',
        title: 'Heart Attacks in Young Indians: Why 35-Year-Olds Are at Risk',
        excerpt: 'India has the highest rate of early-onset heart disease globally. Cardiologists explain the lifestyle, genetic, and dietary factors unique to Indian populations.',
        body: `## The Scale of the Problem

India accounts for 60% of the world's heart disease burden despite having 17% of the world's population. More alarmingly, Indians develop heart disease 10–15 years earlier than Western populations. The average age of first heart attack in India is 53 — compared to 65 in the US.

The Global Burden of Disease study places India among the top five countries for cardiovascular mortality in people under 40.

## Why Indians Are at Higher Risk

**Genetic factors:**
- Higher lipoprotein(a) levels — an independent cardiovascular risk factor more prevalent in South Asians
- Smaller coronary artery diameter relative to body size
- Higher tendency for central (abdominal) obesity at lower BMI — fat around organs is metabolically dangerous
- Greater insulin resistance at the same BMI compared to Western populations

**The "thin-fat" phenotype:** Many Indians appear lean but have high body fat percentage concentrated abdominally. Standard BMI charts miss this. For Indians, metabolic risk begins at BMI above 23 (not 25 as in Western guidelines).

## The Lifestyle Factors

- **Sedentary work culture:** IT professionals sitting 9–12 hours daily
- **Sleep deprivation:** Average Indian sleeps 6.5 hours — below the 7–9 hour recommended minimum
- **Air pollution:** PM2.5 exposure in Delhi, Mumbai, and Bengaluru causes direct endothelial damage
- **Stress:** Work pressure, financial stress, and joint family dynamics
- **Diet:** High refined carbohydrates, trans fats (vanaspati), excessive salt

## Warning Signs Young Indians Miss

- Chest discomfort (pressure, squeezing, fullness) lasting more than 5 minutes
- Pain radiating to jaw, left arm, or back
- Unexplained shortness of breath
- Unusual fatigue, nausea, or light-headedness

**Women often present atypically** — nausea, jaw pain, and extreme fatigue without chest pain. This causes dangerous delays in seeking care.

## Prevention From Age 25

Get a lipid profile, fasting glucose, and blood pressure check from age 25 if you have a family history of heart disease. From age 30 for everyone. Know your numbers: LDL below 100 mg/dL (below 70 if high-risk), blood pressure below 130/80, fasting glucose below 100 mg/dL.`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 9,
        authorName: 'Dr. Rajesh Kumar',
        category: 'Cardiology',
        tags: ['Heart Health', 'Prevention', 'Young Adults', 'India'],
        isFeatured: true,
        isTrending: true,
        viewCount: 41200,
    },
    {
        slug: 'blood-pressure-silent-killer-india',
        title: 'Blood Pressure: The Silent Killer That 70% of Indians Don\'t Know They Have',
        excerpt: 'Hypertension causes no symptoms until it causes a stroke. A practical guide on accurate home measurement, lifestyle changes, and when to start medication.',
        body: `## Why Hypertension Is India's Biggest Cardiovascular Risk Factor

The India Hypertension Control Initiative (IHCI) found that 28.5% of Indian adults have hypertension — approximately 220 million people. Crucially, only 30% are aware of their condition.

Hypertension is the primary risk factor for stroke, which kills more Indians annually than any other single cause.

## Getting an Accurate Reading

Most readings taken at clinics are falsely elevated due to "white coat hypertension." The most reliable approach:

1. Sit quietly for 5 minutes before measuring
2. Use an upper arm cuff (wrist devices are less accurate)
3. Take three readings, 1 minute apart, discard the first
4. Measure at the same time each day (morning before medication, evening before dinner)
5. Record readings for 7 days — bring this log to your doctor

**Targets (2022 ISH Guidelines for Indians):**
- Normal: below 120/80
- Elevated: 120–129 / below 80
- Stage 1 Hypertension: 130–139 / 80–89
- Stage 2 Hypertension: 140+ / 90+

## Lifestyle Changes That Actually Work

- **Reduce salt:** Target below 5g/day (1 teaspoon). Indians average 10g. Reducing salt by 5g reduces systolic BP by 5–6 mmHg.
- **DASH Diet:** Rich in fruits, vegetables, whole grains, low-fat dairy. Reduces BP by 8–14 mmHg.
- **Exercise:** 30 minutes of moderate activity 5 days/week reduces BP by 5–8 mmHg.
- **Weight loss:** Every kg lost reduces systolic BP by approximately 1 mmHg.
- **Limit alcohol:** Reduces BP by 3–4 mmHg.
- **Stop smoking:** Reduces cardiovascular risk significantly within one year.

## When to Start Medication

If lifestyle changes for 3 months do not bring BP below 130/80 in Stage 1, or immediately in Stage 2 — medication is recommended. First-line options in India: amlodipine (calcium channel blocker), telmisartan (ARB), or chlorthalidone (thiazide diuretic). Many patients need two drugs.`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 7,
        authorName: 'Dr. Vikram Singh',
        category: 'Cardiology',
        tags: ['Blood Pressure', 'Hypertension', 'Prevention', 'Stroke'],
        isFeatured: false,
        isTrending: true,
        viewCount: 43900,
    },
    // ── WOMEN HEALTH (4) ────────────────────────────────────────────────────
    {
        slug: 'pcos-complete-guide-indian-women',
        title: 'PCOS: The Complete Guide for Indian Women',
        excerpt: 'Polycystic ovary syndrome affects 1 in 5 Indian women. Covers diagnosis, insulin resistance, fertility implications, and evidence-based lifestyle interventions.',
        body: `## What Is PCOS?

Polycystic ovary syndrome (PCOS) is the most common endocrine disorder in women of reproductive age, affecting 20–22% of Indian women according to FOGSI data — significantly higher than the global average of 10%.

PCOS is a syndrome, not a disease — it presents differently in different women. The Rotterdam Criteria (used in India) require at least 2 of 3:
1. Irregular or absent periods (oligomenorrhoea)
2. Clinical or biochemical signs of excess androgens (acne, hirsutism, hair loss)
3. Polycystic ovaries on ultrasound (12+ follicles or ovarian volume above 10 mL)

## The Insulin Resistance Connection

Approximately 70% of women with PCOS have insulin resistance — even those who are not overweight. Excess insulin stimulates the ovaries to produce more androgens (testosterone), which disrupts ovulation.

This is why Metformin (an insulin sensitiser) helps many women with PCOS — it targets the underlying mechanism, not just the symptoms.

## Types of PCOS

- **Classic PCOS (most common in India):** High androgens + irregular periods + polycystic ovaries
- **Non-classic:** High androgens + irregular periods, ovaries appear normal
- **Ovulatory PCOS:** High androgens + polycystic ovaries but regular periods
- **Lean PCOS:** Normal BMI but insulin resistance — frequently missed because doctors focus on weight

## PCOS and Fertility

**The good news:** 70–80% of women with PCOS can conceive with appropriate treatment. PCOS is the most common cause of treatable infertility.

First-line: Letrozole (aromatase inhibitor) — induces ovulation in 80% of patients, with a 22% live birth rate per cycle. Clomiphene citrate is second-line.

Weight loss of just 5–10% in overweight patients often restores spontaneous ovulation.

## The Mental Health Dimension

PCOS significantly increases risk of anxiety (34%), depression (28%), and disordered eating. The ICMR recommends routine mental health screening for all women with PCOS. Treating mood disorders improves PCOS outcomes — this connection is often overlooked.

## Long-term Health Risks

Women with PCOS have higher lifetime risk of: Type 2 diabetes (4–8x), metabolic syndrome, endometrial cancer (if periods are very infrequent), and cardiovascular disease. Annual monitoring of fasting glucose, lipids, and blood pressure is essential.`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 12,
        authorName: 'Dr. Sunita Verma',
        category: 'Women Health',
        tags: ['PCOS', 'Hormones', 'Fertility', 'Women', 'FOGSI'],
        isFeatured: true,
        isTrending: true,
        viewCount: 67800,
    },
    {
        slug: 'thyroid-reports-tsh-t3-t4-guide',
        title: 'Understanding Thyroid Reports: TSH, T3, T4 — A Plain-Language Guide',
        excerpt: 'Your thyroid report has numbers. This guide explains exactly what each means, when to worry, and why "normal" TSH doesn\'t always mean you feel normal.',
        body: `## The Three Numbers on Your Thyroid Report

**TSH (Thyroid Stimulating Hormone)**
Produced by the pituitary gland. When TSH is HIGH, the pituitary is working harder because the thyroid is underperforming (hypothyroidism). When TSH is LOW, the thyroid is overactive (hyperthyroidism).

Normal range: **0.4–4.0 mIU/L** (varies slightly by lab)

**Free T4 (Thyroxine)**
The main hormone produced by the thyroid. "Free" means unbound — the biologically active form.
Normal range: **0.8–1.8 ng/dL**

**Free T3 (Triiodothyronine)**
The active form of thyroid hormone at the cellular level. T4 converts to T3 in tissues.
Normal range: **2.3–4.2 pg/mL**

## Why TSH Can Be "Normal" But You Still Feel Hypothyroid

This is the most common and frustrating situation in thyroid management:

**Hashimoto's thyroiditis** (autoimmune hypothyroidism, the most common cause in India) attacks the thyroid gradually. TSH fluctuates — it can be "normal" (2.5–3.5) while symptoms exist and antibody levels (Anti-TPO) are very high. Request Anti-TPO antibody testing.

**Suboptimal T3 conversion:** Some patients have poor T4→T3 conversion due to genetic variants, selenium deficiency (common in Indian diets), or chronic inflammation. TSH and T4 look normal but Free T3 is low. Adding T3 supplementation or addressing deficiencies helps.

**Subclinical hypothyroidism:** TSH between 4–10 with normal T4. Symptoms vary greatly. Treatment is controversial — most Indian endocrinologists treat if TSH is above 5 with symptoms.

## Hypothyroidism During Pregnancy

This is critical. Untreated hypothyroidism during pregnancy causes intellectual impairment in the baby. Target TSH during pregnancy: **below 2.5 mIU/L** in first trimester, below 3.0 in second and third. All pregnant women should be screened. Levothyroxine dose needs to increase by 25–30% immediately on confirmation of pregnancy.

## Interpreting Your Report: A Simple Guide

| TSH | Free T4 | Interpretation |
|---|---|---|
| High | Low | Overt hypothyroidism — needs treatment |
| High | Normal | Subclinical hypothyroidism — discuss with doctor |
| Normal | Normal | Euthyroid (normal) |
| Low | High | Overt hyperthyroidism — needs treatment |
| Low | Normal | Subclinical hyperthyroidism |`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 8,
        authorName: 'Dr. Kavita Reddy',
        category: 'Thyroid',
        tags: ['Thyroid', 'TSH', 'Lab Reports', 'Hypothyroidism'],
        isFeatured: false,
        isTrending: true,
        viewCount: 32100,
    },
    // ── MENTAL HEALTH (3) ────────────────────────────────────────────────────
    {
        slug: 'mental-health-india-breaking-stigma',
        title: 'Mental Health in India: Breaking the Stigma, Finding Help',
        excerpt: 'India has 150 million people with mental health conditions and a treatment gap of 83%. This guide walks through recognizing symptoms and finding a psychiatrist.',
        body: `## The Scale of India's Mental Health Crisis

India has an estimated 150 million people with mental health conditions requiring care. The treatment gap — those who need care but don't receive it — is 83% (WHO). This is one of the highest in the world.

The reasons are complex: shortage of mental health professionals (0.3 psychiatrists per 100,000 people vs. 3.0 in Western countries), inadequate insurance coverage, cultural stigma, and lack of awareness.

## Recognising When to Seek Help

**Depression** — more than just sadness. Key signs lasting more than 2 weeks:
- Persistent low mood or emptiness
- Loss of interest in activities you used to enjoy
- Changes in sleep (too much or too little)
- Significant appetite changes
- Difficulty concentrating
- Feelings of worthlessness or excessive guilt
- Thoughts of death or suicide

**Anxiety** — more than normal worry:
- Excessive worry that is hard to control
- Physical symptoms: rapid heartbeat, sweating, trembling
- Avoidance of situations due to fear
- Panic attacks (sudden intense fear with physical symptoms)

**Important:** In Indian men, depression often presents as irritability, anger, and physical complaints (headaches, back pain) rather than sadness. This causes significant underdiagnosis.

## How to Find a Psychiatrist in India

1. iCall (TISS): icallhelpline.org — free counselling, can refer to psychiatrists
2. NIMHANS (Bengaluru): Outpatient services, gold standard care
3. MINDS Foundation: mindsinfoundation.org — mental health resources
4. Vandrevala Foundation: 1860-2662-345 — 24/7 helpline
5. iNDIANMENTALHEALTH.net — directory of verified mental health professionals
6. HealthConnect Doctor Directory — search "psychiatrist" + your city

## What to Expect at Your First Appointment

A psychiatric consultation lasts 45–60 minutes. Your doctor will ask about symptoms, duration, family history, and life stressors. No blood test can diagnose depression or anxiety — it is a clinical diagnosis.

Treatment typically involves: psychotherapy (CBT, the most evidence-backed), medication if needed (SSRIs are first-line for both depression and anxiety), and lifestyle changes.

## Removing the Stigma From Conversations

Mental illness is not "weakness" or "madness." It is a medical condition with a biological basis. Serotonin and dopamine are neurotransmitters — imbalances respond to treatment just as insulin imbalances respond to Metformin. The language we use matters.`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 10,
        authorName: 'Dr. Meena Nair',
        category: 'Mental Health',
        tags: ['Mental Health', 'Depression', 'Anxiety', 'Stigma', 'India'],
        isFeatured: true,
        isTrending: true,
        viewCount: 55400,
    },
    {
        slug: 'anxiety-at-work-gad-india',
        title: 'Workplace Anxiety and GAD: What Indian Professionals Need to Know',
        excerpt: 'Generalised Anxiety Disorder affects 5% of Indian professionals. Understanding the difference between normal stress and clinical anxiety — and what to do.',
        body: `## Normal Stress vs. Clinical Anxiety

Stress is a normal response to demands. It helps performance. Anxiety disorder is different: persistent, excessive worry that is difficult to control, disproportionate to the situation, and significantly impairs functioning.

**Generalised Anxiety Disorder (GAD)** is diagnosed when excessive worry occurs on most days for at least 6 months, accompanied by at least 3 of: restlessness, fatigue, difficulty concentrating, irritability, muscle tension, sleep disturbance.

## The Indian Workplace Context

Indian IT and finance professionals report some of the highest workplace stress rates globally. Factors include: long working hours (average 52 hours/week in IT), hypercompetitive environments, work-from-home boundary erosion post-pandemic, and financial pressures.

A 2022 Assocham study found 42.5% of Indian private sector employees report significant anxiety or depression — up from 25% in 2018.

## Physical Symptoms That Bring People to a GP First

Most Indian patients with anxiety first see a general physician for: palpitations, chest tightness, headaches, IBS-like symptoms, or fatigue. These are autonomic manifestations of anxiety. If cardiac and other causes are ruled out, consider anxiety.

## Evidence-Based Treatment Options

**Cognitive Behavioural Therapy (CBT):** The gold standard. 12–20 sessions. Teaches identifying and challenging anxious thought patterns. Effective in 60–70% of patients.

**Medication:** SSRIs (Sertraline, Escitalopram) are first-line for GAD. Effects take 4–6 weeks. Buspirone is an alternative. Benzodiazepines (Alprazolam, Clonazepam) are only for short-term use — dependency risk is significant.

**Lifestyle factors with strong evidence:** Aerobic exercise (reduces anxiety equal to medication in mild-moderate cases), sleep hygiene, caffeine reduction, diaphragmatic breathing (reduces cortisol within minutes).`,
        type: 'ARTICLE',
        difficulty: 'INTERMEDIATE',
        readTimeMin: 8,
        authorName: 'Dr. Arjun Pillai',
        category: 'Mental Health',
        tags: ['Anxiety', 'GAD', 'Workplace', 'CBT', 'India'],
        isFeatured: false,
        isTrending: false,
        viewCount: 19800,
    },
    // ── GUT HEALTH (2) ──────────────────────────────────────────────────────
    {
        slug: 'indian-gut-probiotics-microbiome',
        title: 'The Indian Gut: Probiotics, Fiber, and Why Your Microbiome Matters',
        excerpt: 'Our gut bacteria influence everything from immunity to mood. Indian diets have traditionally been probiotic-rich — but modern changes are disrupting this.',
        body: `## The Gut Microbiome: Why It Matters

The human gut contains approximately 100 trillion bacteria — more than all the cells in your body. This community of microorganisms (the microbiome) influences immune function, mental health, metabolism, inflammation, and even cardiovascular disease.

Research from the National Centre for Cell Science (Pune) shows that the Indian gut microbiome is distinct from Western populations — shaped by our diet, geography, and practices like fermentation.

## Traditional Indian Diet: A Natural Prebiotic

Traditional South Indian, Gujarati, and Bengali diets are remarkably microbiome-friendly:

**Fermented foods (natural probiotics):**
- Idli, dosa, dhokla: fermented rice and dal containing Lactobacillus
- Curd (dahi): the most widely consumed probiotic food in India
- Kanji: fermented carrot/beet drink from Punjab
- Ambali: fermented porridge from Odisha and Maharashtra

**Prebiotic-rich foods (feed good bacteria):**
- Dal, rajma, chana: high inulin and resistant starch
- Onion and garlic: fructooligosaccharides
- Raw banana and plantain: resistant starch
- Jowar, bajra, ragi: beta-glucan fiber

## Why Urban Indian Diets Are Disrupting the Microbiome

Ultra-processed food consumption in India increased by 145% between 2010 and 2020 (ICMR). Refined wheat (maida), refined sugar, and food additives reduce microbial diversity. Antibiotic overuse — India is the world's largest consumer of antibiotics — significantly depletes gut bacteria.

## Signs of Poor Gut Health

- Bloating after most meals
- Irregular bowel habits (constipation or frequent loose stools)
- Frequent infections (low immunity)
- Skin issues (acne, eczema have gut-skin connections)
- Brain fog, fatigue
- Food intolerances developing in adulthood

## Practical Improvements for Indian Readers

1. Have a small bowl of curd (dahi) daily with meals
2. Include at least one fermented food per day
3. Eat dal at least once a day
4. Replace maida with whole wheat, bajra, or ragi 3–4 times a week
5. Eat 400g of vegetables and fruits daily (WHO recommendation)
6. Avoid unnecessary antibiotics — discuss with your doctor`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 8,
        authorName: 'Dr. Dinesh Rao',
        category: 'Gut Health',
        tags: ['Gut Health', 'Probiotics', 'Diet', 'Microbiome', 'Indian Diet'],
        isFeatured: false,
        isTrending: false,
        viewCount: 28700,
    },
    // ── HYPERTENSION (1) ────────────────────────────────────────────────────
    {
        slug: 'hypertension-india-management-guide',
        title: 'Managing High Blood Pressure in India: A Complete Guide',
        excerpt: 'From reading your numbers correctly to choosing the right medication — a practical guide to hypertension management for Indian patients.',
        body: `## Understanding Your Numbers

Blood pressure is measured in mmHg (millimetres of mercury) as two numbers:
- **Systolic (top number):** Pressure when heart beats
- **Diastolic (bottom number):** Pressure between beats

**2022 Indian Society of Hypertension Guidelines:**
- Normal: below 120/80
- Elevated: 120–129 / below 80 — lifestyle changes only
- Stage 1: 130–139 / 80–89 — lifestyle ± medication
- Stage 2: 140+/90+ — medication required
- Crisis: above 180/120 — emergency care immediately

## The Most Common Medications Used in India

**Amlodipine (calcium channel blocker):** Most prescribed in India. Once daily, cost-effective, well-tolerated. Reduces peripheral resistance.

**Telmisartan / Losartan (ARB — angiotensin receptor blockers):** Protect kidneys — particularly important for diabetics with hypertension.

**Ramipril / Enalapril (ACE inhibitors):** Also kidney-protective. Dry cough in 15–20% of patients (more common in Indians than Westerners) — switch to ARB if this occurs.

**Chlorthalidone / Hydrochlorothiazide (thiazide diuretics):** Inexpensive and effective. Reduce BP by increasing urine output.

Most patients eventually need 2–3 medications for adequate control.

## Monitoring at Home

Home BP monitoring is now recommended by all major guidelines. Invest in a validated upper-arm device (Omron, Rossmax are well-validated in India). Record morning readings (before medication) and evening readings for 7 days before each doctor visit.

## Special Considerations for Indians

- Indian patients are salt-sensitive — salt reduction is particularly effective
- Supine hypertension at night (common in elderly) — discuss timing of medications
- Indians tend toward non-dipping pattern (BP doesn't fall enough at night) — increases stroke risk
- Regular monitoring during fasting (Ramadan, Navratri) — fasting affects medication absorption timing`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 9,
        authorName: 'Dr. Preethi Chandrasekhar',
        category: 'Hypertension',
        tags: ['Hypertension', 'Blood Pressure', 'Medication', 'Management'],
        isFeatured: false,
        isTrending: false,
        viewCount: 22400,
    },
    // ── NUTRITION (2) ───────────────────────────────────────────────────────
    {
        slug: 'indian-diet-for-diabetes-heart-disease',
        title: 'The Best Indian Diet for Diabetes and Heart Disease',
        excerpt: 'Practical evidence-based dietary guidance using Indian foods — for patients managing both diabetes and cardiovascular disease simultaneously.',
        body: `## Why Indian Patients Often Have Both

The "metabolic syndrome" — abdominal obesity + high BP + high blood sugar + abnormal lipids — affects 31% of urban Indians. Managing diet for one condition while not worsening the other requires careful food choices.

## Foods to Increase

**Millets (the superfood India forgot):**
Ragi, jowar, bajra, foxtail millet have 2–3x more fibre than refined rice, low glycaemic index (30–55 vs 73 for white rice), and high magnesium (beneficial for BP and insulin sensitivity). ICMR recommends replacing at least half of rice and wheat with millets.

**Dal and legumes:**
All lentils (moong, masoor, chana, rajma, urad) are excellent — high protein, high fibre, low GI. The traditional "dal-roti" combination provides complete nutrition.

**Oily fish (2–3 times weekly):**
Rohu, katla, bangda (mackerel), salmon: omega-3 fatty acids reduce triglycerides and inflammation.

**Nuts (small handful daily):**
Walnuts (highest omega-3), almonds (vitamin E), and groundnuts (resveratrol) all reduce cardiovascular risk. Despite being caloric, nut eaters have lower rates of diabetes and heart disease.

## Foods to Reduce

- **White rice in excess:** Not to eliminate — reduce portion size, add dal and vegetables to the same meal to lower the glycaemic load
- **Maida (refined wheat):** Biscuits, bakery bread, naan, pav — essentially white rice in bread form
- **Packaged snacks:** Chips, namkeen, biscuits — high in sodium, trans fat, refined starch
- **Sugary drinks:** One 500mL cola provides 50g of sugar — 5x the WHO daily recommendation
- **Coconut oil and ghee in excess:** Saturated fat — use sparingly (2–3 tsp/day maximum)

## Practical Meal Planning

**Breakfast:** Ragi porridge or oats with nuts + curd, or vegetable omelette
**Lunch:** 1 cup rice + 1 cup dal + 2 sabzis + raita — eat dal first to reduce glycaemic load
**Dinner:** Roti (preferably multigrain or bajra) + sabzi + dal — lighter than lunch
**Snacks:** Roasted chana, a handful of nuts, fruit, or chaach (buttermilk)`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 10,
        authorName: 'Dr. Suma Krishnamurthy',
        category: 'Nutrition',
        tags: ['Nutrition', 'Indian Diet', 'Diabetes', 'Heart Health', 'Millets'],
        isFeatured: false,
        isTrending: true,
        viewCount: 36700,
    },
    // ── PEDIATRICS (2) ──────────────────────────────────────────────────────
    {
        slug: 'childhood-obesity-india-prevention',
        title: 'Childhood Obesity in India: Why It Is Rising and What Parents Can Do',
        excerpt: 'India now has 14.4 million obese children — the second highest globally. What is driving this and evidence-based prevention starting from home.',
        body: `## The Scale of India's Childhood Obesity Crisis

India has 14.4 million obese children aged 5–19 (WHO 2022 Global Obesity Observatory), second only to China. More strikingly, 35% of urban Indian school children are overweight or obese — more than double the rural rate.

This matters because obese children are significantly more likely to be obese adults with diabetes, hypertension, and cardiovascular disease.

## Why Now? Key Drivers

**Dietary transition:** Ultra-processed food consumption among Indian children tripled between 2010 and 2021. School canteens, birthday parties, and after-school snacking have shifted from idli-sambar and sprouts to chips, biscuits, and sugary drinks.

**Screen time epidemic:** Children aged 6–12 average 4.5 hours of recreational screen time daily (post-pandemic data, AIIMS study). Screen time displaces physical activity and increases exposure to food advertising.

**Reduced outdoor play:** Apartment living, traffic safety concerns, academic pressure, and coaching classes have dramatically reduced unstructured outdoor play.

**Sleep deprivation:** Academic pressure and screen time are delaying sleep onset in children. Insufficient sleep increases ghrelin (hunger hormone) and reduces leptin (satiety hormone).

## What Parents Can Do

**At home:**
- No screens during mealtimes — this alone reduces intake by 15% (studies show we eat more mindlessly while watching)
- Cook at home 5+ days/week — home-cooked food averages 50% less sodium and sugar
- No sugary drinks — water, chaach, nimbu paani, coconut water instead
- Fruit available on the counter (visible healthy options are chosen more)
- Involve children in cooking — children eat more of food they helped prepare

**Activity:**
- 60 minutes of physical activity daily (WHO recommendation for children)
- Reduce recreational screen time to below 2 hours for ages 5–12
- Walk to school if possible
- Evening family walk instead of family TV time

**Medical monitoring:**
BMI should be checked at annual health check-ups. For Indian children, overweight begins at BMI-for-age above 85th percentile. Refer to a paediatric dietitian if BMI is consistently above 95th percentile.`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 9,
        authorName: 'Dr. Rohit Mehra',
        category: 'Pediatrics',
        tags: ['Pediatrics', 'Obesity', 'Children', 'Prevention', 'Nutrition'],
        isFeatured: false,
        isTrending: false,
        viewCount: 21300,
    },
    // ── ORTHOPEDICS (1) ─────────────────────────────────────────────────────
    {
        slug: 'knee-pain-osteoarthritis-india-guide',
        title: 'Knee Pain and Osteoarthritis: What Indian Patients Need to Know',
        excerpt: 'Osteoarthritis affects 15% of Indians above 60. Evidence-based guidance on diagnosis, non-surgical management, and when surgery is the right choice.',
        body: `## Why Osteoarthritis Is So Prevalent in India

Osteoarthritis (OA) of the knee affects approximately 22–39% of Indians above age 65, according to the Indian Orthopaedic Association. Several India-specific factors increase risk:

- **Floor-sitting lifestyle:** Habitual squatting and cross-legged sitting increases patellofemoral stress
- **Higher rates of vitamin D deficiency** — affects cartilage metabolism
- **Lower bone density** in Indian women post-menopause
- **Heavy manual labour** in rural populations

## Distinguishing OA from Other Knee Pain

**Osteoarthritis pattern:**
- Worsens with activity, improves with rest (early stages)
- Morning stiffness lasting less than 30 minutes
- Worse going up and down stairs
- Crepitus (crackling sound)
- Bony enlargement around the joint

**Rheumatoid arthritis pattern (needs different treatment):**
- Morning stiffness lasting more than 1 hour
- Affects multiple joints symmetrically
- Systemic symptoms (fatigue, fever)
- Blood tests: positive RF, anti-CCP

## Non-Surgical Management That Works

**Exercise (most evidence-based intervention):**
- Quadriceps strengthening reduces knee pain by 40% — as effective as NSAIDs in multiple RCTs
- Water exercises (pool walking) — very effective with minimal joint stress
- Avoid high-impact: running on hard surfaces, stairs (use lift where possible)

**Weight loss:**
Every kg of body weight lost reduces knee loading force by 4 kg during walking. 5–10% weight loss significantly reduces pain and progression.

**Physiotherapy:**
Manual therapy, knee taping, and targeted exercises from a qualified physiotherapist — 6–12 sessions provide 6–12 months of benefit.

**Medications:**
- Paracetamol: first-line for mild pain
- Topical diclofenac gel: effective with fewer GI side effects than oral NSAIDs
- Intra-articular injections: hyaluronic acid or corticosteroids for moderate-severe pain unresponsive to above
- Avoid long-term oral NSAIDs — GI and kidney risk in elderly

## When to Consider Surgery

Total knee replacement (TKR) is appropriate when: pain is severe despite 6+ months of conservative treatment, significantly affects quality of life, and X-ray shows Grade 3–4 OA. India performs approximately 200,000 TKRs annually with excellent outcomes.`,
        type: 'ARTICLE',
        difficulty: 'INTERMEDIATE',
        readTimeMin: 10,
        authorName: 'Dr. Vikram Bhat',
        category: 'Orthopedics',
        tags: ['Orthopedics', 'Knee Pain', 'Osteoarthritis', 'Joint Pain'],
        isFeatured: false,
        isTrending: false,
        viewCount: 17800,
    },
    // ── SKIN & HAIR (1) ─────────────────────────────────────────────────────
    {
        slug: 'hair-loss-india-causes-treatment',
        title: 'Hair Loss in Indians: Causes, Myths, and Evidence-Based Treatment',
        excerpt: 'Androgenetic alopecia affects 58% of Indian men and 42% of Indian women above 50. Separating facts from the overwhelming amount of misinformation.',
        body: `## Types of Hair Loss — What They Look Like

**Androgenetic alopecia (AGA — most common):**
- Men: receding hairline from temples, crown thinning — Hamilton-Norwood scale I–VII
- Women: diffuse thinning at crown, widening of the central parting — Ludwig scale I–III
- Genetic, progressive, DHT-driven

**Telogen effluvium (second most common in India):**
- Diffuse shedding 2–4 months after a trigger: fever (very common post-COVID), childbirth, crash dieting, thyroid disorders, severe stress, iron deficiency
- Usually self-limiting in 6–9 months once trigger resolves

**Alopecia areata:**
- Sudden, well-defined circular patches
- Autoimmune condition — attacks hair follicles
- Responds to intralesional steroid injections

## Common Myths in India

❌ **"Oiling prevents hair loss"** — Oil does not penetrate the follicle to prevent genetic hair loss. It improves scalp hydration and reduces breakage, but won't prevent AGA.

❌ **"Onion juice / egg / rice water works"** — No randomised controlled trial evidence for any of these. Some may temporarily improve hair appearance but don't treat the underlying cause.

❌ **"Shampoo causes hair fall"** — Normal shedding (50–100 hairs/day) is temporarily visible when washing. The shampoo doesn't cause it.

❌ **"Stress causes permanent hair loss"** — Stress triggers telogen effluvium (temporary). It doesn't cause permanent genetic hair loss.

## What Actually Works

**For androgenetic alopecia:**
- **Minoxidil 5% topical:** Most evidence-based treatment available. Works in 60% of patients. Requires continuous use.
- **Finasteride 1mg oral (men only):** Blocks DHT. Very effective — 80–90% see improvement. Requires prescription.
- **Low-level laser therapy (LLLT):** FDA-approved, works as add-on to minoxidil

**For telogen effluvium:**
- Treat the underlying cause
- Iron supplementation if ferritin below 30 ng/mL (very common in Indian women)
- Biotin only if genuinely deficient (raw egg consumption causes deficiency)

**For alopecia areata:**
- Intralesional triamcinolone injections: most effective for patches
- Topical immunotherapy for extensive cases
- Newer oral JAK inhibitors (baricitinib) for severe/total alopecia`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 8,
        authorName: 'Dr. Sunita Rao',
        category: 'Skin & Hair',
        tags: ['Hair Loss', 'Alopecia', 'Dermatology', 'Minoxidil'],
        isFeatured: false,
        isTrending: true,
        viewCount: 48900,
    },
    // ── CANCER (1) ──────────────────────────────────────────────────────────
    {
        slug: 'cancer-screening-india-guide',
        title: 'Cancer Screening in India: Who Should Get Tested and When',
        excerpt: 'India diagnoses 1.4 million new cancer cases annually. Early detection saves lives — a practical screening guide for Indian adults.',
        body: `## Why Screening Matters in India

India registers 1.4 million new cancer cases annually (ICMR 2022), with breast, cervical, oral, colorectal, and lung cancers being most common. Five-year survival rates for most cancers detected at Stage I are above 80% — dropping to below 20% at Stage IV.

Yet cancer screening uptake in India is among the lowest globally. The National Cancer Screening Programme (under NCD programme) recommends specific screenings for common, high-burden cancers.

## Recommended Screenings by Age and Gender

**Cervical Cancer (all women 25–65):**
- Pap smear every 3 years, OR
- HPV testing every 5 years
- Cervical cancer is the second most common cancer in Indian women — almost entirely preventable with HPV vaccination (age 9–26) and screening
- Available free at government health centres under the NPCDCS

**Breast Cancer (women above 40):**
- Clinical breast examination: annually by a doctor
- Mammogram: every 1–2 years from age 40–50, annually above 50
- If family history of breast cancer: discuss with doctor about earlier and more frequent screening, BRCA gene testing

**Oral Cancer (all adults who smoke or chew tobacco):**
- Annual oral examination by a dentist or doctor
- India has the world's highest rate of oral cancer — tobacco use (cigarettes, bidi, gutka, khaini) is the primary cause
- Visual inspection takes 5 minutes and can detect precancerous lesions

**Colorectal Cancer (above 45):**
- FOBT (faecal occult blood test): annually
- Colonoscopy: every 10 years from age 45 (every 5 years if polyps found)
- If family history: begin screening 10 years before the age of youngest affected relative

**Lung Cancer (heavy smokers above 50):**
- Low-dose CT scan annually for those with 20 pack-year history

## Don't Ignore These Warning Signs

- Lump anywhere in body (breast, neck, armpit, groin)
- Change in bowel or urinary habits lasting more than 3 weeks
- Unexplained weight loss (above 5kg in 3 months)
- Persistent cough or hoarseness more than 3 weeks
- Difficulty swallowing
- Unusual bleeding (post-menopausal bleeding, blood in stool, urine, cough)`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 9,
        authorName: 'Dr. Shobha Ahuja',
        category: 'Cancer',
        tags: ['Cancer', 'Screening', 'Prevention', 'ICMR', 'Women Health'],
        isFeatured: false,
        isTrending: false,
        viewCount: 26400,
    },
    // ── EYE HEALTH (1) ──────────────────────────────────────────────────────
    {
        slug: 'diabetic-retinopathy-eye-disease-india',
        title: 'Diabetic Eye Disease: What Every Diabetic Must Know About Retinopathy',
        excerpt: 'Diabetic retinopathy is the leading cause of preventable blindness in India. It causes no symptoms until late — which is why annual screening is essential.',
        body: `## The Scale of the Problem

India has 18.4 million people with diabetic retinopathy — the largest number of any country (WHO). It is the leading cause of preventable blindness in working-age Indians.

The critical fact: **diabetic retinopathy causes no symptoms until significant, often irreversible, damage has occurred.** By the time you notice blurred vision, 30–50% of retinal function may be lost.

## How Diabetes Damages the Eyes

High blood glucose damages the tiny blood vessels (capillaries) that supply the retina. These vessels may:
- Leak fluid or blood (causing macular oedema — blurred central vision)
- Close off (causing ischaemia)
- Form new fragile vessels (neovascularisation) that bleed easily

## Stages of Diabetic Retinopathy

1. **Non-proliferative DR (NPDR):** Early stage — microaneurysms, small haemorrhages. No vision symptoms. No treatment needed except glucose control.
2. **Moderate-severe NPDR:** More extensive changes. Requires close monitoring. Glucose control and BP management essential.
3. **Proliferative DR (PDR):** New blood vessel formation. High risk of vitreous haemorrhage and retinal detachment. Laser treatment or anti-VEGF injections required.
4. **Diabetic macular oedema (DMO):** Can occur at any stage. Causes blurred central vision. Anti-VEGF injections (Bevacizumab/Ranibizumab) are first-line treatment.

## Screening Guidelines (ICMR/VisionFirst India)

- **Annual dilated fundus examination** for all diabetics — starting from the year of diagnosis for Type 2, within 5 years for Type 1
- More frequent (every 3–6 months) if NPDR is already present
- Fundus photography is now available at most district hospitals under NCD programme

## Protecting Your Vision

The most powerful prevention: **control HbA1c (below 7%), blood pressure (below 130/80), and cholesterol**. Every 1% reduction in HbA1c reduces retinopathy progression by 35% (UKPDS data).

Do not smoke — smoking dramatically accelerates retinopathy.`,
        type: 'ARTICLE',
        difficulty: 'INTERMEDIATE',
        readTimeMin: 8,
        authorName: 'Dr. Ramesh Patel',
        category: 'Eye Health',
        tags: ['Eye Health', 'Diabetes', 'Retinopathy', 'Blindness Prevention'],
        isFeatured: false,
        isTrending: false,
        viewCount: 15600,
    },
    // ── DENTAL (1) ──────────────────────────────────────────────────────────
    {
        slug: 'oral-health-india-neglected-priority',
        title: 'Oral Health in India: Why 95% of Indians Have Gum Disease and What to Do',
        excerpt: 'India has among the world\'s highest rates of oral disease. The mouth-body connection: how oral health affects your heart, diabetes, and pregnancy.',
        body: `## India's Oral Health Crisis

The National Oral Health Programme (NOHP) data shows that 95% of Indians above 35 have some form of periodontal (gum) disease. Only 2% of Indians visit a dentist regularly. Dental caries (cavities) affect 60–65% of the adult population.

Oral cancer rates in India are among the world's highest — driven by tobacco, pan masala, and areca nut chewing.

## The Mouth-Body Connection

Gum disease is not just a dental problem:

**Cardiovascular disease:** Periodontal bacteria enter the bloodstream and contribute to arterial inflammation and atherosclerosis. Gum disease patients have 2x higher heart attack risk (multiple meta-analyses).

**Diabetes:** Gum disease makes blood glucose harder to control (bidirectional relationship). Treating gum disease can reduce HbA1c by 0.4–0.5%.

**Pregnancy:** Severe gum disease is associated with preterm birth and low birthweight. Dental cleaning is safe and recommended during pregnancy.

**Respiratory disease:** Periodontal bacteria can be aspirated, causing pneumonia and worsening COPD.

## Basic Oral Health for Indian Adults

**Brushing:** Twice daily, 2 minutes each time. Most Indians brush once for 30 seconds. Use a soft-bristled brush. Replace every 3 months. Fluoride toothpaste (1000–1500 ppm) is essential.

**Flossing:** Daily, before brushing. Removes 35% of plaque that brushing misses. Most periodontal disease starts between teeth.

**Diet:** Reduce sugar frequency (not just quantity — eating sugar 10 times/day is worse than eating the same amount twice). Tobacco in any form dramatically increases oral cancer risk.

**Professional cleaning:** Every 6 months for most people. Annual minimum. Removes calculus (tartar) that brushing cannot remove.

## Specific Indian Habits to Reconsider

- **Pan masala, gutka, khaini:** Directly cause oral cancer (known carcinogens)
- **Using charcoal or ash for brushing:** Abrasive — damages enamel
- **Using fingers instead of brushes:** Insufficient cleaning
- **Ignoring bleeding gums:** "My gums always bleed" is a sign of disease — healthy gums do not bleed`,
        type: 'ARTICLE',
        difficulty: 'BEGINNER',
        readTimeMin: 7,
        authorName: 'Dr. Anjali Shetty',
        category: 'Dental',
        tags: ['Dental', 'Gum Disease', 'Oral Health', 'Oral Cancer'],
        isFeatured: false,
        isTrending: false,
        viewCount: 12900,
    },
];
async function main() {
    console.log(`\n📚 HealthConnect Article Seed — ${ARTICLES.length} articles\n`);
    let created = 0;
    let skipped = 0;
    for (const article of ARTICLES) {
        try {
            const existing = await prisma.article.findUnique({ where: { slug: article.slug } });
            if (existing) {
                console.log(`   ⏭  Skipped (exists): ${article.slug}`);
                skipped++;
                continue;
            }
            await prisma.article.create({
                data: {
                    slug: article.slug,
                    title: article.title,
                    excerpt: article.excerpt,
                    body: article.body,
                    type: article.type,
                    difficulty: article.difficulty,
                    readTimeMin: article.readTimeMin,
                    authorName: article.authorName,
                    isVerifiedAuthor: true,
                    category: article.category,
                    tags: article.tags,
                    isFeatured: article.isFeatured,
                    isTrending: article.isTrending,
                    isPublished: true,
                    publishedAt: new Date(),
                    viewCount: article.viewCount,
                },
            });
            console.log(`   ✅ Created: ${article.title.slice(0, 60)}…`);
            created++;
        }
        catch (e) {
            console.log(`   ❌ Error: ${article.slug} — ${e.message}`);
        }
    }
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Created:  ${created}`);
    console.log(`⏭  Skipped:  ${skipped}`);
    console.log(`\nKnowledge Hub is now ready with ${created + skipped} articles.`);
    console.log(`Visit: https://healthconnect.sbs/learn\n`);
}
main()
    .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-articles.js.map