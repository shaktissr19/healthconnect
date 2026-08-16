# Legacy backend utilities

This directory contains archived one-off maintenance, seed, and manual SQL utilities from earlier HealthConnect development.

These files are **not part of the API runtime, build, Prisma migration chain, or normal deployment flow**. They are retained only for historical/reference purposes.

Do not run these scripts against production without reviewing their contents and taking an appropriate database backup first. Some legacy seed utilities may overwrite or delete demo data.

Canonical database commands remain the scripts defined in `healthconnect-api/package.json`, including `db:seed`, `db:seed:integrated`, `db:generate`, and `db:deploy`.
