import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/router';
import { useSocket } from '@/hooks/useSocket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function SocketInit() {
  useSocket(); // init WebSocket connection when authenticated
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketInit />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
