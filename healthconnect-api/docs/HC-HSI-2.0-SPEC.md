# HealthConnect India Health Status Index — HC-HSI-2.0

## Purpose
HC-HSI is a decision-support health-status index. It is not a diagnosis, mortality predictor, insurance risk score, or substitute for clinician assessment. Acute safety alerts are always separate from the composite score.

## Health Score, assessment completion and reliability are different
HC-HSI deliberately separates three concepts:

1. **Current Health Score** — the normalized weighted score of the measurable, applicable health domains available now.
2. **Health assessment completion** — how many of the 10 core context/measurement areas have been completed.
3. **Data reliability (confidence)** — freshness, repeated measurements and source quality of the data actually contributing to the current score.

A numeric Current Health Score is shown whenever at least one applicable health domain has a real measurable score. Missing domains are excluded from the denominator and never receive healthy points.

- `<10/10` core areas with a measurable score => `PROVISIONAL`
- `10/10` core areas => `COMPLETE`
- no measurable scoreable domain => `INSUFFICIENT_DATA`

A provisional score therefore remains useful while being explicitly accompanied by assessment completion on the detailed My Health screen. The Home dashboard shows the current score only; assessment detail belongs in My Health.

## Core assessment completion
The 10 core areas are:
1. Date of birth / age
2. Sex
3. Recent blood pressure
4. Height + recent weight (BMI)
5. Tobacco status
6. Weekly physical activity (zero is a valid answer)
7. Average sleep duration
8. Explicit known-condition declaration (`NONE` or `KNOWN` with matching records)
9. Explicit medication declaration (`NONE` or `TAKING_PRESCRIBED` with matching records)
10. Explicit family-history declaration (`NONE` or `RECORDED` with matching records)

These determine assessment completion, not whether the current measurable domains are allowed to produce a provisional score.

## Domain weights
- Cardiovascular Health — 20%
- Metabolic & Body Health — 20%
- Lifestyle Health — 20%
- Sleep & Recovery — 10%
- Known Condition Control — 15%
- Treatment & Care — 10%
- Symptoms & Function — 5%

N/A domains are removed from the denominator. A person who requires no medication or has no diagnosed chronic condition is not rewarded or penalized for that fact.

## Cardiovascular Health
### Blood pressure (75% of domain)
HC-HSI uses a continuous product score rather than a flat diagnostic table. Systolic and diastolic pressures are scored separately using piecewise-linear anchors and combined 55% systolic / 45% diastolic. The worse number constrains the final result so one favorable value cannot hide the other.

High-scoring HC-HSI reference zone is around 115–120 systolic and 75–80 diastolic. This is a product scoring reference zone, not a claim that guidelines define one exact perfect BP.

Target behavior:
- approximately 115–120 / 75–80 => 95–100
- slightly away from reference => 85–94
- low-normal or mildly elevated => 75–84
- clearly outside preferred range => 60–74
- high / clinically concerning => 45–59
- very abnormal / severe => 30–44

The BP component has a floor of 30. Extreme readings do not need a lower composite score because they generate independent safety alerts.

Clinical caps:
- systolic >=180 or diastolic >=120 => BP score <=30 + critical alert
- systolic >=160 or diastolic >=100 => <=44
- systolic >=140 or diastolic >=90 => <=59
- systolic >=130 or diastolic >=85 => <=74

Low BP is penalized progressively as values move below the reference zone, with a warning when systolic <90 or diastolic <60.

Up to seven readings in the last 30 days are averaged. One reading is provisional (lower reliability); repeated readings on different days increase reliability.

### Lipids (25%, optional/conditional)
A structured subtype is required. Generic `cholesterol` without LDL/HDL/triglyceride/total context is not scored. Scoring is progressive rather than a single flat band. Very high LDL triggers a warning.

Heart rate and SpO2 are safety/context signals, not arbitrary long-term wellness points.

## Metabolic & Body Health
### BMI (50% of domain; core)
BMI is scored progressively. Highest scores are centered in the healthy range, with lower scores for underweight and increasing South-Asian metabolic-risk ranges. South-Asian public-health action points around BMI 23 and 27.5 influence the curve. BMI remains a screening measure, not a diagnosis.

BMI requires:
- height from the Health Assessment form;
- recent weight from Vitals.

### Glucose/HbA1c (35%; conditional)
Interpretation depends on measurement context and whether diabetes is already diagnosed. Fasting, post-meal, random/unspecified glucose and HbA1c have separate progressive curves. Known diabetes uses control-oriented interpretation; a person without known diabetes uses screening-oriented interpretation. Individual clinician targets may differ.

Glucose/HbA1c is entered through Vitals / supported structured results.

### Waist circumference (15%; optional)
Waist circumference is an optional central-adiposity risk marker using South-Asian sex-specific context. It is entered in the Health Assessment form. Missing waist does not directly reduce the Health Score.

## Lifestyle Health
### Tobacco (50%; core)
- Never: highest score
- Former: reduced residual-risk score
- Second-hand exposure: materially reduced score
- Current smoked or smokeless tobacco: major reduction

The patient UI includes Indian tobacco exposure such as cigarette, bidi and smokeless products including gutkha and khaini.

### Physical activity (35%; core)
Activity values are **total minutes per week**, never an arbitrary level such as 1/2/3.

- `moderateActivityMinWeek` = total moderate-intensity minutes in a usual week.
- `vigorousActivityMinWeek` = total vigorous-intensity minutes in a usual week.
- moderate-equivalent minutes = moderate + 2 × vigorous.

