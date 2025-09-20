import React, { useState } from 'react';
import tasksData from '../index.json'; // Assuming this is the correct path; update if it's '../index.json'
import { IoMdAdd } from 'react-icons/io';
import inboxImg from '../assets/sticker-dog-bed-white.png'; // Renamed for clarity
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import ModalContent from '@/components/AddTaskModalContent'; // We'll update this to handle adding tasks

// Define Task interface (based on earlier discussion; adjust if json structure differs)
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Priority 1' | 'Priority 2' | 'Priority 3' | 'None'; // Matching modal options
  // dueDate?: Date;
  completed: boolean;
  // Add dueDate?: Date; if present in json
}

// Helper to get priority-based classes for the checkbox (styled as circle with priority color)
const getPriorityClass = (priority: Task['priority']) => {
  switch (priority) {
    case 'Priority 1':
      return 'border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500';
    case 'Priority 2':
      return 'border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500';
    case 'Priority 3':
      return 'border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500';
    default:
      return 'border-gray-500 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500';
  }
};

const convertPriority = (priority: number | string): Task['priority'] => {
  switch (priority) {
    case 1:
    case '1':
    case 'Priority 1':
      return 'Priority 1';
    case 2:
    case '2':
    case 'Priority 2':
      return 'Priority 2';
    case 3:
    case '3':
    case 'Priority 3':
      return 'Priority 3';
    default:
      return 'None';
  }
};

const Inbox = () => {
  const [tasks, setTasks] = useState<Task[]>(
    tasksData.map((task) => ({
      ...task,
      id: String(task.id),
      priority: convertPriority(task.priority),
    }))
  ); // Ensure IDs are strings and priority matches type
  const [isModalOpen, setIsModalOpen] = useState(false); // To control modal if needed

  const handleCompleteTask = (id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: true } : task
      )
    );
  };

  const handleAddTask = (newTask: {
    title: string;
    description: string;
    priority: string;
    dueDate?: Date;
    project?: string;
  }) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      completed: false,
      priority: convertPriority(newTask.priority),
    };
    setTasks((prev) => [...prev, task]);
    setIsModalOpen(false);
  };

  return (
    <>
      <div>
        <h1 className='text-2xl font-bold mb-6'>Inbox</h1>
      </div>
      <main className='border-2 border-red-600 w-full max-w-full min-h-screen flex flex-col'>
        <div className='w-full'>
          {' '}
          {/* Centralized with max-width and auto margins */}
          {tasks.length === 0 ? (
            <div className='flex flex-col justify-center items-center text-center gap-2 h-full'>
              <div className='flex flex-col items-center'>
                <img src={inboxImg} alt='Empty inbox' className='w-50' />
                <h3 className='text-sm'>Capture now, plan later</h3>
                <p className='text-sm text-gray-400 max-w-sm'>
                  Inbox is your go-to spot for quick task entry. Clear your mind
                  now, organize when you’re ready.
                </p>
              </div>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm cursor-pointer hover:bg-[#c43b32]'>
                    <IoMdAdd />
                    Add a task
                  </button>
                </DialogTrigger>
                <ModalContent onAddTask={handleAddTask} />
              </Dialog>
            </div>
          ) : (
            <div className='w-full space-y-0'>
              {' '}
              {/* Container for tasks with no extra spacing */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className='flex items-start inbox-description gap-3 py-4 mx-9 border-b border-gray-300 last:border-b-0' // Gray line separator between tasks
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleCompleteTask(task.id)}
                    className={`rounded-full w-5 h-5 mt-0.5 ${getPriorityClass(
                      task.priority
                    )}`} // Styled as circle with priority color
                  />
                  <div
                    className={`${
                      task.completed ? 'line-through text-gray-400' : ''
                    }`}
                  >
                    <h2 className='text-sm'>{task.title}</h2>
                    {task.description && (
                      <p className='text-xs text-gray-400'>
                        {task.description}
                      </p>
                    )}
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

// import React from 'react';
// import inboxes from '../index.json';
// import { IoMdAdd } from 'react-icons/io';
// import inbox from '../assets/blocking-internet-icon.png';

// const Inbox = () => {
//   return (
//     <>
//       <main className=''>
//         <h1 className='text-2xl font-bold'>Inbox</h1>
//         <div>
//           {inboxes.length === 0 && (
//             <div className='flex flex-col items-center text-center mt-10 gap-2'>
//               <img src={inbox} alt='' className='w-52' />
//               <h3 className='text-sm'>Capture now, plan later</h3>
//               <p className='text-sm text-gray-400 max-w-sm'>
//                 Inbox is your go-to spot for quick task entry. Clear your mind
//                 now, organize when you’re ready.
//               </p>
//               <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm cursor-pointer hover:bg-[#c43b32]'>
//                 <IoMdAdd />
//                 Add a task
//               </button>
//             </div>
//           )}
//         </div>
//         {inboxes.map((inbox) => {
//           return (
//             <div className='flex gap-3.5 py-4' key={inbox.id}>
//               <div>
//                 <input type='radio' name='inbox' id={`inbox-${inbox.id}`} />
//               </div>
//               <div>
//                 <h2 className='text-sm'>{inbox.title}</h2>
//                 <p className='text-xs text-gray-400'>{inbox.description}</p>
//               </div>
//               <hr className='border-t border-gray-400' />
//             </div>
//           );
//         })}
//       </main>
//     </>
//   );
// };

// export default Inbox;
