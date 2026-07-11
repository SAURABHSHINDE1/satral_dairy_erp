import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { useUIStore } from '../store/ui.store';
import { useIsMobile } from '../hooks/useIsMobile';

export default function MainLayout() {
  const { sidebarOpen } = useUIStore();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background dark:bg-secondary-900">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Topbar />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

