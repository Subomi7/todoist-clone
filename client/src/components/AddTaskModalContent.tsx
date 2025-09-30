import React, { useEffect, useState } from 'react';
import {
  DialogClose,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { CiCalendarDate } from 'react-icons/ci';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Inbox, Folder } from 'lucide-react';
import { useCreateTask } from '@/hooks/useCreateTask';
import { useProjects } from '@/hooks/useProjects';
import type { TaskPayload } from '@/types/task';
import { useNavigate } from 'react-router';

interface Props {
  onDone?: () => void; // parent can pass setIsModalOpen(false)
  projectId?: string; // parent-supplied inbox project id (optional)
}

const AddTaskModalContent: React.FC<Props> = ({ onDone, projectId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<1 | 2 | 3>(2); // default medium
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const navigate = useNavigate();
  const { mutate: createTask, isPending } = useCreateTask();

  // projects + resolved inboxId from hook
  const { projects = [], inboxId: resolvedInboxId } = useProjects();

  // destination holds the selected project's id (use _id or id based on API)
  // default to parent projectId if provided (Sidebar passes inboxId) else resolvedInboxId
  const [destination, setDestination] = useState<string | undefined>(
    projectId ?? undefined
  );

  // When projects or resolvedInboxId load, if no projectId was passed in,
  // default destination to the real inbox project id.
  useEffect(() => {
    if (!projectId && resolvedInboxId) {
      setDestination(resolvedInboxId);
    }
    // we intentionally watch projectId and resolvedInboxId only
  }, [projectId, resolvedInboxId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskPayload = {
      title,
      description,
      dueDate: date ? date.toISOString() : undefined,
      // If destination is set, send that id; otherwise omit projectId to let backend
      // assign automatically (but we prefer explicit inbox id when available).
      ...(destination ? { projectId: destination } : {}),
      priority,
    };

    createTask(newTask, {
      onSuccess: (res) => {
        if (res.ok) {
          if (onDone) onDone();
          navigate('/'); // show inbox
        } else {
          console.error('Task create failed:', res.message);
        }
      },
      onError: (err) => {
        console.error('createTask error', err);
      },
    });
  };

  // Helper to show the name of the currently selected project
  const selectedProjectName =
    destination
      ? (projects.find((p: any) => (p._id ?? p.id) === destination)?.name ??
         (destination === resolvedInboxId ? 'Inbox' : 'Unknown'))
      : 'Select project';

  return (
    <DialogContent className="sm:max-w-[530px] top-18 !translate-y-3 left-1/2 -translate-x-1/2">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-3">
          <Input
            placeholder="Organize family photos Sunday p3"
            className="border-none outline-none focus:ring-0 w-10/12"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Description"
            className="border-none outline-none h-6 w-9/12"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {/* Date Picker using Popover */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]"
                aria-label="Select due date"
              >
                <CiCalendarDate className="text-xl" />
                <span>
                  {date
                    ? date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Date'}
                </span>
              </button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-auto z-[1000]">
              <div className="p-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => {
                    setDate(day);
                    setIsCalendarOpen(false);
                  }}
                  defaultMonth={date ?? new Date()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setDate(undefined);
                    setIsCalendarOpen(false);
                  }}
                  className="w-full text-sm text-gray-500 p-2 hover:bg-gray-100"
                >
                  Clear Date
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Priority Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]"
              >
                <span className="flex items-center gap-1">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      priority === 1 ? 'bg-red-500' : priority === 2 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                  />
                  Priority {priority}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPriority(1)}>
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                Priority 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriority(2)}>
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                Priority 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriority(3)}>
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                Priority 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <hr className="border-t border-gray-300 my-4" />

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            {/* Project select: list actual projects from the API (Inbox should be included there) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1 rounded bg-transparent text-[#8a8a8a] cursor-pointer"
                >
                  {selectedProjectName}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                {projects.map((project: any) => {
                  const id = project._id ?? project.id;
                  return (
                    <DropdownMenuItem key={id} onClick={() => setDestination(id)}>
                      {project.name === 'Inbox' ? <Inbox className="h-4 w-4 mr-2" /> : <Folder className="h-4 w-4 mr-2" />}
                      {project.name}
                    </DropdownMenuItem>
                  );
                })}
                {/* allow explicit "Inbox" if resolvedInboxId exists but not present in returned projects */}
                {!projects.some((p) => (p._id ?? p.id) === resolvedInboxId) && resolvedInboxId && (
                  <DropdownMenuItem onClick={() => setDestination(resolvedInboxId)}>
                    <Inbox className="h-4 w-4 mr-2" />
                    Inbox
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex gap-2">
              <DialogClose asChild className="p-4 text-[#8a8a8a] cursor-pointer">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={isPending || !title.trim()} className="bg-[#dc4c3e] text-white cursor-pointer">
                {isPending ? 'Adding...' : 'Add task'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default AddTaskModalContent;


// import React, { useState } from 'react';
// import {
//   DialogClose,
//   DialogContent,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Button } from './ui/button';
// import { CiCalendarDate } from 'react-icons/ci';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Calendar } from '@/components/ui/calendar';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from '@/components/ui/popover';
// import { Inbox, Folder } from 'lucide-react';
// import { useCreateTask } from '@/hooks/useCreateTask';
// import { useProjects } from '@/hooks/useProjects';
// import type { TaskPayload } from '@/types/task';
// import { useNavigate } from 'react-router';

// interface Props {
//   onDone?: () => void; // parent can pass setIsModalOpen(false)
//   projectId?: string;
// }

// const AddTaskModalContent: React.FC<Props> = ({ onDone, projectId }) => {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [date, setDate] = useState<Date | undefined>(undefined);
//   const [priority, setPriority] = useState<1 | 2 | 3>(2); // default medium
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);

//   const navigate = useNavigate();
//   // destructure isLoading as isPending so your UI prop name remains the same
//   const { mutate: createTask, isPending } = useCreateTask();
//   const { projects } = useProjects();
//   const inboxProject = projects.find((p) => p.name === 'Inbox');
//   const [destination, setDestination] = useState<string | undefined>(inboxProject?._id);
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title.trim()) return;

//     const newTask: TaskPayload = {
//       title,
//       description,
//       dueDate: date ? date.toISOString() : undefined,
//       // if destination is Inbox use the real inbox projectId passed by parent
//       projectId: destination ?? projectId,
//       priority,
//     };

//     createTask(newTask, {
//       onSuccess: (res) => {
//         if (res.ok) {
//           // close modal (parent controls it)
//           if (onDone) onDone();
//           // navigate to inbox so user sees the item (optional)
//           navigate('/');
//         } else {
//           console.error('Task create failed:', res.message);
//         }
//       },
//       onError: (err) => {
//         console.error('createTask error', err);
//       },
//     });
//   };

//   return (
//     <DialogContent className='sm:max-w-[530px] top-18 !translate-y-3 left-1/2 -translate-x-1/2'>
//       <form onSubmit={handleSubmit} className='grid gap-4'>
//         <div className='grid gap-3'>
//           <Input
//             placeholder='Organize family photos Sunday p3'
//             className='border-none outline-none focus:ring-0 w-10/12'
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//           />
//           <Input
//             placeholder='Description'
//             className='border-none outline-none h-6 w-9/12'
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />
//         </div>

//         <div className='flex gap-2'>
//           {/* Date Picker using Popover (content-only component - parent dialog still handles modal) */}
//           <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//             <PopoverTrigger asChild>
//               <button
//                 type='button'
//                 className='cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]'
//                 aria-label='Select due date'
//               >
//                 <CiCalendarDate className='text-xl' />
//                 <span>
//                   {date
//                     ? date.toLocaleDateString('en-US', {
//                         weekday: 'short',
//                         month: 'short',
//                         day: 'numeric',
//                       })
//                     : 'Date'}
//                 </span>
//               </button>
//             </PopoverTrigger>

//             <PopoverContent className='p-0 w-auto z-[1000]'>
//               <div className='p-2'>
//                 <Calendar
//                   mode='single'
//                   selected={date}
//                   onSelect={(day) => {
//                     setDate(day);
//                     setIsCalendarOpen(false); // close popover after selection
//                   }}
//                   defaultMonth={date ?? new Date()}
//                   autoFocus
//                 />
//                 <button
//                   type='button'
//                   onClick={() => {
//                     setDate(undefined);
//                     setIsCalendarOpen(false);
//                   }}
//                   className='w-full text-sm text-gray-500 p-2 hover:bg-gray-100'
//                 >
//                   Clear Date
//                 </button>
//               </div>
//             </PopoverContent>
//           </Popover>

//           {/* Priority Dropdown */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <button
//                 type='button'
//                 className='cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]'
//               >
//                 <span className='flex items-center gap-1'>
//                   <span
//                     className={`w-3 h-3 rounded-full ${
//                       priority === 1
//                         ? 'bg-red-500'
//                         : priority === 2
//                         ? 'bg-yellow-500'
//                         : 'bg-blue-500'
//                     }`}
//                   />
//                   Priority {priority}
//                 </span>
//               </button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               <DropdownMenuItem onClick={() => setPriority(1)}>
//                 <span className='w-3 h-3 rounded-full bg-red-500 mr-2' />
//                 Priority 1
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setPriority(2)}>
//                 <span className='w-3 h-3 rounded-full bg-yellow-500 mr-2' />
//                 Priority 2
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setPriority(3)}>
//                 <span className='w-3 h-3 rounded-full bg-blue-500 mr-2' />
//                 Priority 3
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>

