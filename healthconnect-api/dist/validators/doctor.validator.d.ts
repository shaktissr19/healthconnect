import { z } from 'zod';
export declare const doctorSearchSchema: z.ZodObject<{
    specialization: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    pinCode: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    minRating: z.ZodOptional<z.ZodString>;
    maxFee: z.ZodOptional<z.ZodString>;
    available: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    city?: string | undefined;
    pinCode?: string | undefined;
    specialization?: string | undefined;
    language?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    minRating?: string | undefined;
    maxFee?: string | undefined;
    available?: string | undefined;
}, {
    city?: string | undefined;
    pinCode?: string | undefined;
    specialization?: string | undefined;
    language?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    minRating?: string | undefined;
    maxFee?: string | undefined;
    available?: string | undefined;
}>;
export declare const doctorProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    specialization: z.ZodOptional<z.ZodString>;
    subSpecializations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    qualification: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    experienceYears: z.ZodOptional<z.ZodNumber>;
    consultationFee: z.ZodOptional<z.ZodNumber>;
    teleconsultFee: z.ZodOptional<z.ZodNumber>;
    languagesSpoken: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    clinicName: z.ZodOptional<z.ZodString>;
    clinicAddress: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    pinCode: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pinCode?: string | undefined;
    specialization?: string | undefined;
    subSpecializations?: string[] | undefined;
    qualification?: string[] | undefined;
    experienceYears?: number | undefined;
    consultationFee?: number | undefined;
    teleconsultFee?: number | undefined;
    languagesSpoken?: string[] | undefined;
    clinicName?: string | undefined;
    clinicAddress?: string | undefined;
    bio?: string | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pinCode?: string | undefined;
    specialization?: string | undefined;
    subSpecializations?: string[] | undefined;
    qualification?: string[] | undefined;
    experienceYears?: number | undefined;
    consultationFee?: number | undefined;
    teleconsultFee?: number | undefined;
    languagesSpoken?: string[] | undefined;
    clinicName?: string | undefined;
    clinicAddress?: string | undefined;
    bio?: string | undefined;
}>;
export declare const availabilitySlotSchema: z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    startTime: z.ZodString;
    endTime: z.ZodString;
    slotDuration: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration?: number | undefined;
}, {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration?: number | undefined;
}>;
//# sourceMappingURL=doctor.validator.d.ts.map