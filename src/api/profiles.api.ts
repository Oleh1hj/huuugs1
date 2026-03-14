import { api } from '@/lib/api';
import { User } from '@/types';

export const profilesApi = {
  getAll: () => api.get<User[]>('/users/profiles').then((r) => r.data),

  getAllFiltered: (params: { gender?: string; city?: string; ageMin?: number; ageMax?: number }) =>
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

  claimDailyBonus: () =>
    api.post<{ coins: number; alreadyClaimed: boolean }>('/users/daily-bonus').then((r) => r.data),
};
