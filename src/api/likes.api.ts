import { api } from '@/lib/api';
import { LikeResult, SuperLikeResult, User } from '@/types';

export const likesApi = {
  toggle: (userId: string) =>
    api.post<LikeResult>(`/likes/${userId}`).then((r) => r.data),

  superLike: (userId: string) =>
    api.post<SuperLikeResult>(`/likes/super/${userId}`).then((r) => r.data),

  getGiven: () => api.get<string[]>('/likes/given').then((r) => r.data),

  getReceived: () => api.get<User[]>('/likes/received').then((r) => r.data),
};
