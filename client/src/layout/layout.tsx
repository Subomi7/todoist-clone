import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import Sidebar from './sidebar';
import { Outlet } from 'react-router-dom';
import { LuPanelLeft } from 'react-icons/lu';
import { useEffect, useState } from 'react';

function CustomSidebarTrigger() {
  const sidebar = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Determine open state correctly
  const isOpen = isMobile ? sidebar.openMobile : sidebar.open

  const toggleSidebar = () => {
    if (isMobile) {
      sidebar.setOpenMobile(!sidebar.openMobile)
    } else {
      sidebar.setOpen(!sidebar.open)
    }
  }

  // Move button depending on state
  const triggerPosition = isOpen ? 'left-[210px]' : 'left-4'

  return (
    <button
      onClick={toggleSidebar}
      aria-label='Toggle sidebar'
      className={`fixed ${triggerPosition} top-6 z-50 p-2 rounded-md 
       backdrop-blur-sm 
        hover:bg-slate-100 transition-all duration-300`}
    >
      <LuPanelLeft
        className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${
          isOpen ? 'rotate-180' : 'rotate-0'
        }`}
      />
    </button>
  )
}


function RootLayout() {
  return (
    <SidebarProvider>
      <div className="w-full flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full px-4">
          <CustomSidebarTrigger />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}

export default RootLayout


// import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
// import Sidebar from "./sidebar";
// import { Outlet } from "react-router-dom";
// import { LuPanelLeft } from "react-icons/lu";
// import { useEffect, useState } from "react";

// function CustomSidebarTrigger() {
//   const { open, setOpen } = useSidebar(); // ✅ correct shadcn fields
//   const [isMobile, setIsMobile] = useState(false);

//   // Detect mobile screen
//   useEffect(() => {
//      const handleResize = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       if (mobile) setOpen(false); // 👈 close by default on mobile
//     };
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [setOpen]);

//   const toggleSidebar = () => {
//     setOpen(!open); // ✅ directly toggles the sidebar
//   };

//   // Trigger positioning
//   const triggerPosition = isMobile
//     ? open
//       ? "left-[190px] top-5" // inside near profile
//       : "left-4 top-6"
//     : open
//     ? "left-[210px] top-6"
//     : "left-4 top-6";

//   return (
//     <button
//       onClick={toggleSidebar}
//       aria-label="Toggle sidebar"
//       className={`fixed ${triggerPosition} z-[60] p-2 rounded-md
//                   backdrop-blur-sm cursor-pointer hover:bg-slate-100
//                   transition-all duration-300`}
//     >
//       <LuPanelLeft
//         className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${
//           open ? "rotate-180" : "rotate-0"
//         }`}
//       />
//     </button>
//   );
// }

// function RootLayout() {
//   return (
//     <SidebarProvider defaultOpen={true}>
//       <div className="flex w-full overflow-hidden">
//         <Sidebar />
//         <main className="flex-1 w-full px-4 relative">
//           <CustomSidebarTrigger />
//           <Outlet />
//         </main>
//       </div>
//     </SidebarProvider>
//   );
// }

// export default RootLayout;

// import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
// import Sidebar from './sidebar';
// import { Outlet } from 'react-router-dom';

// function RootLayout() {
//   const sidebarCtx = useSidebar() as any;
//   let isSidebarOpen = false;
//   if (sidebarCtx !== undefined && sidebarCtx !== null) {
//     if (typeof sidebarCtx.isOpen === 'boolean')
//       isSidebarOpen = sidebarCtx.isOpen;
//     else if (typeof sidebarCtx.open === 'boolean')
//       isSidebarOpen = sidebarCtx.open;
//     else if (typeof sidebarCtx.state === 'string')
//       isSidebarOpen = ['open', 'opened'].includes(sidebarCtx.state);
//   }
//   const triggerPositionClass = isSidebarOpen ? 'left-[220px]' : 'left-4';
//   return (
//     <SidebarProvider>
//       <div className='w-full flex gap-5 overflow-y-hidden'>
//         <Sidebar />
//         <main className='flex-1 px-4 w-full'>
//           <SidebarTrigger
//             className={`fixed ${triggerPositionClass} top-6 z-60 p-2 rounded-md bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-slate-100 transition-all duration-200`}
//             aria-label='Toggle sidebar'
//           />
//           <Outlet />
//         </main>
//       </div>
//     </SidebarProvider>
//   );
// }

// export default RootLayout;
