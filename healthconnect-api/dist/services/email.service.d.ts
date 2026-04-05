export declare function sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void>;
export declare function sendVerificationEmail(email: string, firstName: string, verifyToken: string): Promise<void>;
export declare function sendReviewPromptEmail(patientEmail: string, patientFirstName: string, doctorName: string, doctorId: string, appointmentDate: string): Promise<void>;
export declare function sendWelcomeEmail(email: string, firstName: string, role: string): Promise<void>;
export declare function sendAppointmentConfirmationEmail(patientEmail: string, patientFirstName: string, doctorName: string, appointmentDate: string, // e.g. "25 March 2026"
appointmentTime: string, // e.g. "10:30 AM"
appointmentType: string, // IN_PERSON | TELECONSULT | HOME_VISIT
meetingLink?: string, // only for TELECONSULT
clinicName?: string, // for IN_PERSON
clinicCity?: string): Promise<void>;
export declare function sendDoctorVerificationEmail(doctorEmail: string, doctorFirstName: string, action: 'approve' | 'reject', reason?: string): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map