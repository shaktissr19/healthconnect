"use strict";
// src/routes/admin.routes.ts
// Fixed: route ordering — specific paths before parameterised ones.
// Previously /doctors/pending and /communities/requests were shadowed by
// /:id params registered before them.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Admin = __importStar(require("../controllers/admin.controller"));
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
const admin = [auth_1.authenticate, (0, roleGuard_1.requireRole)('ADMIN')];
// Dashboard
router.get('/stats', ...admin, Admin.getDashboardStats);
// User management
router.get('/users', ...admin, Admin.getAllUsers);
router.get('/users/:id', ...admin, Admin.getUserById);
router.patch('/users/:id/toggle', ...admin, Admin.toggleUserStatus);
router.delete('/users/:id', ...admin, Admin.deleteUser);
// ── FIX: /doctors/pending MUST come before /doctors/:id ──────────────────────
// Express matches routes top-to-bottom; if /:id is first, "pending" is treated
// as an ID value and the wrong handler fires.
router.get('/doctors/pending', ...admin, Admin.getPendingDoctors);
router.get('/doctors', ...admin, Admin.getAllDoctors);
router.get('/doctors/:id', ...admin, Admin.getUserById);
router.post('/doctors/:id/verify', ...admin, Admin.verifyDoctor);
// Subscriptions & revenue
router.get('/subscriptions', ...admin, Admin.getSubscriptionStats);
// ── FIX: community sub-routes before /:id ────────────────────────────────────
// /communities/requests was previously shadowed by /:id/qa-sessions
// Specific named sub-paths first
router.get('/communities/requests', ...admin, Admin.getCommunityRequests);
router.post('/communities/requests/:id/approve', ...admin, Admin.approveCommunityRequest);
router.post('/communities/requests/:id/reject', ...admin, Admin.rejectCommunityRequest);
// Collection + create
router.get('/communities', ...admin, Admin.getCommunityStats);
router.post('/communities', ...admin, Admin.createCommunity);
// Parameterised community routes
router.patch('/communities/:id/toggle', ...admin, Admin.toggleCommunityStatus);
router.patch('/communities/:id/feature', ...admin, Admin.toggleCommunityFeatured);
router.put('/communities/:id', ...admin, Admin.updateCommunity);
router.delete('/communities/:id', ...admin, Admin.deleteCommunity);
router.get('/communities/:id/qa-sessions', ...admin, Admin.getQASessions);
router.post('/communities/:id/qa-sessions', ...admin, Admin.createQASession);
router.delete('/communities/qa-sessions/:sessionId', ...admin, Admin.deleteQASession);
// Appointments
router.get('/appointments', ...admin, Admin.getAppointmentStats);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map