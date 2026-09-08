import { prisma } from '../lib/prisma';
import { runAppointmentReminders } from '../services/appointmentReminder.service';

async function main() {
  const result = await runAppointmentReminders();
  console.log(JSON.stringify(result));
  if (result.failures > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
