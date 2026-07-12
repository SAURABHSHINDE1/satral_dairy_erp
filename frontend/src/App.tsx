import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import MainLayout from './layouts/MainLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useUIStore } from './store/ui.store';

// ─── Code Splitting: Lazy loaded pages ─────────────────────────────────────────
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TankRecordsPage = React.lazy(() => import('./pages/TankRecordsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const ActivityLogsPage = React.lazy(() => import('./pages/ActivityLogsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const FinalProductStoragePage = React.lazy(() => import('./pages/FinalProductStoragePage'));
const FinalBiProductReportPage = React.lazy(() => import('./pages/FinalBiProductReportPage'));
const RawBulkMilkTestingPage = React.lazy(() => import('./pages/RawBulkMilkTestingPage'));
const PackingMilkReportPage = React.lazy(() => import('./pages/PackingMilkReportPage'));
const MilkTakenReportByProduct = React.lazy(() => import('./pages/MilkTakenReportByProduct'));
const ButtermilkAnalysisRecordPage = React.lazy(() => import('./pages/ButtermilkAnalysisRecordPage'));
const PouchWeighingLogSheet = React.lazy(() => import('./pages/PouchWeighingLogSheet'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));

// ─── Loading Spinner for Suspense ────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
      <p className="text-xs text-text-secondary font-medium animate-pulse">Loading Page...</p>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,          // 30 seconds stale time
      gcTime: 5 * 60 * 1000,     // 5 minutes garbage collection (cache) time
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
        <Suspense fallback={<PageLoader />}>
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
              <Route path="buttermilk-analysis-record" element={<ButtermilkAnalysisRecordPage />} />
              <Route path="pouch-weighing-log" element={<PouchWeighingLogSheet />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="activity-logs" element={<ActivityLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
