// src/lib/api.ts — Axios Instance + Interceptors
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = Cookies.get('hc_token');
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Handle 401 globally → only redirect if we have NO token (truly logged out)
// If a token exists in the store, the 401 is a backend/timing issue — let the
// component handle it. Never redirect an authenticated user to login.
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // Dynamically import to avoid circular deps
      const { useAuthStore } = await import('@/store/authStore');
      const { token, isAuthenticated } = useAuthStore.getState() as any;
      // Only hard-redirect if we genuinely have no credentials at all
      if (!token && !isAuthenticated) {
        Cookies.remove('hc_token');
        Cookies.remove('hc_user');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/doctor-dashboard') && !window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(err);
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const authAPI = {
  register: (data: Any)      => api.post('/auth/register', data),
  login:    (data: Any)      => api.post('/auth/login', data),
  logout:   ()               => api.post('/auth/logout'),
  me:       ()               => api.get('/auth/me'),
};

export const patientAPI = {
  // ── Dashboard ─────────────────────────────────────────────────────────
  dashboard:           ()              => api.get('/patient/dashboard'),

  // ── Profile ───────────────────────────────────────────────────────────
  addEmergencyContact:    (d: Any)             => api.post('/patient/profile/emergency-contacts', d),
  updateEmergencyContact: (id: string, d: Any)  => api.put(`/patient/profile/emergency-contacts/${id}`, d),
  deleteEmergencyContact: (id: string)          => api.delete(`/patient/profile/emergency-contacts/${id}`),
  getEmergencyContacts:   ()                    => api.get('/patient/profile/emergency-contacts'),
  getProfile:          ()              => api.get('/patient/profile'),
  updateProfile:       (d: Any)        => api.put('/patient/profile', d),

  // ── Health Score ──────────────────────────────────────────────────────
  getHealthScore:      ()              => api.get('/patient/health-score'),
  refreshHealthScore:   ()              => api.post('/patient/health-score/refresh'),
  getHealthScoreHistory: ()            => api.get('/patient/health-score'),

  // ── Medical History (single endpoint returns all 6 sub-tables) ────────
  getMedicalHistory:   ()              => api.get('/patient/medical-history'),

  // ── Conditions ────────────────────────────────────────────────────────
  getConditions:       ()              => api.get('/patient/conditions'),
  createCondition:     (d: Any)        => api.post('/patient/conditions', d),
  updateCondition:     (id: string, d: Any) => api.put(`/patient/conditions/${id}`, d),
  deleteCondition:     (id: string)    => api.delete(`/patient/conditions/${id}`),

  // ── Allergies ─────────────────────────────────────────────────────────
  getAllergies:         ()              => api.get('/patient/allergies'),
  createAllergy:       (d: Any)        => api.post('/patient/allergies', d),
  deleteAllergy:       (id: string)    => api.delete(`/patient/allergies/${id}`),

  // ── Surgeries ─────────────────────────────────────────────────────────
  createSurgery:       (d: Any)        => api.post('/patient/surgeries', d),
  deleteSurgery:       (id: string)    => api.delete(`/patient/surgeries/${id}`),

  // ── Vaccinations ──────────────────────────────────────────────────────
  createVaccination:   (d: Any)        => api.post('/patient/vaccinations', d),

  // ── Family History ────────────────────────────────────────────────────
  createFamilyHistory: (d: Any)        => api.post('/patient/family-history', d),

  // ── Symptoms ──────────────────────────────────────────────────────────
  getSymptoms:         (q?: Any)       => api.get('/patient/symptoms', { params: q }),
  logSymptom:          (d: Any)        => api.post('/patient/symptoms', d),
  createSymptom:       (d: Any)        => api.post('/patient/symptoms', d), // alias
  deleteSymptom:       (id: string)    => api.delete(`/patient/symptoms/${id}`),

  // ── Vitals ────────────────────────────────────────────────────────────
  getVitals:           (q?: Any)       => api.get('/patient/vitals', { params: q }),
  deleteVital:         (id: string)    => api.delete(`/patient/vitals/${id}`),
  logVital:            (d: Any)        => api.post('/patient/vitals', d),
  getVitalTrend:       (type: string)  => api.get(`/patient/vitals/${type}/trend`),

  // ── Medications ───────────────────────────────────────────────────────
  getMedications:      (q?: Any)       => api.get('/patient/medications', { params: q }),
  addMedication:       (d: Any)        => api.post('/patient/medications', d),
  updateMedication:    (id: string, d: Any) => api.put(`/patient/medications/${id}`, d),
  deleteMedication:    (id: string)    => api.delete(`/patient/medications/${id}`),
  // Dose logging
  logDose:             (id: string, d: Any) => api.post(`/patient/medications/${id}/logs`, d),
  getMedicationLogs:   (id: string, q?: Any) => api.get(`/patient/medications/${id}/logs`, { params: q }),
  markTaken:           (id: string)    => api.put(`/patient/medications/${id}/taken`),
  getAdherence:        ()              => api.get('/patient/medications/adherence'),

  // ── Therapies ─────────────────────────────────────────────────────────
  getTherapies:        ()              => api.get('/patient/therapies'),
  addTherapy:          (d: Any)        => api.post('/patient/therapies', d),
  deleteTherapy:       (id: string)    => api.delete(`/patient/therapies/${id}`),

  // ── Reports ───────────────────────────────────────────────────────────
  getReports:          (q?: Any)       => api.get('/patient/reports', { params: q }),
  uploadReport:        (d: FormData)   => api.post('/patient/reports', d, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteReport:        (id: string)    => api.delete(`/patient/reports/${id}`),
  shareReport:         (id: string, d: Any) => api.post(`/patient/reports/${id}/share`, d),
  revokeReportShare:   (id: string, shareId: string) => api.delete(`/patient/reports/${id}/share/${shareId}`),

  // ── Appointments ──────────────────────────────────────────────────────
  getAppointments:     (q?: Any)       => api.get('/patient/appointments', { params: q }),
  getNextAppointment:  ()              => api.get('/patient/appointments/next'),

  // ── Communities ───────────────────────────────────────────────────────
  getMyCommunities:    ()              => api.get('/patient/communities'),

  // ── Emergency ─────────────────────────────────────────────────────────
  triggerSOS:          (d: Any)        => api.post('/patient/emergency/sos', d),

  // ── Settings ──────────────────────────────────────────────────────────
  getSettings:         ()              => api.get('/patient/settings'),
  updateSettings:      (d: Any)        => api.put('/patient/settings', d),

  // ── Consents ──────────────────────────────────────────────────────────
  getConsents:         ()              => api.get('/patient/consents'),
  grantConsent:        (d: Any)        => api.post('/patient/consents', d),
  revokeConsent:       (id: string)    => api.delete(`/patient/consents/${id}`),

  // ── Subscription ──────────────────────────────────────────────────────
  getCurrentSub:       ()              => api.get('/subscription/current'),
  getBillingHistory:   ()              => api.get('/subscription/billing-history'),
};

export const doctorAPI = {
  search:      (q?: Any)       => api.get('/doctors', { params: q }),
  getFeatured: ()              => api.get('/doctors/featured'),
  addEmergencyContact:    (d: Any)             => api.post('/patient/profile/emergency-contacts', d),
  updateEmergencyContact: (id: string, d: Any)  => api.put(`/patient/profile/emergency-contacts/${id}`, d),
  deleteEmergencyContact: (id: string)          => api.delete(`/patient/profile/emergency-contacts/${id}`),
  getEmergencyContacts:   ()                    => api.get('/patient/profile/emergency-contacts'),
  getProfile:  (id: string)    => api.get(`/doctors/${id}`),
  getSlots:    (id: string)    => api.get(`/doctors/${id}/slots`),
};

export const appointmentAPI = {
  book:       (d: Any)         => api.post('/appointments', d),
  reschedule: (id: string, d: Any) => api.put(`/appointments/${id}/reschedule`, d),
  cancel:     (id: string, d: Any) => api.put(`/appointments/${id}/cancel`, d),
};

export const communityAPI = {
  // Directory
  list:    (params?: { search?: string; category?: string; page?: number; limit?: number }) =>
             api.get('/communities', { params }),
  getById: (id: string) =>
             api.get(`/communities/${id}`),

  // Membership
  join:    (id: string) =>
             api.post(`/communities/${id}/join`),
  leave:   (id: string) =>
             api.delete(`/communities/${id}/leave`),

  // Posts feed
  getPosts: (id: string, params?: { page?: number; limit?: number; sort?: string }) =>
              api.get(`/communities/${id}/posts`, { params }),
  createPost: (id: string, data: { title?: string; body: string; tags?: string[]; isAnonymous?: boolean }) =>
                api.post(`/communities/${id}/posts`, data),
  deletePost: (communityId: string, postId: string) =>
                api.delete(`/communities/${communityId}/posts/${postId}`),

  // Reactions & comments
  reactToPost: (communityId: string, postId: string, reactionType: string | null) =>
                 api.post(`/communities/${communityId}/posts/${postId}/react`, { reactionType }),
  addComment:  (communityId: string, postId: string, body: string, parentId?: string) =>
                 api.post(`/communities/${communityId}/posts/${postId}/comments`, { body, parentId }),
};

export const articleAPI = {
  getTrending: ()              => api.get('/articles/trending'),
  subscribe:   (email: string) => api.post('/platform/newsletter/subscribe', { email }),
};

export const platformAPI = {
  getStats:    ()              => api.get('/platform/stats'),
};

export const notificationAPI = {
  list:   ()        => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: ()   => api.put('/notifications/read-all'),
};
