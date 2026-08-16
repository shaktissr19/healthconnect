# Patient module

This module owns the Patient HTTP boundary while the larger legacy patient service is migrated incrementally.

## Current structure

- `routes.ts` — canonical Patient route definitions. Public URLs and middleware order are unchanged.
- `controller.ts` — canonical Patient HTTP handlers.
- `validator.ts` — canonical Patient Zod schemas.
- `service.ts` — compatibility boundary to the existing patient service while that large service is split safely in later refactor steps.

Legacy paths under `src/routes/patient.routes.ts`, `src/controllers/patient.controller.ts`, and `src/validators/patient.validator.ts` remain as compatibility exports so existing imports continue to work.

This refactor must not change Patient API URLs, request/response contracts, authorization, upload limits, database behavior, or Health Score behavior.
