# Health Score module boundary

HC-HSI 2.0 is frozen functionally. During project restructuring, Health Score is the first feature used to establish the module pattern because its behavior is already validated.

For the first structural stage this module exposes compatibility exports only. Existing controllers/services remain in their current locations until their import graph has been fully audited and the API build has been validated.

No Health Score algorithm, endpoint, database schema, migration, request payload, or response contract should change as part of this refactor.
