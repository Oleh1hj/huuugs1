import { api } from '@/lib/api';
import { User } from '@/types';

export const profilesApi = {
  getAll: () => api.get<User[]>('/users/profiles').then((r) => r.data),

  getAllFiltered: (params: { gender?: string; city?: string; ageMin?: number; ageMax?: number; language?: string }) =>
    api.get<User[]>('/users/profiles', { params }).then((r) => r.data),

  getById: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),

  updateMe: (data: Partial<Pick<User,
    'name' | 'birth' | 'city' | 'country' | 'bio' | 'photo' | 'photos' |
    'gender' | 'language' | 'whoCanContact' |
    'contactFilterGender' | 'contactFilterAgeMin' | 'contactFilterAgeMax' |
    'contactFilterSameCity' | 'contactFilterSameLanguage' | 'contactFilterSameCountry' |
    'lookingForGender' | 'lookingForCity' | 'lookingForAgeMin' | 'lookingForAgeMax'
  >>) =>
    api.patch<User>('/users/me', data).then((r) => r.data),

  deleteMe: () => api.delete('/users/me'),

  claimDailyBonus: () =>
    api.post<{ coins: number; alreadyClaimed: boolean }>('/users/daily-bonus').then((r) => r.data),

  blockUser: (userId: string) => api.post(`/users/${userId}/block`),
  unblockUser: (userId: string) => api.delete(`/users/${userId}/block`),
  getBlockedIds: () => api.get<string[]>('/users/blocked').then((r) => r.data),

  reportUser: (userId: string, reason?: string) =>
    api.post(`/users/${userId}/report`, { reason }),

  getWhoViewedMe: () => api.get<User[]>('/users/who-viewed-me').then((r) => r.data),
  getViewCount: () => api.get<{ count: number }>('/users/view-count').then((r) => r.data),

  // Admin
  adminGetAll: () => api.get<User[]>('/users/admin/all').then((r) => r.data),
  adminGetReports: () => api.get<any[]>('/users/admin/reports').then((r) => r.data),
  adminGetStats: () => api.get<any>('/users/admin/stats').then((r) => r.data),
  adminVerify: (userId: string, value: boolean) => api.post(`/users/${userId}/verify`, { value }),
  adminPremium: (userId: string, value: boolean, days = 30) => api.post(`/users/${userId}/premium`, { value, days }),
  adminBan: (userId: string, value: boolean) => api.post(`/users/${userId}/ban`, { value }),
};
