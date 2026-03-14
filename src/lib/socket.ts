import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

// Derive WebSocket server URL: strip path from VITE_API_URL so socket.io
// connects to namespace '/' (not '/api/v1' which would cause "Invalid namespace")
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
let SOCKET_URL = '/';
if (apiUrl) {
  try { SOCKET_URL = new URL(apiUrl).origin; } catch { /* fall back to same origin */ }
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Use callback so every reconnection attempt uses the CURRENT (possibly refreshed) token
      auth: (cb: (data: object) => void) => cb({ token: useAuthStore.getState().accessToken }),
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
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
