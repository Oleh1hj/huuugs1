import { api } from '@/lib/api';
import { User } from '@/types';

export const profilesApi = {
  getAll: () => api.get<User[]>('/users/profiles').then((r) => r.data),

  updateMe: (data: Partial<Pick<User, 'name' | 'birth' | 'city' | 'bio' | 'photo'>>) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
};
