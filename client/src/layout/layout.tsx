import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from './sidebar';
import { Outlet } from 'react-router-dom';

function RootLayout() {
  return (
    <SidebarProvider>
      <div className='w-full flex gap-5'>
        <Sidebar />
        <main className='flex-1 py-4 px-4 w-full'>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default RootLayout;
