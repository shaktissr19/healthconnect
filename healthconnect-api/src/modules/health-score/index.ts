// Transitional Health Score module boundary.
// Existing import paths remain supported until the implementation is moved.
export * as HealthScoreController from '../../controllers/healthScore.controller';
export {
  HEALTH_SCORE_ALGORITHM_VERSION,
  calculateHealthScore,
  getHealthScore,
  refreshHealthScore,
  getHealthScoreHistory,
} from '../../services/healthScore.service';