//         <hr className='border-t border-gray-300 my-4' />

//         <DialogFooter>
//           <div className='flex justify-between w-full items-center'>
//             {/* Inbox / Project Dropdown (this is still mocked — replace with real project list later) */}
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button
//                   type='button'
//                   className='flex items-center gap-2 px-3 py-1 rounded bg-transparent text-[#8a8a8a] cursor-pointer'
//                 >
//                   {/* <Inbox className='h-4 w-4' /> */}
//                   {destination
//                     ? projects.find((p) => p._id === destination)?.name
//                     : 'Select Project'}
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent>
//                 {projects.map((project) => (
//                   <DropdownMenuItem
//                     key={project._id}
//                     onClick={() => setDestination(project._id)}
//                   >
//                     {project.name === 'Inbox' ? (
//                       <Inbox className='h-4 w-4 mr-2' />
//                     ) : (
//                       <Folder className='h-4 w-4 mr-2' />
//                     )}
//                     {project.name}
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <div className='flex gap-2'>
//               <DialogClose
//                 asChild
//                 className='p-4 text-[#8a8a8a] cursor-pointer'
//               >
//                 <Button variant='outline' type='button'>
//                   Cancel
//                 </Button>
//               </DialogClose>

//               <Button
//                 type='submit'
//                 disabled={isPending || !title.trim()}
//                 className='bg-[#dc4c3e] text-white cursor-pointer'
//               >
//                 {isPending ? 'Adding...' : 'Add task'}
//               </Button>
//             </div>
//           </div>
//         </DialogFooter>
//       </form>
//     </DialogContent>
//   );
// };

