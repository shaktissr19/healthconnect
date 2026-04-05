export declare const calculateHealthScore: (patientId: string) => Promise<{
    score: number;
    medicationAdherence: number;
    symptomFrequency: number;
    appointmentRegularity: number;
    lifestyleFactors: number;
    calculatedAt: Date;
}>;
//# sourceMappingURL=healthScore.service.d.ts.map