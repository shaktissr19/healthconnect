// Canonical Patient service facade.
// Keep controllers dependent on this single public surface while implementations
// stay isolated by patient sub-domain.
export * from './services/dashboard.service';
export * from './services/profile.service';
export * from './services/medical-history.service';
export * from './services/symptoms.service';
export * from './services/vitals.service';
export * from './services/medications.service';
export * from './services/reports.service';
export * from './services/access-settings.service';
export * from './services/health-score.bridge.service';
