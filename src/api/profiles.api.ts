import { api } from '@/lib/api';
import { User } from '@/types';

export const profilesApi = {
  getAll: (params?: { gender?: string; city?: string; ageMin?: number; ageMax?: number }) =>
    api.get<User[]>('/users/profiles', { params }).then((r) => r.data),

  updateMe: (data: Partial<Pick<User,
    'name' | 'birth' | 'city' | 'bio' | 'photo' |
    'gender' | 'language' |
    'lookingForGender' | 'lookingForCity' | 'lookingForAgeMin' | 'lookingForAgeMax'
  >>) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
};
