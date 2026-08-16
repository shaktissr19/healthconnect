# HealthConnect India Health Status Index — HC-HSI-2.0

## Purpose
HC-HSI is a decision-support wellness/health-status index, not a diagnosis, mortality predictor, insurance risk score, or substitute for clinician assessment. Acute safety alerts are separate from the composite score.

## Core assessment eligibility
A numeric Health Score is produced only when all 10 core areas are explicitly complete:
1. Date of birth / age
2. Sex
3. Recent blood pressure
4. Height + recent weight (BMI)
5. Tobacco status
6. Weekly physical activity (zero is valid)
7. Average sleep duration
8. Explicit known-condition declaration (`NONE` or `KNOWN` with matching records)
9. Explicit medication declaration (`NONE` or `TAKING_PRESCRIBED` with matching records)
10. Explicit family-history declaration (`NONE` or `RECORDED` with matching records)

Missing core data => `INCOMPLETE_ASSESSMENT`; no numeric score is shown.

## Domain weights
- Cardiovascular Health — 20%
- Metabolic & Body Health — 20%
- Lifestyle Health — 20%
- Sleep & Recovery — 10%
- Known Condition Control — 15%
- Treatment & Care — 10%
- Symptoms & Function — 5%

N/A domains are removed from the denominator. Missing data never receives healthy points.

## Cardiovascular
### Blood pressure (75% of domain)
Uses recent average, up to 7 readings in 30 days; a single reading is provisional and low-confidence.
- >=180 systolic or >=110 diastolic: 10
- >=160 or >=100: 35
- >=140 or >=90: 60
- >=130 or >=85: 85
- <90 or <60: 70
- otherwise: 100

Rationale: WHO/WHO India define hypertension at >=140/90 on two different days. Readings below that threshold may still carry risk, so the 130/85 band is scored below optimal without labelling a single reading as hypertension.

### Lipids (25%, optional/conditional)
Structured subtype required. Generic `cholesterol` is not scored.
- LDL: <100=100; 100-129=85; 130-159=65; 160-189=40; >=190=15
- HDL: >=60=100; 40-59=75; <40=45
- Triglycerides: <150=100; 150-199=80; 200-499=50; >=500=20
- Total cholesterol: <200=90; 200-239=70; >=240=45

Heart rate and SpO2 are safety/alert signals, not arbitrary long-term score points.

## Metabolic & Body Health
### BMI (50% of domain; core)
- <18.5: 60
- 18.5-22.9: 100
- 23.0-24.9: 85
- 25.0-27.4: 70
- 27.5-29.9: 55
- 30.0-34.9: 40
- >=35: 25

Uses South-Asian public-health action points for risk interpretation while explicitly presenting BMI as a screening measure.

### Glucose/HbA1c (35%; conditional)
Interpretation depends on measurement context and whether diabetes is already diagnosed.
- HbA1c, no known diabetes: <5.7=100; 5.7-6.4=75; >=6.5=40
- HbA1c, known diabetes: <7=90; 7.0-7.9=70; 8.0-9.9=45; >=10=20; individual clinician targets may differ
- Fasting glucose: 70-99=100; 100-125=75; 126-199=45; >=200=20; <70=25
- Post-meal: <140=100; 140-199=75; >=200=40
- Unknown/random context: <140=90; 140-199=65; >=200=40

### Waist circumference (15%; optional)
Current South-Asian risk thresholds:
- Male: <90cm=100; 90-99.9=70; >=100=45
- Female: <80cm=100; 80-89.9=70; >=90=45

## Lifestyle Health
### Tobacco (50%; core)
- Never: 100
- Former: 80
- Second-hand exposure: 65
- Current: 20

The UI must capture Indian smoked and smokeless forms (cigarette, bidi, hookah, gutkha, khaini, zarda, etc.). Product type does not change the v2 score yet; any current tobacco use is treated as current exposure.

### Physical activity (35%; core)
Equivalent minutes = moderate + 2 × vigorous.
- >=300: 100
- 150-299: 85
- 75-149: 60
- 1-74: 40
- 0: 20

### Diet proxy (15%; optional)
Fruit/vegetable servings/day only until a fuller India-adapted dietary module exists:
- >=5: 100
- 3-4.9: 75
- 1-2.9: 50
- <1: 30

Alcohol is captured as context but is not scored until quantity/frequency can be measured responsibly.

## Sleep & Recovery
Average nightly sleep (core):
- 7-9h: 100
- 6-6.9h or >9-10h: 75
- 5-5.9h or >10-11h: 50
- <5h or >11h: 25

## Known Condition Control
- `NONE` + no recorded conditions => N/A, never 100 bonus points.
- `KNOWN` requires matching recorded conditions.
- No generic score is assigned merely because a condition is `ACTIVE` or `CHRONIC`.
- Hypertension control uses BP.
- Diabetes control uses glucose/HbA1c.
- Obesity control currently uses BMI.
- Other conditions remain `ESTABLISHING` until disease-specific structured control measures are implemented.

## Treatment & Care
- No regular medication + no active medication record => N/A.
- Declaration/record mismatch => unscored data-quality issue.
- Starting medication tracking creates a tracking-start timestamp.
- First 7 days => `ESTABLISHING`, no adherence score.
- Thereafter: taken scheduled doses / expected scheduled doses, maximum 30-day window.
- PRN/custom regimens are not automatically treated as missed doses.

## Symptoms & Function
Optional. No logs => N/A, never 100.
When data exists, score uses recent severity, unresolved burden and frequency. Severe unresolved symptoms trigger an alert.

## Age and family history
Age and family history do not subtract points from current health. They modify screening/risk context.
- Age 30+ with no current glucose/HbA1c => India NCD screening care gap.
- BMI >=23 with no glucose/HbA1c => metabolic screening care gap.
- First-degree family history of diabetes with no glucose/HbA1c => screening care gap.
- Age 40+, current tobacco, premature first-degree CVD history, or known CVD/CKD with no structured lipids => lipid assessment recommendation.
- Premature family CVD currently means onset <55 in a male first-degree relative or <65 in a female first-degree relative.

## Family history
First-degree family history is parsed from structured `family_history`: relationship, condition, and age of onset. Relevant flags include diabetes, hypertension, cardiovascular disease, stroke, kidney disease, and premature cardiovascular disease.

## Confidence
Confidence is separate from score and incorporates measurement freshness, repeated BP evidence, domain data confidence, core-assessment completeness, and conditional screening gaps. A conditional core screening gap caps confidence at 75%.

## Acute alerts
Acute alerts are never averaged away by a favorable overall score. Current v2 alerts include very high BP, low SpO2, extreme resting heart rate, severe unresolved symptoms, low glucose, and very high HbA1c.

## India/global design basis
- WHO hypertension diagnostic threshold and repeat-measurement principle
- WHO HEARTS risk-based primary-care approach
- WHO physical-activity recommendations
- AHA Life’s Essential 8 domains as a cardiovascular-health reference construct
- India NP-NCD population-based screening emphasis for age 30+
- WHO Asian-population BMI public-health action points
- India-specific tobacco exposure including smokeless products

## Versioning
Every persisted snapshot stores `HC-HSI-2.0`. Historical snapshots from HC-HSI-1.0 remain preserved and are not silently recalculated under the new algorithm.
