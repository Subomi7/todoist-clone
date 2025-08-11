import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaPlusCircle } from "react-icons/fa";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Inbox,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
  LayoutGrid,
} from 'lucide-react';
import profile from '../../assets/profile.png';

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

  return (
    <Sidebar className='bg-[#fcfaf8] text-black border-r'>
      <SidebarContent>
        {/* Menu Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <button className='flex items-center gap-3 px-3 py-2 rounded-md text-[#dc4c3e] w-full] cursor-pointer'>
                <FaPlusCircle className='h-5 w-5' />
                <span className=''>Add Task</span>
              </button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to='/'
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md ${
                      isActive
                        ? 'bg-[#7a7b81] text-white'
                        : 'hover:bg-[#9c9c9e]'
                    }`
                  }
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md ${
                      isActive
                        ? 'bg-[#343541] text-white'
                        : 'hover:bg-[#343541]'
                    }`
                  }
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

      {/* Footer Profile */}
      <SidebarFooter className='border-t border-gray-800 px-3 py-3 flex items-center justify-between'>
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
        <SidebarTrigger className='fixed bottom-4 left-4' />
      </SidebarFooter>
    </Sidebar>
  );
}
