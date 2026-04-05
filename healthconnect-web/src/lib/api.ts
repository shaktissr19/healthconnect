// src/lib/api.ts — Axios Instance + Interceptors
// ─────────────────────────────────────────────────────────────────────────────
// MERGED: Original file structure preserved + all fixes applied
// FIXED:
//   1. Token read from cookie only — never from localStorage
//   2. 401 handler: redirects when authenticated session expires mid-use
//   3. /doctors → /public/doctors (correct backend path)
//   4. /doctors/featured → /public/doctors?limit=6&sort=rating
//   5. /patient/appointments → /appointments
//   6. /doctor/availability → /doctor/profile/availability
//   7. Removed non-existent endpoints:
//      getVitalTrend, markTaken, getAdherence, getMyCommunities,
//      triggerSOS, getNextAppointment
//   8. Duplicate emergency contact methods removed from doctorAPI
//   9. Community reaction/comment paths fixed to correct backend paths
//  10. Added: authAPI.forgotPassword, resetPassword, verifyEmail, resendVerification
//  11. Added: doctorAPI full dashboard/patient/records methods
//  12. Added: appointmentAPI.list, get, updateStatus
//  13. Added: communityAPI.getBySlug, updatePost, removeReaction, getComments, deleteComment
//  14. Added: articleAPI.getAll, getFeatured, getBySlug
//  15. Added: notificationAPI.delete
//  16. Added: publicAPI export for unauthenticated calls
//  17. Restored: publicAPI.getTestimonials
//  18. Added: patientAPI.updateAllergy, updateSymptom, deleteVaccination, deleteFamilyHistory
//  19. logDose path fixed: /medications/:id/logs → /medications/:id/log
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.healthconnect.sbs/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Attach JWT on every request — reads from cookie only ──────────────────
api.interceptors.request.use(cfg => {
  const token = Cookies.get('hc_token');
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Handle 401 globally ───────────────────────────────────────────────────
// Redirect to home only when a previously-authenticated session has expired.
// Never redirects unauthenticated visitors making public API calls.
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      const { useAuthStore } = await import('@/store/authStore');
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        // Session expired mid-use — clear credentials and redirect to sign in
        Cookies.remove('hc_token');
        if (typeof window !== 'undefined') {
          const p = window.location.pathname;
          if (
            p.startsWith('/dashboard') ||
            p.startsWith('/doctor-dashboard') ||
            p.startsWith('/admin-dashboard')
          ) {
            window.location.href = '/';
          }
        }
      }
    }
    return Promise.reject(err);
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register:           (data: Any)                                 => api.post('/auth/register', data),
  login:              (data: Any)                                 => api.post('/auth/login', data),
  logout:             ()                                          => api.post('/auth/logout'),
  me:                 ()                                          => api.get('/auth/me'),
  refreshToken:       (data: Any)                                 => api.post('/auth/refresh', data),
  // Password reset flow
  forgotPassword:     (data: { email: string })                   => api.post('/auth/forgot-password', data),
  resetPassword:      (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  // Email verification
  verifyEmail:        (data: { token: string })                   => api.post('/auth/verify-email', data),
  resendVerification: ()                                          => api.post('/auth/resend-verification'),
};

