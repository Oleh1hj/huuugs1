import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Layout } from '@/components/layout/Layout';
import { AuthPage } from '@/features/auth/AuthPage';
import { SearchPage } from '@/features/search/SearchPage';
import { LikesPage } from '@/features/likes/LikesPage';
import { ChatsPage } from '@/features/chat/ChatsPage';
import { ChatRoom } from '@/features/chat/ChatRoom';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { SupportPage } from '@/features/support/SupportPage';
import { AdminSupportPage } from '@/features/support/AdminSupportPage';

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

function RedirectIfAuthed() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/search" replace />;
  return <AuthPage />;
}

function SupportRoute() {
  const user = useAuthStore((s) => s.user);
  return user?.isAdmin ? <AdminSupportPage /> : <SupportPage />;
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <RedirectIfAuthed />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/search" replace /> },
          { path: 'search',  element: <SearchPage /> },
          { path: 'likes',   element: <LikesPage /> },
          { path: 'chats',   element: <ChatsPage /> },
          { path: 'chats/:conversationId', element: <ChatRoom /> },
          { path: 'support', element: <SupportRoute /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/search" replace /> },
]);
