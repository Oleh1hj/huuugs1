import { act } from 'react';
import { useAuthStore } from './auth.store';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-1',
  name: 'Олег',
  email: 'oleg@test.com',
  photo: null,
  bio: '',
  age: 25,
  gender: 'male',
  city: 'Kyiv',
  country: 'UA',
  language: 'uk',
  coins: 0,
  birth: '1999-01-01',
  role: 'user',
  isBanned: false,
  isGhostBanned: false,
  trustScore: 100,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('sets auth state on setAuth', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'access-token', 'refresh-token');
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears state on logout', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'access-token', 'refresh-token');
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it('partially updates user on updateUser', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'token', 'refresh');
      useAuthStore.getState().updateUser({ name: 'Updated Name', coins: 10 });
    });

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Updated Name');
    expect(state.user?.coins).toBe(10);
    expect(state.user?.email).toBe(mockUser.email); // unchanged
  });

  it('setTokens updates tokens without changing user', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'old-token', 'old-refresh');
      useAuthStore.getState().setTokens('new-token', 'new-refresh');
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-token');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.user).toEqual(mockUser); // user unchanged
  });
});
