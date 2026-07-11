import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TankRecordsPage from './pages/TankRecordsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import SettingsPage from './pages/SettingsPage';
import FinalProductStoragePage from './pages/FinalProductStoragePage';
import FinalBiProductReportPage from './pages/FinalBiProductReportPage';
import RawBulkMilkTestingPage from './pages/RawBulkMilkTestingPage';
import PackingMilkReportPage from './pages/PackingMilkReportPage';
import MilkTakenReportByProduct from './pages/MilkTakenReportByProduct';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useUIStore } from './store/ui.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeManager() {
  const { theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    const applyDark = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyDark(true);
    } else if (theme === 'light') {
      applyDark(false);
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyDark(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeManager />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tank-records" element={<TankRecordsPage />} />
            <Route path="final-product-storage" element={<FinalProductStoragePage />} />
            <Route path="final-bi-product" element={<FinalBiProductReportPage />} />
            <Route path="raw-bulk-milk" element={<RawBulkMilkTestingPage />} />
            <Route path="packing-milk-report" element={<PackingMilkReportPage />} />
            <Route path="milk-taken-report-bi-product" element={<MilkTakenReportByProduct />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
