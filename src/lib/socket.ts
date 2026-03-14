import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

// Derive WebSocket server URL from VITE_API_URL (strip /api/v1) or same origin
const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
const SOCKET_URL = apiUrl ? apiUrl.replace(/\/api\/v?\d+\/?$/, '') : '/';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Use callback so every reconnection attempt uses the CURRENT (possibly refreshed) token
      auth: (cb: (data: object) => void) => cb({ token: useAuthStore.getState().accessToken }),
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
