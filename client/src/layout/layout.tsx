import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from './sidebar';
import { Outlet } from 'react-router-dom';
function RootLayout() {
  return (
    <SidebarProvider>
      <div className='flex gap-5'>
        <Sidebar />
        <main className='max-w-5xl flex-1 mx-auto py-4'>
          {/* This renders the current page */}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default RootLayout;