// ── Patient ───────────────────────────────────────────────────────────────
export const patientAPI = {
  // ── Dashboard ─────────────────────────────────────────────────────────
  dashboard:              ()                    => api.get('/patient/dashboard'),

  // ── Profile ───────────────────────────────────────────────────────────
  getEmergencyContacts:   ()                    => api.get('/patient/profile/emergency-contacts'),
  addEmergencyContact:    (d: Any)              => api.post('/patient/profile/emergency-contacts', d),
  updateEmergencyContact: (id: string, d: Any)  => api.put(`/patient/profile/emergency-contacts/${id}`, d),
  deleteEmergencyContact: (id: string)          => api.delete(`/patient/profile/emergency-contacts/${id}`),
  getProfile:             ()                    => api.get('/patient/profile'),
  updateProfile:          (d: Any)              => api.put('/patient/profile', d),

  // ── Health Score ──────────────────────────────────────────────────────
  getHealthScore:         ()                    => api.get('/patient/health-score'),
  refreshHealthScore:     ()                    => api.post('/patient/health-score/refresh'),
  getHealthScoreHistory:  ()                    => api.get('/patient/health-score'), // alias

  // ── Medical History (single endpoint returns all 6 sub-tables) ────────
  getMedicalHistory:      ()                    => api.get('/patient/medical-history'),

  // ── Conditions ────────────────────────────────────────────────────────
  getConditions:          ()                    => api.get('/patient/conditions'),
  createCondition:        (d: Any)              => api.post('/patient/conditions', d),
  updateCondition:        (id: string, d: Any)  => api.put(`/patient/conditions/${id}`, d),
  deleteCondition:        (id: string)          => api.delete(`/patient/conditions/${id}`),

  // ── Allergies ─────────────────────────────────────────────────────────
  getAllergies:            ()                    => api.get('/patient/allergies'),
  createAllergy:          (d: Any)              => api.post('/patient/allergies', d),
  updateAllergy:          (id: string, d: Any)  => api.put(`/patient/allergies/${id}`, d),
  deleteAllergy:          (id: string)          => api.delete(`/patient/allergies/${id}`),

  // ── Surgeries ─────────────────────────────────────────────────────────
  createSurgery:          (d: Any)              => api.post('/patient/surgeries', d),
  updateSurgery:          (id: string, d: Any)  => api.put(`/patient/surgeries/${id}`, d),
  deleteSurgery:          (id: string)          => api.delete(`/patient/surgeries/${id}`),

  // ── Vaccinations ──────────────────────────────────────────────────────
  createVaccination:      (d: Any)              => api.post('/patient/vaccinations', d),
  updateVaccination:      (id: string, d: Any)  => api.put(`/patient/vaccinations/${id}`, d),
  deleteVaccination:      (id: string)          => api.delete(`/patient/vaccinations/${id}`),

  // ── Family History ────────────────────────────────────────────────────
  createFamilyHistory:    (d: Any)              => api.post('/patient/family-history', d),
  updateFamilyHistory:    (id: string, d: Any)  => api.put(`/patient/family-history/${id}`, d),
  deleteFamilyHistory:    (id: string)          => api.delete(`/patient/family-history/${id}`),

  // ── Hospitalizations ─────────────────────────────────────────────────
  createHospitalization:  (d: Any)              => api.post('/patient/hospitalizations', d),
  updateHospitalization:  (id: string, d: Any)  => api.put(`/patient/hospitalizations/${id}`, d),
  deleteHospitalization:  (id: string)          => api.delete(`/patient/hospitalizations/${id}`),

  // ── Symptoms ──────────────────────────────────────────────────────────
  getSymptoms:            (q?: Any)             => api.get('/patient/symptoms', { params: q }),
  logSymptom:             (d: Any)              => api.post('/patient/symptoms', d),
  createSymptom:          (d: Any)              => api.post('/patient/symptoms', d), // alias
  updateSymptom:          (id: string, d: Any)  => api.put(`/patient/symptoms/${id}`, d),
  deleteSymptom:          (id: string)          => api.delete(`/patient/symptoms/${id}`),

  // ── Vitals ────────────────────────────────────────────────────────────
  getVitals:              (q?: Any)             => api.get('/patient/vitals', { params: q }),
  logVital:               (d: Any)              => api.post('/patient/vitals', d),
  deleteVital:            (id: string)          => api.delete(`/patient/vitals/${id}`),
  // NOTE: getVitalTrend removed — /patient/vitals/:type/trend does not exist in backend

  // ── Medications ───────────────────────────────────────────────────────
  getMedications:         (q?: Any)             => api.get('/patient/medications', { params: q }),
  addMedication:          (d: Any)              => api.post('/patient/medications', d),
  updateMedication:       (id: string, d: Any)  => api.put(`/patient/medications/${id}`, d),
  deleteMedication:       (id: string)          => api.delete(`/patient/medications/${id}`),
  logDose:                (id: string, d: Any)  => api.post(`/patient/medications/${id}/log`, d),
  getMedicationLogs:      (id: string, q?: Any) => api.get(`/patient/medications/${id}/logs`, { params: q }),
  // NOTE: markTaken and getAdherence removed — endpoints do not exist in backend

  // ── Therapies ─────────────────────────────────────────────────────────
  getTherapies:           ()                    => api.get('/patient/therapies'),
  addTherapy:             (d: Any)              => api.post('/patient/therapies', d),
  deleteTherapy:          (id: string)          => api.delete(`/patient/therapies/${id}`),

  // ── Reports ───────────────────────────────────────────────────────────
  getReports:             (q?: Any)             => api.get('/patient/reports', { params: q }),
  uploadReport:           (d: FormData)         => api.post('/patient/reports', d, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteReport:           (id: string)          => api.delete(`/patient/reports/${id}`),
  shareReport:            (id: string, d: Any)  => api.post(`/patient/reports/${id}/share`, d),
  revokeReportShare:      (id: string, shareId: string) => api.delete(`/patient/reports/${id}/share/${shareId}`),

  // ── Appointments ──────────────────────────────────────────────────────
  // FIX: was /patient/appointments — correct backend path is /appointments
  getAppointments:        (q?: Any)             => api.get('/appointments', { params: q }),
  // NOTE: getNextAppointment removed — /patient/appointments/next does not exist in backend
  // NOTE: getMyCommunities removed — /patient/communities does not exist; use communityAPI.list()
  // NOTE: triggerSOS removed — /patient/emergency/sos does not exist in backend

  // ── Settings ──────────────────────────────────────────────────────────
  getSettings:            ()                    => api.get('/patient/settings'),
  updateSettings:         (d: Any)              => api.put('/patient/settings', d),

  // ── Consents ──────────────────────────────────────────────────────────
  getConsents:            ()                    => api.get('/patient/consents'),
  grantConsent:           (d: Any)              => api.post('/patient/consents', d),
  revokeConsent:          (id: string)          => api.delete(`/patient/consents/${id}`),

  // ── Subscription ──────────────────────────────────────────────────────
  getCurrentSub:          ()                    => api.get('/subscription/current'),
  getBillingHistory:      ()                    => api.get('/subscription/billing-history'),
};

// ── Doctor ────────────────────────────────────────────────────────────────
export const doctorAPI = {
  // Public doctor search — FIX: was /doctors, correct path is /public/doctors
  search:               (q?: Any)               => api.get('/public/doctors', { params: q }),
  // FIX: was /doctors/featured — no separate featured endpoint in backend
  getFeatured:          ()                       => api.get('/public/doctors?limit=6&sort=rating'),
  getById:              (id: string)             => api.get(`/public/doctors/${id}`),
  getSlots:             (id: string)             => api.get(`/public/doctors/${id}/availability`),
  getReviews:           (id: string, q?: Any)    => api.get(`/public/doctors/${id}/reviews`, { params: q }),

  // Doctor profile (authenticated — for doctor's own dashboard)
  getMyProfile:         ()                       => api.get('/doctor/profile'),
  updateMyProfile:      (d: Any)                 => api.put('/doctor/profile', d),
  // FIX: was /doctor/availability — correct path is /doctor/profile/availability
  updateAvailability:   (d: Any)                 => api.put('/doctor/profile/availability', d),
  updateConsultModes:   (d: Any)                 => api.put('/doctor/profile/consultation-modes', d),
  getAnalytics:         ()                       => api.get('/doctor/analytics'),

  // Doctor dashboard
  getDashboard:         ()                       => api.get('/doctor/dashboard'),
  getAppointments:      (q?: Any)                => api.get('/doctor/appointments', { params: q }),
  getPatients:          (q?: Any)                => api.get('/doctor/patients', { params: q }),
  getPatient:           (id: string)             => api.get(`/doctor/patients/${id}`),
  getRecords:           (q?: Any)                => api.get('/doctor/records', { params: q }),
  updateRecord:         (id: string, d: Any)     => api.put(`/doctor/records/${id}`, d),
  addPatientNote:       (id: string, d: Any)     => api.post(`/doctor/patients/${id}/notes`, d),

  // Bookmarks (patient bookmarking a doctor)
  bookmarkDoctor:       (doctorId: string)       => api.post(`/patient/bookmarks/${doctorId}`),
  removeBookmark:       (doctorId: string)       => api.delete(`/patient/bookmarks/${doctorId}`),
  getBookmarks:         ()                       => api.get('/patient/bookmarks'),

  // Reviews
  submitReview:         (doctorId: string, d: Any) => api.post(`/patient/doctors/${doctorId}/reviews`, d),
};

// ── Appointments ──────────────────────────────────────────────────────────
export const appointmentAPI = {
  list:         (q?: Any)            => api.get('/appointments', { params: q }),
  book:         (d: Any)             => api.post('/appointments', d),
  get:          (id: string)         => api.get(`/appointments/${id}`),
  reschedule:   (id: string, d: Any) => api.put(`/appointments/${id}/reschedule`, d),
  cancel:       (id: string, d: Any) => api.put(`/appointments/${id}/cancel`, d),
  updateStatus: (id: string, d: Any) => api.put(`/appointments/${id}/status`, d),
};

// ── Communities ───────────────────────────────────────────────────────────
export const communityAPI = {
  // Directory
  list:           (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
                    api.get('/communities', { params }),
  get:            (idOrSlug: string) => api.get(`/communities/${idOrSlug}`),
  getBySlug:      (slug: string)     => api.get(`/communities/${slug}`),
  getById:        (id: string)       => api.get(`/communities/${id}`),

  // Membership
  join:           (id: string)       => api.post(`/communities/${id}/join`),
  leave:          (id: string)       => api.delete(`/communities/${id}/leave`),
  getMembers:     (id: string, params?: { limit?: number; page?: number }) =>
                    api.get(`/communities/${id}/members`, { params }),

  // Posts
  getPosts:       (id: string, params?: { page?: number; limit?: number; sort?: string; authorId?: string }) =>
                    api.get(`/communities/${id}/posts`, { params }),
  createPost:     (id: string, data: { title?: string; body: string; tags?: string[]; isAnonymous?: boolean; anonymousAlias?: string }) =>
                    api.post(`/communities/${id}/posts`, data),
  updatePost:     (communityId: string, postId: string, data: Any) =>
                    api.put(`/communities/${communityId}/posts/${postId}`, data),
  deletePost:     (communityId: string, postId: string) =>
                    api.delete(`/communities/${communityId}/posts/${postId}`),
  bookmarkPost:   (postId: string) =>
                    api.post(`/communities/posts/${postId}/bookmark`),

  // Reactions
  // Backward compatible: both (postId, type) and legacy (communityId, postId, type) work
  reactToPost:    (communityIdOrPostId: string, postIdOrType: string, reactionType?: string) =>
                    api.post(
                      `/communities/posts/${reactionType ? postIdOrType : communityIdOrPostId}/react`,
                      { reactionType: (reactionType ?? postIdOrType).toUpperCase() }
                    ),
  removeReaction: (communityIdOrPostId: string, postId?: string) =>
                    api.delete(`/communities/posts/${postId ?? communityIdOrPostId}/react`),

  // Comments
  getComments:    (postId: string) =>
                    api.get(`/communities/posts/${postId}/comments`),
  // Backward compatible: both (postId, body) and legacy (communityId, postId, body) work
  addComment:     (communityIdOrPostId: string, postIdOrBody: string, body?: string, isAnonymous = false) =>
                    api.post(
                      `/communities/posts/${body !== undefined ? postIdOrBody : communityIdOrPostId}/comments`,
                      { body: body ?? postIdOrBody, isAnonymous }
                    ),
  deleteComment:  (commentId: string) =>
                    api.delete(`/communities/comments/${commentId}`),
};

// ── Articles ──────────────────────────────────────────────────────────────
export const articleAPI = {
  getAll:         (q?: Any)          => api.get('/articles', { params: q }),
  getTrending:    ()                 => api.get('/articles/trending'),
  getFeatured:    ()                 => api.get('/articles/featured'),
  getBySlug:      (slug: string)     => api.get(`/articles/${slug}`),
  subscribe:      (email: string)    => api.post('/platform/newsletter/subscribe', { email }),
};

// ── Platform ──────────────────────────────────────────────────────────────
export const platformAPI = {
  getStats:       ()                 => api.get('/platform/stats'),
};

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationAPI = {
  list:           ()                 => api.get('/notifications'),
  markRead:       (id: string)       => api.put(`/notifications/${id}/read`),
  markAllRead:    ()                 => api.put('/notifications/read-all'),
  delete:         (id: string)       => api.delete(`/notifications/${id}`),
};

// ── Public (no auth required) ─────────────────────────────────────────────
export const publicAPI = {
  getDoctors:      (q?: Any)         => api.get('/public/doctors', { params: q }),
  getDoctor:       (id: string)      => api.get(`/public/doctors/${id}`),
  getAvailability: (id: string)      => api.get(`/public/doctors/${id}/availability`),
  getCommunities:  (q?: Any)         => api.get('/public/communities', { params: q }),
  getArticles:     (q?: Any)         => api.get('/public/articles', { params: q }),
  getStats:        ()                => api.get('/public/stats'),
  getTestimonials: ()                => api.get('/public/testimonials'),
};
