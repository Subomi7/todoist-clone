import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaPlusCircle } from 'react-icons/fa';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Inbox,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';
import profile from '@/assets/profile.png';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AddTaskModalContent from '@/components/AddTaskModalContent';
import { useProjects } from '@/hooks/useProjects';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  DialogContent,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { useDeleteProject } from '@/hooks/useDeleteProject';
import { CiHashtag } from 'react-icons/ci';

// NOTE: keep this local shape if you want to display only a few fields in the sidebar.
// If your API returns different field names (e.g. _id) adapt where you render the ID.
interface Project {
  _id?: string; // backend may use _id
  id?: string; // sometimes frontends use id
  name: string;
  color?: string;
  taskCount?: number;
  createdAt?: string | Date;
}

export default function AppSidebar() {
  // UI state
  const sidebar = useSidebar(); // ✅ Get sidebar context
  const isMobile = sidebar.isMobile;

  const handleNavClick = () => {
    if (isMobile) sidebar.setOpenMobile(false); // ✅ Close mobile sidebar
  };

  const handleAddTaskDone = () => {
    if (isMobile) sidebar.setOpenMobile(false); // ✅ Close sidebar after adding
  };
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [open, setOpen] = useState(false);

  // get projects + inbox id from hook
  const {
    projects: apiProjects = [],
    inboxId,
    isLoading: projectsLoading,
    createProjectMutation,
  } = useProjects();

  const location = useLocation();
  const pathname = location.pathname || '/';

  const active =
    pathname === '/' || pathname === '/inbox'
      ? 'inbox'
      : pathname.startsWith('/completed')
      ? 'completed'
      : pathname.startsWith('/projects')
      ? 'projects'
      : '';

  const baseLink =
    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150';

  // optional local create UI — you probably want to call your createProject API instead of mutating UI-only state
  const createProject = async () => {
    if (!newProjectName.trim()) return;

    await createProjectMutation.mutateAsync(
      { name: newProjectName },
      {
        onSuccess: () => {
          setNewProjectName('');
          setShowCreateProject(false);
        },
        onError: (err: any) => {
          console.error('Failed to create project:', err);
        },
      }
    );
  };

  // const sidebarCtx = useSidebar() as any;
  // let isSidebarOpen = false;
  // if (sidebarCtx !== undefined && sidebarCtx !== null) {
  //   if (typeof sidebarCtx.isOpen === 'boolean')
  //     isSidebarOpen = sidebarCtx.isOpen;
  //   else if (typeof sidebarCtx.open === 'boolean')
  //     isSidebarOpen = sidebarCtx.open;
  //   else if (typeof sidebarCtx.state === 'string')
  //     isSidebarOpen = ['open', 'opened'].includes(sidebarCtx.state);
  // }
  // const triggerPositionClass = isSidebarOpen ? 'left-[220px]' : 'left-4';
  const [openDialog, setOpenDialog] = useState(false);
  const { mutate: deleteProject, isPending } = useDeleteProject();

  return (
    <Sidebar className='bg-[#fcfaf8] text-black border-r'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader className='border-d border-gray-800 px-3 py-3 flex flex-row items justify-between'>
            <div className='flex items-center gap-3'>
              <img
                src={profile}
                alt='Profile'
                className='w-9 h-9 rounded-full object-cover'
              />
              <div>
                <p className='font-todoist font-semibold text-[15px]'>
                  Jon Doe
                </p>
                <p className='font-todoist font-normal text-[12px] text-gray-400'>
                  Free Plan
                </p>
              </div>
              {/* <SidebarTrigger
        className={`fixed ${triggerPositionClass} top-6 z-60 p-2 rounded-md bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-slate-100 transition-all duration-200`}
        aria-label='Toggle sidebar'
      /> */}
            </div>
          </SidebarHeader>

          <SidebarMenu>
            <SidebarMenuItem>
              <Dialog open={open} onOpenChange={setOpen}>
                <form>
                  <DialogTrigger asChild>
                    <button className='flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[#dc4c3e] w-full cursor-pointer font-semibold text-[13.5px] font-todoist'>
                      <FaPlusCircle className='h-4.5 w-5' />
                      <span className='text-[#b81f00]'>Add task</span>
                    </button>
                  </DialogTrigger>

                  {/* Render AddTaskModalContent only when dialog is open. Pass inboxId */}
                  {open && (
                    <AddTaskModalContent
                      onDone={() => {
                        setOpen(false);
                        handleAddTaskDone(); 
                      }}
                      projectId={inboxId}
                    />
                  )}
                </form>
              </Dialog>
            </SidebarMenuItem>

            <SidebarMenuItem onClick={handleNavClick}>
              <SidebarMenuButton asChild>
                <NavLink
                  to='/'
                  className={`${baseLink} font-todoist font-normal text-[13.4px] ${
                    active === 'inbox'
                      ? 'bg-[#ffefe5] text-[#b81f00] font-normal text-sm'
                      : 'bg-[#fafafa] text-black hover:bg-[#dc4c3e] hover:text-[#b81f00] text-sm'
                  }`}
                >
                  <Inbox
                    className={`h-4 w-5 ${
                      active === 'inbox' ? 'text-[#b81f00]' : 'text-[#757474]'
                    }`}
                  />
                  <span>Inbox</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem onClick={handleNavClick}>
              <SidebarMenuButton asChild>
                <NavLink
                  to='/completed'
                  className={`${baseLink} font-todoist font-normal text-[13.4px] ${
                    active === 'completed'
                      ? 'bg-[#ffefe5] text-[#b81f00] font-medium text-md'
                      : 'bg-[#fafafa] text-black hover:bg-[#dc4c3e] hover:text-[#dc4c3e] text-sm'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-5 ${
                      active === 'completed'
                        ? 'text-[#b81f00]'
                        : 'text-[#757474]'
                    }`}
                  />
                  <span>Completed</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <div
            className='flex items-center justify-between cursor-pointer pl-2 py-2 rounded-md'
            onClick={() => setProjectsOpen(!projectsOpen)}
          >
            <div className=''>
              <SidebarGroupLabel className='font-todoist tracking-wide text-[12px] font-semibold text-gray-500'>
                My Projects
              </SidebarGroupLabel>
            </div>
            <div className='flex items-center gap-2'>
              <Plus
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateProject(true);
                }}
                className='h-4 w-4 text-gray-400 hover:text-black'
              />
              <ChevronDown
                className={`h-4 w-4 text-gray-400 hover:text-black transition-transform ${
                  projectsOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {projectsOpen && (
            <ScrollArea className='h-48 mt-2'>
              <SidebarMenu>
                {apiProjects
                  .filter(
                    (p) =>
                      p &&
                      (p._id || p.id || p.name) &&
                      p.name?.toLowerCase() !== 'inbox' &&
                      !(p as any).isSystem
                  )
                  .map((project: Project) => {
                    // prefer _id or id as link param
                    const pid =
                      (project as any)._id ??
                      (project as any).id ??
                      String(project.name ?? '');
                    if (!pid) return null;

                    return (
                      <SidebarMenuItem key={pid}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={`/projects/${pid}`}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-3 py-2 rounded-md font-todoist text-[13.4px] ${
                                isActive
                                  ? 'bg-[#343541] text-white'
                                  : 'hover:bg-[#343541]'
                              }`
                            }
                          >
                            <CiHashtag className='text-[#757474]' />
                            <span className='flex-1'>{project.name}</span>
                            <span className='text-xs text-gray-400'>
                              {project.taskCount ?? 0}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className='text-gray-400 hover:text-black cursor-pointer'>
                                  <MoreHorizontal className='h-4 w-4' />
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align='end' className='w-32'>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOpenDialog(true);
                                  }}
                                  className='text-red-600 focus:text-red-700 cursor-pointer'
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                              <Dialog
                                open={openDialog}
                                onOpenChange={setOpenDialog}
                              >
                                <DialogContent className='sm:max-w-[400px] text-center'>
                                  <h2 className='text-lg font-semibold mb-3'>
                                    Delete Project
                                  </h2>
                                  <p className='text-sm text-gray-500 mb-6'>
                                    Are you sure you want to delete this
                                    project? This action cannot be undone.
                                  </p>
                                  <DialogFooter className='flex justify-center gap-4'>
                                    <DialogClose asChild>
                                      <Button
                                        variant='outline'
                                        className='px-4 py-2 text-sm'
                                      >
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm'
                                      disabled={isPending}
                                      onClick={() => {
                                        deleteProject(pid, {
                                          onSuccess: () => setOpenDialog(false),
                                        });
                                      }}
                                    >
                                      {isPending ? 'Deleting...' : 'Delete'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenu>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </ScrollArea>
          )}

          {showCreateProject && (
            <div className='px-3 py-2'>
              <input
                type='text'
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder='Project name'
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                className='w-full p-2 bg-[#747477] text-white rounded text-sm focus:outline-none'
              />
              <div className='flex justify-end gap-2 mt-2'>
                <button
                  onClick={() => setShowCreateProject(false)}
                  className='text-xs px-3 py-1 rounded bg-gray-600 hover:bg-gray-700'
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProjectName.trim()}
                  className='text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700'
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
