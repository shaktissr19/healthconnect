import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import {
  BillingError,
  getCheckoutKeyId,
  getRazorpayClient,
  toDateFromUnix,
  verifyOrderCheckoutSignature,
} from './razorpayBilling.service';

const payableStatuses = new Set(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_PROGRESS']);

const feePaiseForAppointment = (appointment: any): number => {
  const doctor = appointment.doctor;
  let rupees = 0;
  if (appointment.type === 'TELECONSULT') {
    rupees = Number(doctor?.videoConsultFee ?? doctor?.teleconsultFee ?? doctor?.consultationFee ?? 0);
  } else {
    rupees = Number(doctor?.consultationFee ?? 0);
  }
  return Math.max(0, Math.round(rupees * 100));
};

const getPatientProfile = async (userId: string) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) throw new BillingError('PATIENT_PROFILE_NOT_FOUND', 'Patient profile not found.', 404);
  return patient;
};

const getAppointmentForPayment = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, userId: true, firstName: true, lastName: true } },
      doctor: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          specialization: true,
          consultationFee: true,
          teleconsultFee: true,
          videoConsultFee: true,
        },
      },
      hospital: { select: { id: true, name: true } },
    },
  });
  if (!appointment) throw new BillingError('APPOINTMENT_NOT_FOUND', 'Appointment not found.', 404);
  return appointment;
};

export const getPatientAppointmentPayments = async (userId: string) => {
  const patient = await getPatientProfile(userId);
  const appointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialization: true,
          consultationFee: true,
          teleconsultFee: true,
          videoConsultFee: true,
        },
      },
      hospital: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  });

  const ledger = await prisma.$queryRaw<any[]>`
    SELECT
      ap.id,
      ap.appointment_id AS "appointmentId",
      ap.amount_paise AS "amountPaise",
      ap.currency,
      ap.status,
      ap.provider_order_id AS "providerOrderId",
      ap.provider_payment_id AS "providerPaymentId",
      ap.method,
      ap.failure_reason AS "failureReason",
      ap.paid_at AS "paidAt",
      ap.captured_at AS "capturedAt",
      ap.amount_refunded_paise AS "amountRefundedPaise",
      ap.created_at AS "createdAt"
    FROM billing.appointment_payments ap
    WHERE ap.payer_user_id = ${userId}
    ORDER BY ap.created_at DESC
  `;

  const latestByAppointment = new Map<string, any>();
  for (const row of ledger) {
    if (!latestByAppointment.has(row.appointmentId)) latestByAppointment.set(row.appointmentId, row);
  }

  return appointments.map(appointment => {
    const amountPaise = feePaiseForAppointment(appointment);
    const latestPayment = latestByAppointment.get(appointment.id) || null;
    const paid = latestPayment?.status === 'CAPTURED' && Number(latestPayment?.amountRefundedPaise || 0) < Number(latestPayment?.amountPaise || 0);
    return {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt,
      type: appointment.type,
      status: appointment.status,
      reasonForVisit: appointment.reasonForVisit,
      doctor: {
        id: appointment.doctor.id,
        name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specialization: appointment.doctor.specialization,
      },
      hospital: appointment.hospital,
      paymentRequired: amountPaise > 0,
      amountPaise,
      currency: 'INR',
      paid,
      canPay: amountPaise > 0 && payableStatuses.has(appointment.status) && !paid,
      latestPayment,
    };
  });
};

