# Feature modules

HealthConnect is migrating incrementally from global technical-layer folders (`controllers/`, `services/`, `routes/`, `validators/`) toward feature-oriented modules.

## Rules

- Preserve all existing public API URLs and response contracts during moves.
- Do not change business logic in structural-refactor commits.
- Keep cross-cutting infrastructure (`middleware/`, `config/`, `lib/`, `utils/`) outside feature modules.
- Keep Prisma schema and existing migration history under `prisma/` unchanged.
- Move one feature at a time and keep compatibility exports while legacy import paths still exist.
- Build the API and run smoke tests after every feature move.

## Planned modules

- auth
- patient
- health-score
- doctor
- appointments
- hospitals
- communities
- notifications
- subscriptions
- articles
- admin

This directory is introduced as an architectural boundary first; implementation files will move incrementally only after dependency review.
