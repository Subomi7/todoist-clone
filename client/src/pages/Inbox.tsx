import React, { useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { IoMdAdd } from "react-icons/io";
import inboxImg from "../assets/freepik__assistant__10842.png";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useInboxProjectId } from "@/hooks/useInboxProjectId";
import type { Task } from "@/types/task";
import AddTaskModalContent from "@/components/AddTaskModalContent";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import { useNavigate } from "react-router";

/** priority -> classes */
const getPriorityClass = (priority: 1 | 2 | 3) => {
  switch (priority) {
    case 1:
      return "border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500";
    case 2:
      return "border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500";
    case 3:
      return "border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500";
    default:
      return "border-gray-500 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500";
  }
};

const Inbox: React.FC = () => {
  const updateTaskMutation = useUpdateTask();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // try to resolve inbox project id (from projects endpoint or fallback)
  const { inboxId, isLoading: loadingInboxResolve } = useInboxProjectId() as any;

  // fetch all non-completed tasks (we will filter client-side to the inbox projectId)
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks(undefined, false);

  // derive an inbox id from tasks if inboxId is not available:
  // choose the most common projectId among returned tasks
  const derivedInboxId = useMemo(() => {
    if (inboxId) return inboxId; // prefer resolved inboxId
    if (!allTasks || allTasks.length === 0) return undefined;
    const freq: Record<string, number> = {};
    for (const t of allTasks) {
      if (t.projectId) {
        freq[t.projectId] = (freq[t.projectId] || 0) + 1;
      }
    }
    const entries = Object.entries(freq);
    if (entries.length === 0) return undefined;
    entries.sort((a, b) => b[1] - a[1]); // most frequent first
    return entries[0][0];
  }, [inboxId, allTasks]);

  // which id to use for inbox view (resolved or derived)
  const inboxProjectIdToUse = inboxId ?? derivedInboxId;

  const isLoading = loadingInboxResolve || loadingTasks;

  // tasks for inbox view
  const inboxTasks: Task[] = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];
    if (!inboxProjectIdToUse) {
      // no resolved/derived id -> fallback: show tasks that have no projectId (rare with your backend)
      return allTasks.filter((t) => !t.projectId);
    }
    return allTasks.filter((t) => t.projectId === inboxProjectIdToUse);
  }, [allTasks, inboxProjectIdToUse]);

  // complete handler (Checkbox onCheckedChange provides boolean | 'indeterminate')
  const handleCheckedChange =
    (task: Task) => async (checked: boolean | "indeterminate") => {
      const isChecked = checked === true;
      if (!isChecked) return; // ignore un-check for now

      updateTaskMutation.mutate(
        { id: task._id, patch: { completed: true } },
        {
          onSuccess: () => {
            navigate("/completed");
          },
          onError: (err) => {
            console.error("Failed to mark task complete", err);
          },
        }
      );
    };

  if (isLoading) return <p>Loading...</p>;

  return (
    <>
      <main className=" p-10 lg:p-24">
        <div>
          <h1 className="text-2xl font-bold mx-6">Inbox</h1>
        </div>
        <div className="flex flex-1 w-full">
          {" "}
          {/* Centralized with max-width and auto margins */}
          {!inboxProjectIdToUse ? (
            // still render Add Task and helpful empty state if we couldn't resolve or derive an inbox id
            <div className="flex flex-1 w-full flex-col justify-center items-center text-center gap-2 h-full min-h-[calc(100vh-14rem)]">
              <div className="flex flex-col items-center">
                <img src={inboxImg} alt="Empty inbox" className="w-50" />
                <h3 className="text-sm">Capture now, plan later</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Inbox is your go-to spot for quick task entry. Clear your
                  mind now, organize when you’re ready.
                </p>
              </div>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <button className="bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm cursor-pointer hover:bg-[#c43b32]">
                    <IoMdAdd />
                    Add a task
                  </button>
                </DialogTrigger>
                <AddTaskModalContent onDone={() => setIsModalOpen(false)} projectId={inboxProjectIdToUse} />
              </Dialog>
            </div>
          ) : (
            <div className="w-full space-y-0">
              {inboxTasks.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No tasks in Inbox.
                </div>
              )}

              {inboxTasks.map((task: Task) => (
                <div
                  key={task._id}
                  className="flex items-start inbox-description gap-3 py-4 mx-9 border-b border-gray-300 last:border-b-0"
                >
                  <Checkbox
                    id={`task-${task._id}`}
                    checked={task.completed}
                    onCheckedChange={handleCheckedChange(task)}
                    className={`rounded-full w-5 h-5 mt-0.5 ${getPriorityClass(
                      task.priority as 1 | 2 | 3
                    )}`}
                  />
                  <div className={`${task.completed ? "line-through text-gray-400" : ""}`}>
                    <h2 className="text-sm">{task.title}</h2>
                    {task.dueDate && <p className="text-xs text-gray-400">{task.dueDate}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Inbox;




// import React, { useState } from 'react';
// import { useTasks } from '@/hooks/useTasks';
// import { IoMdAdd } from 'react-icons/io';
// import inboxImg from '../assets/freepik__assistant__10842.png'; // Renamed for clarity
// import { Checkbox } from '@/components/ui/checkbox';
// import { Dialog, DialogTrigger } from '@/components/ui/dialog';
// import { useInboxProjectId } from '@/hooks/useInboxProjectId';
// import type { Task } from '@/types/task';
// import AddTaskModalContent from '@/components/AddTaskModalContent';
// import { useUpdateTask } from '@/hooks/useUpdateTask';
// import { useNavigate } from 'react-router';

// // Helper to get priority-based classes for the checkbox (styled as circle with priority color)
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

// const Inbox = () => {
//   const updateTaskMutation = useUpdateTask();
//   const navigate = useNavigate();
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const { inboxId, isLoading: loadingInbox } = useInboxProjectId();
//   const { data: tasks = [], isLoading: loadingTasks } = useTasks(
//     inboxId,
//     false
//   );

//   if (loadingInbox || loadingTasks) return <p>Loading...</p>;

//   const handleCompleteTask =
//     (task: Task) => (checked: boolean | 'indeterminate') => {
//       const isChecked = checked === true;
//       if (!isChecked) return; // only respond to checking once

//       updateTaskMutation.mutate(
//         { id: task._id, patch: { completed: true } },
//         {
//           onSuccess: () => {
//             // after server confirms, push to completed page
//             navigate('/completed');
//           },
//           onError: (err) => {
//             console.error('Failed to mark task complete', err);
//           },
//         }
//       );
//     };

//   return (
//     <>
//       <main className=' p-10 lg:p-24'>
//         <div>
//           <h1 className='text-2xl font-bold mx-6'>Inbox</h1>
//         </div>
//         <div className='flex flex-1 w-full'>
//           {' '}
//           {/* Centralized with max-width and auto margins */}
//           {!inboxId ? (
//             <div className='flex flex-1 w-full flex-col justify-center items-center text-center gap-2 h-full min-h-[calc(100vh-14rem)]'>
//               <div className='flex flex-col items-center'>
//                 <img src={inboxImg} alt='Empty inbox' className='w-50' />
//                 <h3 className='text-sm'>Capture now, plan later</h3>
//                 <p className='text-sm text-gray-400 max-w-sm'>
//                   Inbox is your go-to spot for quick task entry. Clear your mind
//                   now, organize when you’re ready.
//                 </p>
//               </div>
//               <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//                 <DialogTrigger asChild>
//                   <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm cursor-pointer hover:bg-[#c43b32]'>
//                     <IoMdAdd />
//                     Add a task
//                   </button>
//                 </DialogTrigger>
//                 <AddTaskModalContent
//                   onDone={() => setIsModalOpen(false)}
//                   projectId={inboxId}
//                 />
//               </Dialog>
//             </div>
//           ) : (
//             <div className='w-full space-y-0'>
//               {' '}
//               {/* Container for tasks with no extra spacing */}
//               {tasks.map((task: Task) => (
//                 <div
//                   key={task._id}
//                   className='flex items-start inbox-description gap-3 py-4 mx-9 border-b border-gray-300 last:border-b-0' // Gray line separator between tasks
//                 >
//                   <Checkbox
//                     id={`task-${task._id}`}
//                     checked={task.completed}
//                     onCheckedChange={() => handleCompleteTask(task)}
//                     className={`rounded-full w-5 h-5 mt-0.5 ${getPriorityClass(
//                       task.priority
//                     )}`} // Styled as circle with priority color
//                   />
//                   <div
//                     className={`${
//                       task.completed ? 'line-through text-gray-400' : ''
//                     }`}
//                   >
//                     <h2 className='text-sm'>{task.title}</h2>
//                     {task.dueDate && (
//                       <p className='text-xs text-gray-400'>{task.dueDate}</p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </main>
//     </>
//   );
// };

// export default Inbox;