export const createAppointmentCheckout = async (args: { userId: string; appointmentId: string }) => {
  const appointment = await getAppointmentForPayment(args.appointmentId);
  if (appointment.patient.userId !== args.userId) {
    throw new BillingError('PAYMENT_FORBIDDEN', 'You cannot pay for another patient’s appointment.', 403);
  }
  if (!payableStatuses.has(appointment.status)) {
    throw new BillingError('APPOINTMENT_NOT_PAYABLE', `This ${appointment.status.toLowerCase()} appointment cannot accept a new payment.`, 409);
  }

  const amountPaise = feePaiseForAppointment(appointment);
  if (amountPaise <= 0) {
    return {
      paymentRequired: false,
      message: 'No online consultation fee is configured for this appointment.',
      appointmentId: appointment.id,
    };
  }

  const captured = await prisma.$queryRaw<any[]>`
    SELECT id, amount_paise AS "amountPaise", amount_refunded_paise AS "amountRefundedPaise"
    FROM billing.appointment_payments
    WHERE appointment_id = ${appointment.id}
      AND payer_user_id = ${args.userId}
      AND status = 'CAPTURED'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (captured[0] && Number(captured[0].amountRefundedPaise || 0) < Number(captured[0].amountPaise || 0)) {
    throw new BillingError('APPOINTMENT_ALREADY_PAID', 'This appointment has already been paid.', 409);
  }

  const reusable = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      provider_order_id AS "providerOrderId",
      amount_paise AS "amountPaise",
      currency,
      receipt,
      created_at AS "createdAt"
    FROM billing.appointment_payments
    WHERE appointment_id = ${appointment.id}
      AND payer_user_id = ${args.userId}
      AND status = 'CREATED'
      AND created_at > NOW() - INTERVAL '15 minutes'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (reusable[0] && Number(reusable[0].amountPaise) === amountPaise) {
    return {
      paymentRequired: true,
      keyId: getCheckoutKeyId(),
      orderId: reusable[0].providerOrderId,
      localPaymentId: reusable[0].id,
      amountPaise,
      currency: reusable[0].currency || 'INR',
      receipt: reusable[0].receipt,
      appointment: {
        id: appointment.id,
        doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        hospitalName: appointment.hospital?.name || null,
        scheduledAt: appointment.scheduledAt,
      },
      reused: true,
    };
  }

  const razorpay = getRazorpayClient();
  const receipt = `hc_${appointment.id.replace(/-/g, '').slice(0, 12)}_${Date.now().toString().slice(-8)}`;
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: {
      hc_kind: 'APPOINTMENT',
      hc_appointment_id: appointment.id,
      hc_patient_id: appointment.patient.id,
      hc_doctor_id: appointment.doctor.id,
      hc_hospital_id: appointment.hospital?.id || '',
      hc_payer_user_id: args.userId,
    },
  } as any);

  if (!order?.id) {
    throw new BillingError('ORDER_CREATE_FAILED', 'Unable to create the appointment payment order.', 502);
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO billing.appointment_payments (
      id, appointment_id, payer_user_id, amount_paise, currency, status,
      provider_order_id, receipt, updated_at
    ) VALUES (
      ${id}, ${appointment.id}, ${args.userId}, ${amountPaise}, 'INR', 'CREATED',
      ${order.id}, ${receipt}, CURRENT_TIMESTAMP
    )
  `;

  return {
    paymentRequired: true,
    keyId: getCheckoutKeyId(),
    orderId: order.id,
    localPaymentId: id,
    amountPaise,
    currency: 'INR',
    receipt,
    appointment: {
      id: appointment.id,
      doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      hospitalName: appointment.hospital?.name || null,
      scheduledAt: appointment.scheduledAt,
    },
  };
};

