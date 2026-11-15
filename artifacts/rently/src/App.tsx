import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { RentlyHomepage } from '@/pages/rently-home';
import { I18nProvider } from '@/lib/i18n';
import {
  useLocation,
  Router as WouterRouter,
} from 'wouter';


const queryClient = new QueryClient();

function Home() {
  return <RentlyHomepage />;
}
function Router() {
  const [location] = useLocation();
  const isRentlyRoute = location === '/' || /^\/(?:properties(?:\/[^/]+)?|tenants(?:\/[^/]+)?|leases(?:\/[^/]+)?)\/?$/.test(location);
  return (
    <RoutedErrorBoundary>
      {isRentlyRoute ? <Home /> : <NotFound />}
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <I18nProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
