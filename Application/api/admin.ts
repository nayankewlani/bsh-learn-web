import client from './client';

export interface AdminStats {
  totalStudents: number;
  totalTrainers: number;
  totalCourses: number;
  publishedCourses: number;
  totalLiveClasses: number;
  liveNow: number;
  totalRecordings: number;
  totalEnrollments: number;
  activeSubscriptions: number;
  pendingSessions: number;
  totalRevenuePaise: number;
  thisMonthRevenuePaise: number;
}

export interface AdminTrainer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  isVerifiedBadge?: boolean;
  isOnline?: boolean;
  canPublish: boolean;
  canGoLive: boolean;
  canOfferSessions: boolean;
  specialties?: string[];
  experience?: string;
  trainerLanguages?: string[];
  sessionPricePaise?: number;
  sessionRazorpayLink?: string;
  trainerRole?: string;
  trainerColor?: string;
  sessionsDisplay?: string;
  rating?: number;
  followers?: number;
  hasPayBooking?: boolean;
  hasApplyBooking?: boolean;
  createdAt: string;
  courseCount: number;
  studentCount: number;
  revenuePaise: number;
}

export interface AdminSessionApplication {
  _id: string;
  trainerId: string;
  trainerName: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  issue: string;
  preferredTime?: string;
  message?: string;
  status: 'pending' | 'trainer_proposed' | 'approved' | 'rejected' | 'completed';
  proposedSchedule?: string;
  trainerNote?: string;
  adminNote?: string;
  agoraChannel?: string;
  createdAt: string;
}

export interface AdminStudent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  enrollmentCount?: number;
}

export interface AdminCourse {
  _id: string;
  title: string;
  educator: { _id: string; name: string } | null;
  isPublished: boolean;
  isFeatured: boolean;
  price: number;
  enrollmentCount: number;
  createdAt: string;
}

export interface AdminLiveClass {
  _id: string;
  title: string;
  educator: { _id: string; name: string } | null;
  course?: { _id: string; title: string } | null;
  scheduledAt: string;
  duration: number;
  status: 'pending_approval' | 'rejected' | 'scheduled' | 'live' | 'ended';
  agoraChannel?: string;
  maxParticipants?: number;
  heroVideoUrl?: string;
  recordingMuxPlaybackId?: string;
  recordingActive?: boolean;
  recordingGcsKey?: string;
  recordingGenerating?: boolean;
}

export interface AdminLivePermission {
  _id: string;
  educator: { _id: string; name: string; email: string } | null;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  expiresAt?: string;
  createdAt: string;
}

export interface AdminSession {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  issues: string[];
  detail?: string;
  type: 'private' | 'free_call';
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  adminNotes?: string;
  scheduledAt?: string;
  createdAt: string;
}

export interface AdminEarnings {
  totalRevenuePaise: number;
  monthlyBreakdown: { month: string; revenuePaise: number }[];
  byType: { type: string; revenuePaise: number }[];
  topCourses: { title: string; revenuePaise: number; enrollments: number }[];
}

export type AnalyticsPeriod = '1d' | '2d' | '1w' | '1m' | '3m' | '6m' | '1y';

export interface AnalyticsSeries {
  data: { label: string; value: number }[];
  total: number;
  change: number;
}

export interface CourseEnrollmentSeries extends AnalyticsSeries {
  topCourses: { title: string; count: number }[];
}

export interface LiveClassesSeries extends AnalyticsSeries {
  totalAttendees: number;
  recentClasses: { title: string; scheduledAt: string; attendees: number; status: string }[];
}

export interface AdminAnalytics {
  students:          AnalyticsSeries;
  courses:           AnalyticsSeries;
  sessions:          AnalyticsSeries;
  revenue:           AnalyticsSeries;
  courseEnrollments: CourseEnrollmentSeries;
  liveClasses:       LiveClassesSeries;
}

export const adminGetStats          = ()                             => client.get('/admin/stats');
export const adminGetAnalytics      = (period: AnalyticsPeriod)      => client.get('/admin/analytics', { params: { period } });
export const adminGetTrainers       = ()                             => client.get('/admin/trainers');
export const adminUpdateTrainer     = (id: string, data: object)     => client.patch(`/admin/trainers/${id}/status`, data);
export const adminCreateTrainer     = (data: object)                 => client.post('/admin/trainers', data);
export const adminUpdateTrainerProfile = (id: string, data: object)  => client.patch(`/admin/trainers/${id}`, data);
export const adminGenTrainerRazorpay   = (id: string)                => client.post(`/admin/trainers/${id}/razorpay-session-link`);
export const adminDeleteTrainer        = (id: string)                => client.delete(`/admin/trainers/${id}`);
export const adminGetEducatorApplications = ()                       => client.get('/admin/educator-applications');
export const adminApproveApplication  = (id: string, data?: object)  => client.post(`/admin/educator-applications/${id}/approve`, data || {});
export const adminRejectApplication   = (id: string, note?: string)  => client.post(`/admin/educator-applications/${id}/reject`, { adminNote: note || '' });
export const adminGetStudents       = (params?: object)              => client.get('/admin/students', { params });
export const adminGetStudentDetail  = (id: string)                   => client.get(`/admin/students/${id}`);
export const adminGetCourses        = ()                             => client.get('/admin/courses');
export const adminUpdateCourse      = (id: string, data: object)     => client.patch(`/admin/courses/${id}`, data);
export const adminGetTransactions   = ()                             => client.get('/admin/transactions');
export const adminGetEarnings       = ()                             => client.get('/admin/earnings');
export const adminGetLiveClasses         = ()                                        => client.get('/admin/live-classes');
export const adminApproveLiveClass       = (id: string, action: 'approve' | 'reject') => client.patch(`/admin/live-classes/${id}`, { action });
export const adminGenerateRecording      = (id: string)                               => client.post(`/admin/live-classes/${id}/generate-recording`);
export const adminGetRecordingDownload   = (id: string)                               => client.get<{ url: string }>(`/admin/live-classes/${id}/recording-download`);
export const adminGetSessions       = ()                             => client.get('/admin/private-sessions');
export const adminUpdateSession     = (id: string, data: object)     => client.patch(`/admin/private-sessions/${id}`, data);
export const adminUpdatePermissions = (userId: string, data: object) => client.patch(`/admin/permissions/${userId}`, data);
export const adminSuspendUser                = (id: string)                           => client.delete(`/admin/users/${id}/suspend`);
export const adminGetSessionApplications     = ()                                      => client.get('/admin/session-applications');
export const adminUpdateSessionApplication   = (id: string, data: object)              => client.patch(`/admin/session-applications/${id}`, data);
export const adminBroadcast                  = (data: { title: string; body: string; link?: string }) => client.post('/admin/broadcast', data);
export const adminGetBroadcasts              = ()                                      => client.get('/admin/broadcasts');