// export default AddTaskModalContent;

// import React, { useState } from 'react';
// import {
//   DialogClose,
//   DialogContent,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Button } from './ui/button';
// import { CiCalendarDate } from 'react-icons/ci';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Calendar } from '@/components/ui/calendar';
// import { Inbox, Folder } from 'lucide-react';
// import { useCreateTask } from '@/hooks/useCreateTask';
// import type { TaskPayload } from '@/types/task';
// import { useNavigate } from 'react-router';

// interface Props {
//   onDone?: () => void; // parent can pass setIsModalOpen(false)
//   projectId?: string;
// }

// const AddTaskModalContent: React.FC<Props> = ({ onDone, projectId }) => {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [date, setDate] = useState<Date | undefined>(undefined);
//   const [destination, setDestination] = useState<string>('Inbox');
//   const [priority, setPriority] = useState<1 | 2 | 3>(2); // default medium
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);

//   const navigate = useNavigate();
//   const { mutate: createTask, isPending } = useCreateTask();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title.trim()) return;

//     const newTask: TaskPayload = {
//       title,
//       description,
//       dueDate: date ? date.toISOString() : undefined,
//       projectId: destination === 'Inbox' ? projectId : destination,
//       priority,
//     };

//     createTask(newTask, {
//       onSuccess: (res) => {
//         if (res.ok) {
//           if (onDone) onDone();
//           navigate('/');
//         } else {
//           console.error('Task create failed:', res.message);
//         }
//       },
//     });
//   };

