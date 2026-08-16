# Health Score module

HC-HSI 2.0 is functionally frozen. This module now owns the canonical Health Score controller and service boundary.

## Structure

- `controller.ts` — HTTP handlers for current score, refresh, history, and health-assessment inputs.
- `service.ts` — canonical public service exports.
- `engine/healthScore.v2_1.service.ts` — validated HC-HSI 2.0 base engine.
- `engine/healthScore.v2_2.service.ts` — finalized normalization/current-score layer.
- `lib/prisma.ts` — local compatibility adapter to the shared Prisma singleton; it exists only to preserve the frozen engine source byte-for-byte during relocation.

Legacy import paths under `src/controllers/healthScore.controller.ts` and `src/services/healthScore*.service.ts` remain as compatibility re-exports so existing routes and Patient code keep the same behavior while the rest of the backend is migrated incrementally.

No Health Score algorithm, endpoint, database schema, migration, request payload, or response contract is changed by this refactor.
