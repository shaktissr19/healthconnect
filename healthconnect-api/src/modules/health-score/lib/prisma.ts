// Compatibility adapter for the frozen HC-HSI engine during module relocation.
// The engine keeps its historical relative import while the shared Prisma
// singleton remains owned by src/lib/prisma.ts.
export { prisma } from '../../../lib/prisma';
