# Huuugs — Project Guide for Claude

## Architecture

**Monorepo**: frontend + backend in one repo, deployed as one Railway service.

- `src/` — React 18 + TypeScript frontend (Vite)
- `server/src/` — NestJS backend (TypeScript)
- Frontend is built into `server/public/` and served statically by NestJS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, React Query v5, Zustand, React Router v6 |
| Backend | NestJS 10, TypeORM, PostgreSQL, Socket.io, JWT auth |
| Real-time | Socket.io — messages, typing indicator, match notifications |
| Deploy | Railway (single service) |

## Key Files

```
src/
  App.tsx                  # QueryClient setup, global SocketInit
  lib/socket.ts            # Socket singleton (getSocket, connectSocket, disconnectSocket)
  hooks/useSocket.ts       # useSocket (global listener), useSendMessage, useTyping
  store/auth.store.ts      # Zustand auth state (user, accessToken, isAuthenticated)
  api/                     # axios API calls (chats.api.ts, users.api.ts, etc.)
  features/
    chat/ChatRoom.tsx      # Chat UI — emits 'join' on mount, optimistic message updates
    chat/ChatsPage.tsx     # Conversation list
    search/SearchPage.tsx  # Browse & like profiles
    likes/LikesPage.tsx    # Incoming likes
    profile/ProfilePage.tsx
    auth/AuthPage.tsx

server/src/
  chats/chats.gateway.ts   # WebSocket gateway — message, typing, match events
  chats/chats.service.ts   # DB operations for messages/conversations
  likes/likes.service.ts   # Like logic + mutual like detection → creates conversation
  auth/                    # JWT strategy, guards
  main.ts                  # NestJS bootstrap, CORS, global prefix /api
```

## WebSocket Flow

1. On auth → `connectSocket()` called in `useSocket` (App.tsx)
2. Server (`chats.gateway.ts`) verifies JWT, joins socket to all existing `conv:${id}` rooms
3. **New match**: server emits `match` event → client invalidates 'conversations' query
4. **Opening chat**: `ChatRoom` emits `join` to ensure socket is in the room (handles new conversations created after connect)
5. **Sending**: `useSendMessage` adds optimistic message to cache immediately, then emits to server
6. **Receiving**: server broadcasts to `conv:${conversationId}` room, `useSocket` deduplicates temp vs real messages

## Verification Commands

After any code change:
```bash
npx tsc --noEmit          # TypeScript check (run before every commit)
npm run build             # Full build test (frontend)
cd server && npm run build  # Backend build test
```

## Deployment

- **Platform**: Railway
- **Build**: `npm install && npm run build && cd server && npm install && npm run build`
- **Start**: `cd server && npm run start:prod`
- **Env vars on Railway**: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `PORT`
- Frontend is served from `server/public/` (NestJS static files)
- API prefix: `/api/v1/...`

## Rules & Patterns

- **Never** use `require()` in frontend files — use ES imports only (Vite/browser)
- **Real-time data** (messages): rely on WebSocket, not `refetchInterval`
- **Socket cleanup**: always use block body `() => { socket.off(...) }` not expression body (avoids TS2345 — `socket.off` returns Socket, not void)
- **New conversations**: client must emit `join` when opening ChatRoom — server only auto-joins existing rooms on connect
- **Photo uploads**: base64, max 5mb (set in main.ts)
- Global API prefix: `/api`, versioning: `/v1`
