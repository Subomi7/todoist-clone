import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
import profile from '../../assets/profile.png';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import ModalContent from '@/components/AddTaskModalContent';
import { useLocation } from 'react-router-dom';

// Project type
interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  createdAt: Date;
}

// Mock projects
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Work Tasks',
    color: 'bg-blue-500',
    taskCount: 5,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Personal',
    color: 'bg-green-500',
    taskCount: 3,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Learning',
    color: 'bg-purple-500',
    taskCount: 8,
    createdAt: new Date(),
  },
];

export default function AppSidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');

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

  useEffect(() => {
    setProjects(mockProjects);
  }, []);

  const createProject = () => {
    if (!newProjectName.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newProjectName,
        color: selectedColor,
        taskCount: 0,
        createdAt: new Date(),
      },
    ]);
    setNewProjectName('');
    setShowCreateProject(false);
  };

  const sidebarCtx = useSidebar() as any; // cast to any to be flexible
  let isSidebarOpen = false;

  if (sidebarCtx !== undefined && sidebarCtx !== null) {
    if (typeof sidebarCtx.isOpen === 'boolean')
      isSidebarOpen = sidebarCtx.isOpen;
    else if (typeof sidebarCtx.open === 'boolean')
      isSidebarOpen = sidebarCtx.open;
    else if (typeof sidebarCtx.state === 'string')
      isSidebarOpen = ['open', 'opened'].includes(sidebarCtx.state);
    // if your hook uses a different field name, replace above accordingly.
  }

  // left positions: adjust these pixel values to match your sidebar width/layout.
  // - when open: place trigger near the sidebar edge (e.g. 240px)
  // - when closed: pull it to the left so it's still visible (e.g. 16px)
  const triggerPositionClass = isSidebarOpen ? 'left-[220px]' : 'left-4';

  return (
    <Sidebar className='bg-[#fcfaf8] text-black border-r'>
      <SidebarTrigger
        className={`fixed ${triggerPositionClass} top-6 z-50 p-2 rounded-md shadow hover:bg-slate-100 transition-all duration-200`}
        aria-label='Toggle sidebar'
      />
      <SidebarContent>
        {/* Menu Section */}
        <SidebarGroup>
          {/* Header Profile */}
          <SidebarHeader className='border-d border-gray-800 px-3 py-3 flex flex-row items justify-between'>
            <div className='flex items-center gap-3'>
              <img
                src={profile}
                alt='Profile'
                className='w-9 h-9 rounded-full object-cover'
              />
              <div>
                <p className='text-sm font-medium'>Jon Doe</p>
                <p className='text-xs text-gray-400'>Free Plan</p>
              </div>
            </div>
            {/* <SidebarTrigger
              className="absolute -right-0 top-6 z-10 shadow-md"
            /> */}
          </SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Dialog>
                <form>
                  <DialogTrigger asChild>
                    <button className='flex items-center gap-3 px-3 py-2 rounded-md text-[#dc4c3e] w-full] cursor-pointer'>
                      <FaPlusCircle className='h-5 w-5' />
                      <span className=''>Add Task</span>
                    </button>
                  </DialogTrigger>
                  <ModalContent />
                </form>
              </Dialog>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to='/'
                  className={`${baseLink} ${
                    active === 'inbox'
                      ? 'bg-[#ffefe5] text-[#dc4c3e] font-medium'
                      : 'bg-[#fafafa] text-black hover:bg-[#ffefe5] hover:text-[#dc4c3e]'
                  }`}
                >
                  <Inbox className='h-5 w-5' />
                  <span>Inbox</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to='/completed'
                  className={`${baseLink} ${
                    active === 'completed'
                      ? 'bg-[#ffefe5] text-[#dc4c3e] font-medium'
                      : 'bg-[#fafafa] text-black hover:bg-[#ffefe5] hover:text-[#dc4c3e]'
                  }`}
                >
                  <CheckCircle2 className='h-5 w-5' />
                  <span>Completed</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Projects Section */}
        <SidebarGroup>
          <div
            className='flex items-center justify-between cursor-pointer px-3 py-2 rounded-md'
            onClick={() => setProjectsOpen(!projectsOpen)}
          >
            <div className='flex items-center gap-2'>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  projectsOpen ? 'rotate-180' : ''
                }`}
              />
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
            </div>
            <Plus
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateProject(true);
              }}
              className='h-4 w-4 text-gray-400 hover:text-white'
            />
          </div>

          {projectsOpen && (
            <ScrollArea className='h-48 mt-2'>
              <SidebarMenu>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/projects/${project.id}`}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md ${
                            isActive
                              ? 'bg-[#343541] text-white'
                              : 'hover:bg-[#343541]'
                          }`
                        }
                      >
                        <span
                          className={`w-3 h-3 rounded-full ${project.color}`}
                        />
                        <span className='flex-1'>{project.name}</span>
                        <span className='text-xs text-gray-400'>
                          {project.taskCount}
                        </span>
                        <MoreHorizontal className='h-4 w-4 text-gray-400 hover:text-white' />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          )}

          {/* Create Project Input */}
          {showCreateProject && (
            <div className='px-3 py-2'>
              <input
                type='text'
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder='Project name'
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                className='w-full p-2 bg-[#343541] text-white rounded text-sm focus:outline-none'
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
