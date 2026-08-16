# External integrations

This area is reserved for adapters to external systems such as email, SMS, payments, object/file storage, and video-consultation providers.

Integration code should expose a small application-facing interface and keep provider-specific SDK/configuration details out of feature business logic.

Existing integrations will move here incrementally only after their callers are audited. No runtime imports are changed by introducing this directory.
