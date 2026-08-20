import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_HOSPITALS: Record<string, string[]> = {
  'aiims.delhi@demo.hc': [
    '24×7 Emergency','Trauma Centre','ICU','CCU','MRI','CT Scan','X-Ray','Ultrasound',
    'Pathology Lab','Dialysis','Operation Theatre','Blood Bank','24×7 Pharmacy','Ambulance',
    'Wheelchair Access','Online Appointment Booking','Digital Reports','Patient Portal',
  ],
  'fortis.mumbai@demo.hc': [
    '24×7 Emergency','ICU','CCU','MRI','CT Scan','X-Ray','Ultrasound','ECG','Echocardiography',
    'Pathology Lab','Physiotherapy','Operation Theatre','Private Rooms','Blood Bank','24×7 Pharmacy',
    'Ambulance','Parking','Patient Helpdesk','Wheelchair Access','Online Appointment Booking','Digital Reports',
  ],
  'narayana.blr@demo.hc': [
    '24×7 Emergency','ICU','CCU','PICU','MRI','CT Scan','X-Ray','Ultrasound','ECG','Echocardiography',
    'Pathology Lab','Operation Theatre','General Ward','Private Rooms','Blood Bank','24×7 Pharmacy',
    'Ambulance','Patient Helpdesk','Wheelchair Access','Online Appointment Booking','Digital Reports',
  ],
  'apollo.chennai@demo.hc': [
    '24×7 Emergency','Trauma Centre','ICU','CCU','NICU','MRI','CT Scan','X-Ray','Ultrasound',
    'Pathology Lab','Dialysis','Chemotherapy','Physiotherapy','Operation Theatre','Private Rooms',
    'Blood Bank','24×7 Pharmacy','Ambulance','Parking','Patient Helpdesk','Wheelchair Access',
    'Online Appointment Booking','Teleconsultation','Digital Reports','Patient Portal',
  ],
};

const DEFAULT_OPD = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDuration: 30, isActive: true },
];

async function main() {
  console.log('\nHealthConnect — demo Hospital readiness (IDEMPOTENT)\n');

  for (const [email, expectedFacilities] of Object.entries(DEMO_HOSPITALS)) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { hospitalProfile: true },
    });

    const hospital = user?.hospitalProfile;
    if (!hospital) {
      console.log(`SKIP ${email}: hospital profile not found`);
      continue;
    }

    const mergedFacilities = Array.from(new Set([...(hospital.facilities ?? []), ...expectedFacilities]));
    if (mergedFacilities.length !== (hospital.facilities ?? []).length) {
      await prisma.hospitalProfile.update({
        where: { id: hospital.id },
        data: { facilities: mergedFacilities },
      });
      console.log(`FACILITIES ${hospital.name}: ${mergedFacilities.length} published`);
    } else {
      console.log(`FACILITIES ${hospital.name}: already ready (${mergedFacilities.length})`);
    }

    const affiliations = await prisma.doctorHospital.findMany({
      where: {
        hospitalId: hospital.id,
        status: 'ACCEPTED',
        doctor: {
          user: { isActive: true },
          OR: [{ verificationStatus: 'VERIFIED' }, { isVerified: true }],
        },
      },
      include: {
        doctor: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });

    for (const affiliation of affiliations) {
      const activeCount = await prisma.hospitalDoctorAvailability.count({
        where: {
          hospitalId: hospital.id,
          doctorId: affiliation.doctorId,
          isActive: true,
        },
      });

      if (activeCount > 0) {
        console.log(`OPD ${hospital.name} / Dr. ${affiliation.doctor.firstName} ${affiliation.doctor.lastName}: already configured`);
        continue;
      }

      await prisma.hospitalDoctorAvailability.createMany({
        data: DEFAULT_OPD.map(row => ({
          ...row,
          hospitalId: hospital.id,
          doctorId: affiliation.doctorId,
        })),
      });

      console.log(`OPD ${hospital.name} / Dr. ${affiliation.doctor.firstName} ${affiliation.doctor.lastName}: Mon/Wed/Fri 09:00–13:00 added`);
    }
  }

  console.log('\nDemo Hospital readiness complete.\n');
}

main()
  .catch(error => {
    console.error('Demo Hospital readiness failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