Examples:
- brisk walking 30 minutes × 5 days => enter `150` moderate min/week;
- running 25 minutes × 3 days => enter `75` vigorous min/week;
- `2` means literally two minutes in the entire week and therefore receives a near-bottom activity score.

The canonical progressive activity curve is approximately:
- 0 equivalent min/week => 30
- 30 => 40
- 60 => 50
- 90 => 62
- 120 => 76
- 150 => 90
- 225 => 97
- 300+ => 100

This aligns the product score with the WHO adult aerobic-activity recommendation of 150–300 minutes of moderate activity, 75–150 minutes of vigorous activity, or an equivalent combination each week. It is not an all-or-none score.

### Diet proxy (15%; optional)
Fruit/vegetable servings/day is currently a limited proxy. It is intentionally a small component until a fuller India-adapted diet assessment is implemented.

Alcohol is captured as context but is not numerically scored until quantity/frequency can be measured responsibly.

## Sleep & Recovery
Average nightly sleep is a core input and uses a progressive curve centered around the commonly recommended adult range. Both short and very long sleep reduce the component; individual clinical circumstances may differ. Sleep is entered in the Health Assessment form.

## Known Condition Control
HC-HSI never assigns a generic score simply because a diagnosis is `ACTIVE` or `CHRONIC`.

Supported disease-specific control currently includes:
- Hypertension -> BP component
- Diabetes -> glucose/HbA1c component
- Obesity -> BMI component

For any other condition (for example rheumatoid arthritis, epilepsy, inflammatory bowel disease, a rare disorder):
- the condition remains visible in medical/risk context;
- no invented control score is assigned;
- treatment adherence is assessed independently when medication applies;
- symptoms/function are assessed independently when tracked;
- the API returns an assessment limitation naming unsupported conditions;
- reliability is capped when an important recorded condition cannot yet be disease-specifically scored.

This prevents a serious unsupported disease from silently receiving a generic 60/70 or disappearing from the explanation.

## Treatment & Care
- No regular medication + no active medication record => N/A, neither 0 nor 100.
- Declaration/record mismatch => unscored data-quality issue.
- Selecting `TAKING_PRESCRIBED` starts medication tracking if not already started.
- First 7 days => `ESTABLISHING`; historical absence of logs is never treated as 0% adherence.
- Thereafter expected scheduled doses vs logged taken doses are scored progressively, maximum 30-day window.
- PRN/custom regimens are not automatically converted into missed doses.

A patient can therefore have excellent adherence but poor disease control, or good disease control but poor adherence; these are deliberately separate concepts.

## Symptoms & Function
Optional. No recent symptom logs => N/A, never 100. When data exists, recent severity and unresolved burden are scored. Severe unresolved symptoms trigger an alert.

## Age and family history
Age and family history do not subtract points from current measurable health. They modify risk/screening context.

Family history uses structured first-degree records (relationship, condition, age of onset). Current flags include diabetes, hypertension, cardiovascular disease, stroke, kidney disease, and premature cardiovascular disease.

Examples of contextual rules:
- Age 30+ with no current glucose/HbA1c => Indian NCD-screening care gap
- BMI >=23 with no glucose/HbA1c => metabolic-screening care gap
- First-degree family history of diabetes with no glucose/HbA1c => screening care gap
- Age 40+, current tobacco, premature first-degree CVD history, or known CVD/CKD with no structured lipids => lipid assessment recommendation

Premature family CVD currently means onset <55 in a male first-degree relative or <65 in a female first-degree relative.

## Data reliability (API field: `confidence`)
Data reliability is separate from assessment completion. It represents the quality of the information actually contributing to the current score, including:
- measurement freshness;
- repeated BP evidence;
- domain-specific measurement reliability;
- conditional screening gaps;
- unsupported disease-control limitations.

The patient hero does not show a raw reliability percentage because it is easily confused with assessment completion. Detailed domain views may show data reliability where useful.

A conditional core screening gap caps reliability at 75%. Unsupported disease-specific control caps reliability at 80% until better structured control information is available.

## Data-entry routing in the patient UI
Every health domain must show where its data comes from and provide an update action:
- Cardiovascular => Vitals / structured lipid results
- Metabolic & Body => Health Assessment for height/waist; Vitals for weight/glucose/HbA1c
- Lifestyle => Health Assessment
- Sleep & Recovery => Health Assessment
- Known Condition Control => My Conditions / Medical History
- Treatment & Care => Medications / Treatments
- Symptoms & Function => Symptoms

A passive `Needs data` state without an entry path is not acceptable UX.

## Acute alerts
Acute alerts are never averaged away by a favorable composite score. HC-HSI currently detects severe BP, low SpO2, extreme resting heart rate, severe unresolved symptoms, low glucose, very high glucose/HbA1c and very high LDL where structured data are available.

## India/global design basis
- WHO hypertension threshold/repeat-measurement principle
- WHO HEARTS risk-based primary-care approach
- WHO adult physical-activity recommendations
- AHA Life’s Essential 8 as a cardiovascular-health reference construct
- India NP-NCD population-screening emphasis for age 30+
- WHO Asian-population BMI public-health action points
- India-specific smoked and smokeless tobacco exposure

## Versioning
Every persisted HC-HSI-2.0 snapshot stores the algorithm version. Historical HC-HSI-1.0 snapshots remain preserved and are not silently recalculated under the new algorithm.
