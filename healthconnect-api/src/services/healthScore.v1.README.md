# HealthConnect Health Status Index v1 (HC-HSI-1.0)

## Purpose

HC-HSI-1.0 is a patient-facing health status support score. It is not a diagnosis, emergency triage tool, or validated mortality-risk calculator.

## Domains and weights

- Blood pressure — 15%
- Glucose / metabolic — 12%
- Body composition — 8%
- Blood lipids — 10%
- Medication adherence — 10%
- Chronic condition control — 12%
- Symptoms & warning signals — 10%
- Physical activity — 8%
- Sleep & recovery — 7%
- Nutrition / tobacco / lifestyle — 8%

Weights sum to 100.

## Missing-data rule

Missing data never receives healthy points. Only domains with usable structured data are included in the normalized score. `dataCoverage` reports the total weight of measurable domains and `confidence` also reflects data freshness/completeness. If coverage is below 25%, the overall score is `null` with status `INSUFFICIENT_DATA`.

## Alert rule

Potentially concerning observations are returned separately in `alerts`. Critical alerts are never averaged away by the overall score. The UI explicitly warns patients not to use a favorable overall score to dismiss a critical alert.

## History

`POST /api/v1/patient/health-score/refresh` saves an append-only snapshot in `health_score_snapshots`. Historical values include the algorithm version so future algorithm revisions are auditable and are not silently compared as though the formula were unchanged.

## Lifestyle inputs

`GET/PUT /api/v1/patient/health-score/lifestyle` stores structured inputs in `patient_lifestyle_health`:

- height / optional waist
- moderate activity minutes/week
- vigorous activity minutes/week
- average sleep hours/night
- tobacco exposure
- fruit/vegetable servings/day

## Deployment order

1. Deploy migration with `npx prisma migrate deploy`.
2. Build API with `npm run build`.
3. Restart API.
4. Build/deploy web.
5. Verify authenticated patient endpoints:
   - `GET /patient/health-score`
   - `POST /patient/health-score/refresh`
   - `GET /patient/health-score/history`
   - `GET /patient/health-score/lifestyle`
   - `PUT /patient/health-score/lifestyle`
6. Validate at least one patient with sparse data and one patient with BP/glucose/medication/symptom data before merging to production.

## Compatibility

`healthScore.service.ts` re-exports HC-HSI-1.0 so existing imports, including the Patient dashboard service, continue to work. The canonical response still includes legacy component fields temporarily for backward compatibility, while the Health Overview consumes the new `domains`, `confidence`, `alerts`, `missingData`, and `history` fields.
