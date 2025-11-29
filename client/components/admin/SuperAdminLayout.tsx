import { Outlet } from 'react-router-dom';
import SuperAdminNav from './SuperAdminNav';

interface SuperAdminLayoutProps {
  children?: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* SuperAdmin Navigation Sidebar */}
        <SuperAdminNav />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="py-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
