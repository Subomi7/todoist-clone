import React, { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api/project';
import type { Project } from '@/types/project';
import profile from '@/assets/profile.png';

const CompletedPage = () => {
  // fetch all completed tasks
  const { data: completedTasksData = [], isLoading: loadingTasks } = useTasks(
    undefined,
    true
  );
  const completedTasks = useMemo(
    () =>
      completedTasksData
        .filter((t) => t.completed)
        .map((t) => ({
          ...t,
          projectId:
            t.projectId && t.projectId !== '000000000000000000000000'
              ? String(t.projectId)
              : null,
        })),
    [completedTasksData]
  );
  // fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });
  const projects: Project[] = projectsData?.data ?? [];

  const [selectedProject, setSelectedProject] = useState<string>('all');

  if (loadingTasks) return <p>Loading...</p>;

  // filter by project
  const filteredTasks = completedTasks.filter((task) => {
    if (selectedProject === 'all') return true;
    if (selectedProject === 'inbox') return task.projectId === null;
    return task.projectId === selectedProject;
  });

  const currentProjectName =
    selectedProject === 'all'
      ? 'All projects'
      : selectedProject === 'inbox'
      ? 'Inbox'
      : projects.find((p) => p.id === selectedProject)?.name ?? 'Unknown';

  return (
    <div className='p-10 lg:p-12 lg:px-24'>
      <div className='flex items-center gap-2'>
        <h1 className='text-lg font-bold'>Activity: {currentProjectName}</h1>
        {/* Dropdown */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className='border px-2 py-1 rounded text-sm'
        >
          <option value='all'>All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className='mt-6 space-y-4'>
        {filteredTasks.map((task) => {
          const project =
            task.projectId === null
              ? { name: 'Inbox' }
              : projects.find((p) => p.id === task.projectId) ?? {
                  name: 'Unknown',
                };
          return (
            <div key={task._id}>
              <h2 className='py-2 border-b border-gray-300 text-sm text-gray-600'>
                <strong>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </strong>
              </h2>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2.5 py-3 px-3.5'>
                  <img
                    src={profile}
                    alt='Profile'
                    className='w-9 h-9 rounded-full object-cover'
                  />
                  <p className='text-[14px]'>{`You completed a task: ${task.title}`}</p>
                </div>
                <div>
                  <p className='text-sm'>{project.name}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <p className='text-gray-500 text-sm mt-4'>No completed tasks.</p>
        )}
      </div>
    </div>
  );
};

export default CompletedPage;

// import React, { useState } from "react";
// import { useTasks } from "@/hooks/useTasks";
// import { useInboxProjectId } from "@/hooks/useInboxProjectId";
// import { useQuery } from "@tanstack/react-query";
// import { getProjects } from "@/api/project";
// import type { Project } from "@/types/project";
// import profile from "@/assets/profile.png";

// const CompletedPage = () => {
//   // fetch all completed tasks
//   const { data: completedTasksData, isLoading: loadingTasks } = useTasks(undefined, true);
//   const completedTasks = completedTasksData?.data?.filter(t => t.completed) ?? [];

//   // fetch projects for dropdown
//   const { data: projectsData } = useQuery({
//     queryKey: ["projects"],
//     queryFn: getProjects,
//   });
//   const projects: Project[] = projectsData?.data ?? [];

//   const [selectedProject, setSelectedProject] = useState<string>("all");

//   if (loadingTasks) return <p>Loading...</p>;

//   // filter by project
//   const filteredTasks = completedTasks.filter((task) => {
//     if (selectedProject === "all") return true;
//     return task.projectId === selectedProject;
//   });

//   const currentProjectName =
//     selectedProject === "all"
//       ? "All projects"
//       : projects.find((p) => p._id === selectedProject)?.name ?? "Unknown";

//   return (
//     <div className="p-10 lg:p-12 lg:px-24">
//       <div className="flex items-center gap-2">
//         <h1 className="text-lg font-bold">Activity: {currentProjectName}</h1>
//         {/* Dropdown */}
//         <select
//           value={selectedProject}
//           onChange={(e) => setSelectedProject(e.target.value)}
//           className="border px-2 py-1 rounded text-sm"
//         >
//           <option value="all">All projects</option>
//           {projects.map((p) => (
//             <option key={p._id} value={p._id}>
//               {p.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="mt-6 space-y-4">
//         {filteredTasks.map((task) => (
//           <div key={task._id}>
//             <h2 className="py-2 border-b border-gray-300 text-sm text-gray-600">
//               <strong>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</strong>
//             </h2>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2.5 py-3 px-3.5">
//                 <img
//                   src={profile}
//                   alt="Profile"
//                   className="w-9 h-9 rounded-full object-cover"
//                 />
//                 <p className="text-[14px]">{`You completed a task: ${task.title}`}</p>
//               </div>
//               <div>
//                 <p className="text-sm">
//                   {projects.find((p) => p._id === task.projectId)?.name ?? "Inbox"}
//                 </p>
//               </div>
//             </div>
//           </div>
//         ))}
//         {filteredTasks.length === 0 && (
//           <p className="text-gray-500 text-sm mt-4">No completed tasks.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CompletedPage;
