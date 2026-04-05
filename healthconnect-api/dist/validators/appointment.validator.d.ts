import { z } from 'zod';
export declare const bookAppointmentSchema: z.ZodObject<{
    doctorId: z.ZodString;
    hospitalId: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodString;
    type: z.ZodEnum<["IN_PERSON", "TELECONSULT", "HOME_VISIT"]>;
    reasonForVisit: z.ZodOptional<z.ZodString>;
    symptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "IN_PERSON" | "TELECONSULT" | "HOME_VISIT";
    doctorId: string;
    scheduledAt: string;
    symptoms?: string[] | undefined;
    hospitalId?: string | undefined;
    durationMinutes?: number | undefined;
    reasonForVisit?: string | undefined;
}, {
    type: "IN_PERSON" | "TELECONSULT" | "HOME_VISIT";
    doctorId: string;
    scheduledAt: string;
    symptoms?: string[] | undefined;
    hospitalId?: string | undefined;
    durationMinutes?: number | undefined;
    reasonForVisit?: string | undefined;
}>;
export declare const rescheduleAppointmentSchema: z.ZodObject<{
    scheduledAt: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scheduledAt: string;
    reason?: string | undefined;
}, {
    scheduledAt: string;
    reason?: string | undefined;
}>;
export declare const cancelAppointmentSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
    cancellationReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cancellationReason?: string | undefined;
    reason?: string | undefined;
}, {
    cancellationReason?: string | undefined;
    reason?: string | undefined;
}>;
export declare const updateAppointmentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED", "PENDING"]>;
    doctorNotes: z.ZodOptional<z.ZodString>;
    followUpDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "CANCELLED" | "CONFIRMED" | "COMPLETED" | "NO_SHOW";
    doctorNotes?: string | undefined;
    followUpDate?: string | undefined;
}, {
    status: "PENDING" | "CANCELLED" | "CONFIRMED" | "COMPLETED" | "NO_SHOW";
    doctorNotes?: string | undefined;
    followUpDate?: string | undefined;
}>;
//# sourceMappingURL=appointment.validator.d.ts.map