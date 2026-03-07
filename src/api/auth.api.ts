import { api } from '@/lib/api';
import { AuthResponse } from '@/types';

export const authApi = {
  register: (data: {
    name: string; email: string; password: string; birth: string; city: string;
  }) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),
};
