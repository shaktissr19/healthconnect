"use strict";
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
const hospitalController = __importStar(require("../controllers/hospital.controller"));
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
// Public routes (hospital discovery)
router.get('/', hospitalController.searchHospitals);
router.get('/featured', hospitalController.getFeaturedHospitals);
router.get('/nearest', hospitalController.getNearestHospitals);
router.get('/:id', hospitalController.getHospitalProfile);
router.get('/:id/doctors', hospitalController.getHospitalDoctors);
router.get('/:id/departments', hospitalController.getHospitalDepartments);
// Protected routes (hospital dashboard)
router.use(auth_1.authenticate);
router.use(roleGuard_1.requireHospital);
router.get('/profile/me', hospitalController.getMyProfile);
router.put('/profile/me', hospitalController.updateMyProfile);
router.get('/doctors', hospitalController.getMyDoctors);
router.post('/doctors/invite', hospitalController.inviteDoctor);
router.delete('/doctors/:doctorId', hospitalController.removeDoctor);
exports.default = router;
//# sourceMappingURL=hospital.routes.js.map