//   return (
//     <DialogContent className='sm:max-w-[530px] top-18 !translate-y-3 left-1/2 -translate-x-1/2'>
//       <form onSubmit={handleSubmit} className='grid gap-4'>
//         <div className='grid gap-3'>
//           <Input
//             placeholder='Organize family photos Sunday p3'
//             className='border-none outline-none focus:ring-0 w-10/12'
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//           />
//           <Input
//             placeholder='Description'
//             className='border-none outline-none h-6 w-9/12'
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />
//         </div>

//         <div className='flex gap-2'>
//           {/* Date Picker */}
//           <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//             <DialogTrigger asChild>
//               <button
//                 type='button'
//                 className='cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]'
//                 aria-label='Select due date'
//               >
//                 <CiCalendarDate className='text-xl' />
//                 <span>
//                   {date
//                     ? date.toLocaleDateString('en-US', {
//                         weekday: 'short',
//                         month: 'short',
//                         day: 'numeric',
//                       })
//                     : 'Date'}
//                 </span>
//               </button>
//             </DialogTrigger>
//             <DialogContent
//               className='p-4 w-auto'
//               // onInteractOutside={(e) => e.preventDefault()}
//               // onPointerDownOutside={(e) => e.preventDefault()}
//             >
//               <Calendar
//                 mode='single'
//                 selected={date}
//                 onSelect={(day) => {
//                   setDate(day);
//                   setIsCalendarOpen(false); // ✅ close after selection
//                 }}
//                 defaultMonth={date ?? new Date()}
//                 autoFocus
//               />
//               <button
//                 type='button'
//                 onClick={() => setDate(undefined)}
//                 className='w-full text-sm text-gray-500 p-2 hover:bg-gray-100'
//               >
//                 Clear Date
//               </button>
//             </DialogContent>
//           </Dialog>

//           {/* Priority Dropdown */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <button
//                 type='button'
//                 className='cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]'
//               >
//                 <span className='flex items-center gap-1'>
//                   <span
//                     className={`w-3 h-3 rounded-full ${
//                       priority === 1
//                         ? 'bg-red-500'
//                         : priority === 2
//                         ? 'bg-yellow-500'
//                         : 'bg-blue-500'
//                     }`}
//                   />
//                   Priority {priority}
//                 </span>
//               </button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent>
//               <DropdownMenuItem onClick={() => setPriority(1)}>
//                 <span className='w-3 h-3 rounded-full bg-red-500 mr-2'></span>
//                 Priority 1
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setPriority(2)}>
//                 <span className='w-3 h-3 rounded-full bg-yellow-500 mr-2'></span>
//                 Priority 2
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={() => setPriority(3)}>
//                 <span className='w-3 h-3 rounded-full bg-blue-500 mr-2'></span>
//                 Priority 3
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>

//         <hr className='border-t border-gray-300 my-4' />

//         <DialogFooter>
//           <div className='flex justify-between w-full items-center'>
//             {/* Inbox Dropdown */}
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button
//                   type='button'
//                   className='flex items-center gap-2 px-3 py-1 rounded bg-transparent text-[#8a8a8a] cursor-pointer'
//                 >
//                   <Inbox className='h-4 w-4' />
//                   {destination}
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent>
//                 <DropdownMenuItem onClick={() => setDestination('Inbox')}>
//                   <Inbox className='h-4 w-4 mr-2' /> Inbox
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setDestination('Work')}>
//                   <Folder className='h-4 w-4 mr-2' /> Work
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={() => setDestination('Personal')}>
//                   <Folder className='h-4 w-4 mr-2' /> Personal
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <div className='flex gap-2'>
//               <DialogClose
//                 asChild
//                 className='p-4 text-[#8a8a8a] cursor-pointer'
//               >
//                 <Button variant='outline' type='button'>
//                   Cancel
//                 </Button>
//               </DialogClose>
//               <Button
//                 type='submit'
//                 disabled={isPending || !title.trim()}
//                 className='bg-[#dc4c3e] text-white cursor-pointer'
//               >
//                 {isPending ? 'Adding...' : 'Add task'}
//               </Button>
//             </div>
//           </div>
//         </DialogFooter>
//       </form>
//     </DialogContent>
//   );
// };

// export default AddTaskModalContent;
