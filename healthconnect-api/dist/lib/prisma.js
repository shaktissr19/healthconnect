"use strict";
// src/lib/prisma.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single shared PrismaClient instance for the entire application.
//
// WHY: Every `new PrismaClient()` opens its own connection pool.
// With 9+ files each creating an instance under PM2, the app exhausts
// PostgreSQL's default 100-connection limit under normal load.
//
// HOW TO USE IN YOUR FILES:
//   import { prisma } from '../lib/prisma';   (adjust relative path as needed)
//
// MIGRATION: Remove `const prisma = new PrismaClient()` from every file
// that has it and replace with the import above. Files affected:
//   - src/controllers/admin.controller.ts
//   - src/controllers/community.controller.ts
//   - src/controllers/platform.controller.ts
//   - src/controllers/subscription.controller.ts
//   - src/controllers/hospital.controller.ts
//   - src/controllers/notification.controller.ts
//   - src/controllers/doctor.records.controller.ts
//   - src/services/auth.service.ts
//   - src/services/patient.service.ts
//   - src/services/healthScore.service.ts
//   - src/middleware/consent.ts
//   - src/middleware/subscription.ts
//   - src/routes/doctor.routes.ts
//   - src/routes/public.routes.ts
//   - src/utils/registrationId.ts
//   - src/index.ts  (used only for startup ping)
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
// In development, store on globalThis so hot-reloads don't create new instances
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map