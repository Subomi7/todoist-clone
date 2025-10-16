import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Checkbox } from '@/components/ui/checkbox';
import { IoMdAdd } from 'react-icons/io';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import AddTaskModalContent from '@/components/AddTaskModalContent';
import type { Task } from '@/types/task';
import { useUpdateTask } from '@/hooks/useUpdateTask';
import { useDeleteTask } from '@/hooks/useDeleteTask';
import { RiEdit2Line } from 'react-icons/ri';
import { MdDeleteOutline } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import projectEmpty from '@/assets/freepik__assistant__10842.png';

const getPriorityClass = (priority: 1 | 2 | 3) => {
  switch (priority) {
    case 1:
      return 'border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500';
    case 2:
      return 'border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500';
    case 3:
      return 'border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500';
    default:
      return 'border-gray-500 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500';
  }
};

const MyProject: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: projectTasks = [], isLoading: loadingTasks } = useTasks(
    projectId,
    false
  );
  const { projects } = useProjects();
  const project = projects.find((p) => (p._id ?? p.id) === projectId);

  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask();

  // ✅ Mark task completed
  const handleCheckedChange =
    (task: Task) => (checked: boolean | 'indeterminate') => {
      if (checked !== true) return;
      updateTask(
        { id: task._id, patch: { completed: true } },
        {
          onSuccess: () => navigate('/completed'),
          onError: (err) => console.error('Failed to complete task', err),
        }
      );
    };

  // ✅ Open confirmation dialog before deleting
  const handleDeleteClick = (id: string) => {
    setSelectedTaskId(id);
    setConfirmOpen(true);
  };

  // ✅ Confirm delete action
  const confirmDelete = () => {
    if (selectedTaskId) {
      deleteTask(selectedTaskId, {
        onSettled: () => {
          setConfirmOpen(false);
          setSelectedTaskId(null);
        },
      });
    }
  };

  if (loadingTasks) return <p>Loading tasks...</p>;

  const hasTasks = projectTasks.length > 0;

  return (
    <main className='p-10 lg:p-24'>
      <div>
        <h1 className='text-2xl font-bold mx-6'>
          {project?.name ?? 'Project'}
        </h1>
      </div>

      {!hasTasks ? (
        <div className='flex flex-col items-center justify-center text-center gap-3 h-[60vh]'>
          <img src={projectEmpty} alt='No tasks' className='w-48' />
          <h3 className='text-sm text-gray-600'>
            No tasks in this project yet.
          </h3>
          <p className='text-xs text-gray-400 max-w-xs'>
            Add a new task to get started organizing your work here.
          </p>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm hover:bg-[#c43b32]'>
                <IoMdAdd /> Add a task
              </button>
            </DialogTrigger>

            <AddTaskModalContent
              onDone={() => setIsModalOpen(false)}
              projectId={projectId}
            />
          </Dialog>
        </div>
      ) : (
        <div className='w-full space-y-0 mt-6'>
          {projectTasks.map((task) => (
            <div
              key={task._id}
              className='flex items-center justify-between gap-3 border-b border-gray-300 last:border-b-0'
            >
              <div className='flex items-start gap-3 py-4 mx-9'>
                <Checkbox
                  id={`task-${task._id}`}
                  checked={task.completed}
                  onCheckedChange={handleCheckedChange(task)}
                  className={`cursor-pointer rounded-full w-5 h-5 mt-0.5 ${getPriorityClass(
                    task.priority as 1 | 2 | 3
                  )}`}
                />
                <div>
                  <h2 className='text-sm'>{task.title}</h2>
                  {task.dueDate && (
                    <p className='text-xs text-gray-400'>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <RiEdit2Line className='cursor-pointer text-xl' />
                <button
                  onClick={() => handleDeleteClick(task._id)}
                  disabled={deleting}
                >
                  <MdDeleteOutline className='text-red-600 cursor-pointer text-xl' />
                </button>
              </div>
            </div>
          ))}

          {/* Add Task Button */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-6 text-sm hover:bg-[#c43b32]'>
                <IoMdAdd /> Add another task
              </button>
            </DialogTrigger>

            <AddTaskModalContent
              onDone={() => setIsModalOpen(false)}
              projectId={projectId}
            />
          </Dialog>
        </div>
      )}

      {/* 🧩 Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-gray-600'>
            Are you sure you want to delete this task? This action cannot be
            undone.
          </p>
          <DialogFooter className='mt-4 flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default MyProject;




// import React, { useMemo, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useTasks } from '@/hooks/useTasks';
// import { useProjects } from '@/hooks/useProjects';
// import { Checkbox } from '@/components/ui/checkbox';
// import { IoMdAdd } from 'react-icons/io';
// import { Dialog, DialogTrigger } from '@/components/ui/dialog';
// import AddTaskModalContent from '@/components/AddTaskModalContent';
// import type { Task } from '@/types/task';
// import { useUpdateTask } from '@/hooks/useUpdateTask';
// import { useDeleteTask } from '@/hooks/useDeleteTask';
// import { RiEdit2Line } from 'react-icons/ri';
// import { MdDeleteOutline } from 'react-icons/md';
// import projectEmpty from '@/assets/freepik__assistant__10842.png'; // same as inbox image

// const getPriorityClass = (priority: 1 | 2 | 3) => {
//   switch (priority) {
//     case 1:
//       return 'border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500';
//     case 2:
//       return 'border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500';
//     case 3:
//       return 'border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500';
//     default:
//       return 'border-gray-500 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500';
//   }
// };

// const MyProject: React.FC = () => {
//   const { id: projectId } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // Fetch tasks for this project only
//   const { data: projectTasks = [], isLoading: loadingTasks } = useTasks(
//     projectId,
//     false
//   );

//   // Fetch projects to display the name at the top
//   const { projects } = useProjects();
//   const project = projects.find((p) => (p._id ?? p.id) === projectId);

//   const { mutate: updateTask } = useUpdateTask();
//   const { mutate: deleteTask, isPending: deleting } = useDeleteTask();

//   // Handler for marking a task complete
//   const handleCheckedChange =
//     (task: Task) => (checked: boolean | 'indeterminate') => {
//       if (checked !== true) return;
//       updateTask(
//         { id: task._id, patch: { completed: true } },
//         {
//           onSuccess: () => navigate('/completed'),
//           onError: (err) => console.error('Failed to complete task', err),
//         }
//       );
//     };

//   if (loadingTasks) return <p>Loading tasks...</p>;

//   const hasTasks = projectTasks.length > 0;
//   return (
//     <main className='p-10 lg:p-24'>
//       <div>
//         <h1 className='text-2xl font-bold mx-6'>
//           {project?.name ?? 'Project'}
//         </h1>
//       </div>

//       {!hasTasks ? (
//         <div className='flex flex-col items-center justify-center text-center gap-3 h-[60vh]'>
//           <img src={projectEmpty} alt='No tasks' className='w-48' />
//           <h3 className='text-sm text-gray-600'>
//             No tasks in this project yet.
//           </h3>
//           <p className='text-xs text-gray-400 max-w-xs'>
//             Add a new task to get started organizing your work here.
//           </p>

//           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//             <DialogTrigger asChild>
//               <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm hover:bg-[#c43b32]'>
//                 <IoMdAdd /> Add a task
//               </button>
//             </DialogTrigger>

//             <AddTaskModalContent
//               onDone={() => setIsModalOpen(false)}
//               projectId={projectId}
//             />
//           </Dialog>
//         </div>
//       ) : (
//         <div className='w-full space-y-0 mt-6'>
//           {projectTasks.map((task) => (
//             <div
//               key={task._id}
//               className='flex items-center justify-between gap-3 border-b border-gray-300 last:border-b-0'
//             >
//               <div className='flex items-start gap-3 py-4 mx-9'>
//                 <Checkbox
//                   id={`task-${task._id}`}
//                   checked={task.completed}
//                   onCheckedChange={handleCheckedChange(task)}
//                   className={`cursor-pointer rounded-full w-5 h-5 mt-0.5 ${getPriorityClass(
//                     task.priority as 1 | 2 | 3
//                   )}`}
//                 />
//                 <div>
//                   <h2 className='text-sm'>{task.title}</h2>
//                   {task.dueDate && (
//                     <p className='text-xs text-gray-400'>
//                       {new Date(task.dueDate).toLocaleDateString()}
//                     </p>
//                   )}
//                 </div>
//               </div>
//               <div className='flex items-center gap-4'>
//                 <RiEdit2Line className='cursor-pointer text-xl' />
//                 <button
//                   onClick={() => deleteTask(task._id)}
//                   disabled={deleting}
//                 >
//                   <MdDeleteOutline className='text-red-600 cursor-pointer text-xl' />
//                 </button>
//               </div>
//             </div>
//           ))}

//           {/* Add Task Button */}
//           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//             <DialogTrigger asChild>
//               <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-6 text-sm hover:bg-[#c43b32]'>
//                 <IoMdAdd /> Add another task
//               </button>
//             </DialogTrigger>

//             <AddTaskModalContent
//               onDone={() => setIsModalOpen(false)}
//               projectId={projectId}
//             />
//           </Dialog>
//         </div>
//       )}
//     </main>
//   );
// };

// export default MyProject;