export const verifyAppointmentCheckout = async (args: {
  userId: string;
  appointmentId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) => {
  if (!args.orderId || !args.paymentId || !args.signature) {
    throw new BillingError('MISSING_PAYMENT_FIELDS', 'Payment verification details are incomplete.', 422);
  }
  if (!verifyOrderCheckoutSignature(args.orderId, args.paymentId, args.signature)) {
    throw new BillingError('INVALID_PAYMENT_SIGNATURE', 'Payment signature verification failed.', 400);
  }

  const appointment = await getAppointmentForPayment(args.appointmentId);
  if (appointment.patient.userId !== args.userId) {
    throw new BillingError('PAYMENT_FORBIDDEN', 'You cannot verify another patient’s payment.', 403);
  }

  const rows = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM billing.appointment_payments
    WHERE appointment_id = ${appointment.id}
      AND payer_user_id = ${args.userId}
      AND provider_order_id = ${args.orderId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const localPayment = rows[0];
  if (!localPayment) throw new BillingError('PAYMENT_ORDER_NOT_FOUND', 'Payment order not found.', 404);

  const expectedAmountPaise = feePaiseForAppointment(appointment);
  if (Number(localPayment.amount_paise) !== expectedAmountPaise) {
    throw new BillingError('PAYMENT_AMOUNT_MISMATCH', 'The appointment fee changed. Please create a new payment order.', 409);
  }

  const razorpay = getRazorpayClient();
  let providerPayment = await razorpay.payments.fetch(args.paymentId);
  if (!providerPayment?.id || providerPayment.id !== args.paymentId || providerPayment.order_id !== args.orderId) {
    throw new BillingError('PROVIDER_PAYMENT_MISMATCH', 'Razorpay payment does not match this appointment order.', 400);
  }
  if (Number(providerPayment.amount || 0) !== expectedAmountPaise) {
    throw new BillingError('PROVIDER_AMOUNT_MISMATCH', 'Razorpay returned an unexpected payment amount.', 400);
  }

  if (providerPayment.status === 'authorized') {
    providerPayment = await razorpay.payments.capture(args.paymentId, expectedAmountPaise, 'INR');
  }
  if (providerPayment.status !== 'captured') {
    await prisma.$executeRaw`
      UPDATE billing.appointment_payments
      SET status = ${String(providerPayment.status || 'FAILED').toUpperCase()},
          provider_payment_id = ${args.paymentId},
          signature = ${args.signature},
          method = ${providerPayment.method || null},
          failure_reason = ${providerPayment.error_description || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${localPayment.id}
    `;
    throw new BillingError('PAYMENT_NOT_CAPTURED', 'The payment has not been captured. No paid status was granted.', 402);
  }

  const paidAt = toDateFromUnix(providerPayment.created_at) || new Date();
  await prisma.$executeRaw`
    UPDATE billing.appointment_payments
    SET status = 'CAPTURED',
        provider_payment_id = ${args.paymentId},
        signature = ${args.signature},
        method = ${providerPayment.method || null},
        failure_reason = NULL,
        paid_at = ${paidAt},
        captured_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${localPayment.id}
  `;

  await prisma.notification.create({
    data: {
      userId: args.userId,
      type: 'SYSTEM',
      title: 'Appointment payment received',
      body: `₹${(expectedAmountPaise / 100).toLocaleString('en-IN')} received for your consultation with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}.`,
      data: { appointmentId: appointment.id, paymentId: args.paymentId, amountPaise: expectedAmountPaise },
    },
  });

  await prisma.notification.create({
    data: {
      userId: appointment.doctor.userId,
      type: 'SYSTEM',
      title: 'Consultation payment received',
      body: `Payment received for ${appointment.patient.firstName} ${appointment.patient.lastName}'s appointment.`,
      data: { appointmentId: appointment.id, paymentId: args.paymentId, amountPaise: expectedAmountPaise },
    },
  });

  return getAppointmentReceipt(args.userId, appointment.id);
};

export const getAppointmentReceipt = async (userId: string, appointmentId: string) => {
  const appointment = await getAppointmentForPayment(appointmentId);
  if (appointment.patient.userId !== userId) {
    throw new BillingError('RECEIPT_FORBIDDEN', 'You cannot view another patient’s receipt.', 403);
  }
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      amount_paise AS "amountPaise",
      currency,
      status,
      provider_order_id AS "providerOrderId",
      provider_payment_id AS "providerPaymentId",
      method,
      paid_at AS "paidAt",
      amount_refunded_paise AS "amountRefundedPaise",
      receipt
    FROM billing.appointment_payments
    WHERE appointment_id = ${appointmentId}
      AND payer_user_id = ${userId}
      AND status IN ('CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED')
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const payment = rows[0];
  if (!payment) throw new BillingError('RECEIPT_NOT_FOUND', 'No completed payment was found for this appointment.', 404);

  return {
    receiptNumber: `HC-APPT-${payment.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
    payment,
    appointment: {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt,
      type: appointment.type,
      status: appointment.status,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      doctorName: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      specialization: appointment.doctor.specialization,
      hospitalName: appointment.hospital?.name || null,
    },
    issuedBy: 'HealthConnect India',
  };
};

export const getDoctorPaymentSummary = async (userId: string) => {
  const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) throw new BillingError('DOCTOR_PROFILE_NOT_FOUND', 'Doctor profile not found.', 404);

  const totals = await prisma.$queryRaw<any[]>`
    SELECT
      COALESCE(SUM(ap.amount_paise - ap.amount_refunded_paise) FILTER (WHERE ap.status IN ('CAPTURED','PARTIALLY_REFUNDED')), 0)::bigint AS "totalPaise",
      COALESCE(SUM(ap.amount_paise - ap.amount_refunded_paise) FILTER (
        WHERE ap.status IN ('CAPTURED','PARTIALLY_REFUNDED')
          AND ap.captured_at >= date_trunc('month', CURRENT_TIMESTAMP)
      ), 0)::bigint AS "monthPaise",
      COUNT(*) FILTER (WHERE ap.status IN ('CAPTURED','PARTIALLY_REFUNDED'))::int AS "paidConsultations"
    FROM billing.appointment_payments ap
    JOIN public.appointments a ON a.id = ap.appointment_id
    WHERE a."doctorId" = ${doctor.id}
  `;

  const recent = await prisma.$queryRaw<any[]>`
    SELECT
      ap.id,
      ap.appointment_id AS "appointmentId",
      ap.amount_paise AS "amountPaise",
      ap.amount_refunded_paise AS "amountRefundedPaise",
      ap.currency,
      ap.status,
      ap.paid_at AS "paidAt",
      pp."firstName" || ' ' || pp."lastName" AS "patientName",
      hp.name AS "hospitalName",
      a."scheduledAt"
    FROM billing.appointment_payments ap
    JOIN public.appointments a ON a.id = ap.appointment_id
    JOIN public.patient_profiles pp ON pp.id = a."patientId"
    LEFT JOIN public.hospital_profiles hp ON hp.id = a."hospitalId"
    WHERE a."doctorId" = ${doctor.id}
      AND ap.status IN ('CAPTURED','PARTIALLY_REFUNDED','REFUNDED')
    ORDER BY ap.created_at DESC
    LIMIT 10
  `;

  return {
    totalPaise: Number(totals[0]?.totalPaise || 0),
    monthPaise: Number(totals[0]?.monthPaise || 0),
    paidConsultations: Number(totals[0]?.paidConsultations || 0),
    recent,
  };
};

export const syncAppointmentPaymentFromProvider = async (paymentEntity: any) => {
  if (!paymentEntity?.id) return false;
  const orderId = paymentEntity.order_id || null;
  const paymentId = paymentEntity.id;

  const rows = await prisma.$queryRaw<any[]>`
    SELECT id, amount_paise AS "amountPaise"
    FROM billing.appointment_payments
    WHERE provider_payment_id = ${paymentId}
       OR (${orderId}::text IS NOT NULL AND provider_order_id = ${orderId})
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return false;

  const status = String(paymentEntity.status || 'FAILED').toUpperCase();
  const paidAt = status === 'CAPTURED' ? toDateFromUnix(paymentEntity.created_at) || new Date() : null;
  await prisma.$executeRaw`
    UPDATE billing.appointment_payments
    SET provider_payment_id = ${paymentId},
        status = ${status},
        method = ${paymentEntity.method || null},
        failure_reason = ${paymentEntity.error_description || null},
        paid_at = COALESCE(${paidAt}, paid_at),
        captured_at = CASE WHEN ${status} = 'CAPTURED' THEN COALESCE(captured_at, CURRENT_TIMESTAMP) ELSE captured_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${row.id}
  `;
  return true;
};
