# Patient module

This module is the canonical home for Patient HTTP and service behavior.

## Structure

- `routes.ts` — Patient route definitions. Public URLs and middleware order are unchanged.
- `controller.ts` — Patient HTTP handlers.
- `validator.ts` — Patient Zod schemas.
- `service.ts` — stable service facade used by controllers and compatibility imports.
- `services/_shared.ts` — shared Prisma client and authenticated PatientProfile resolver.
- `services/dashboard.service.ts` — dashboard summary and deterministic insight data.
- `services/profile.service.ts` — patient profile and emergency contacts.
- `services/medical-history.service.ts` — conditions, allergies, surgeries, vaccinations, family and hospitalization history.
- `services/symptoms.service.ts` — symptom tracking and trends.
- `services/vitals.service.ts` — vital history, latest readings and logging.
- `services/medications.service.ts` — medications, adherence logs and therapies.
- `services/reports.service.ts` — reports vault, local storage and sharing.
- `services/access-settings.service.ts` — doctor consents and patient settings.
- `services/health-score.bridge.service.ts` — backward-compatible Patient-service Health Score exports; canonical Health Score HTTP behavior remains in the dedicated `health-score` module.

Legacy paths under `src/routes/patient.routes.ts`, `src/controllers/patient.controller.ts`, `src/validators/patient.validator.ts`, and `src/services/patient.service.ts` remain thin compatibility exports so existing imports continue to work.

## Refactor invariant

Patient API URLs, request/response contracts, authorization, upload limits, database behavior and Health Score behavior must not change as part of project-structure cleanup.
