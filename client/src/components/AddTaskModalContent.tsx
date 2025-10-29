import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { CiCalendarDate } from 'react-icons/ci';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { IoMdArrowDropdown } from 'react-icons/io';
import { Inbox, Folder } from 'lucide-react';
import { useCreateTask } from '@/hooks/useCreateTask';
import { useUpdateTask } from '@/hooks/useUpdateTask';
import type { Task, TaskPayload } from '@/types/task';
import { useNavigate } from 'react-router';
import { useInboxProjectId } from '@/hooks/useInboxProjectId';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// ✅ Schema updated: dueDate now required
const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.date({ required_error: 'Due date is required' }),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Props {
  onDone?: () => void;
  projectId?: string;
  task?: Task | null;
}

const AddTaskModalContent: React.FC<Props> = ({ onDone, projectId, task }) => {
  const isEditMode = Boolean(task);
  const navigate = useNavigate();

  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  const { projects = [], inboxId: resolvedInboxId } = useInboxProjectId();
  const [destination, setDestination] = useState<string | undefined>(projectId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: undefined,
    },
  });

  // Prefill form on edit
  useEffect(() => {
    if (task) {
      setValue('title', task.title || '');
      setValue('description', task.description || '');
      setValue('dueDate', task.dueDate ? new Date(task.dueDate) : undefined);
      setPriority(task.priority ?? 2);
      setDestination(task.projectId);
    } else if (!projectId && resolvedInboxId) {
      setDestination(resolvedInboxId);
    }
  }, [task, projectId, resolvedInboxId, setValue]);

  const onSubmit = (data: TaskFormData) => {
    const payload: TaskPayload = {
      ...data,
      dueDate: data.dueDate.toISOString(),
      projectId: destination,
      priority,
    };

    if (isEditMode && task) {
      updateTask(
        { id: task._id, patch: payload },
        {
          onSuccess: () => {
            toast.success('Task updated successfully!');
            if (onDone) onDone();
          },
          onError: () => toast.error('Failed to update task.'),
        }
      );
    } else {
      createTask(payload, {
        onSuccess: (res) => {
          if (res.ok) {
            toast.success('Task added successfully!');
            if (onDone) onDone();
            navigate('/');
          } else {
            toast.error('Failed to add task.');
          }
        },
        onError: () => toast.error('Network error. Please try again.'),
      });
    }
  };

  const selectedProjectName = destination
    ? projects.find((p: any) => (p._id ?? p.id) === destination)?.name ??
      (destination === resolvedInboxId ? 'Inbox' : 'Unknown')
    : 'Inbox';

  const isPending = isCreating || isUpdating;
  const selectedDate = getValues('dueDate');

  return (
    <DialogContent className='sm:max-w-[530px] top-18 !translate-y-3 left-1/2 -translate-x-1/2 font-todoist'>
      <form onSubmit={handleSubmit(onSubmit)} className='grid gap-4'>
        <div className='grid'>
          {/* Title */}
          <textarea
            {...register('title')}
            placeholder='Practice math problems daily at 4pm'
            className='w-full resize-none bg-transparent placeholder:text-[#b9b9b9] placeholder:font-medium placeholder:text-[16px] focus:outline-none text-[14px] font-todoistform leading-snug text-black'
            rows={2}
          />
          {errors.title && (
            <p className='text-xs text-red-500 mt-1'>{errors.title.message}</p>
          )}

          {/* Description */}
          <textarea
            {...register('description')}
            placeholder='Description'
            className='w-full resize-none bg-transparent placeholder:text-[#b9b9b9] focus:outline-none text-[13px] text-gray-600 font-todoist leading-snug'
            rows={2}
          />
          {errors.description && (
            <p className='text-xs text-red-500 mt-1'>
              {errors.description.message}
            </p>
          )}

          {/* Date & Priority */}
          <div className='leading-snug flex gap-2 mt-1'>
            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <DialogTrigger asChild>
                <button
                  type='button'
                  className={`cursor-pointer border flex items-center gap-1 px-2 py-[2px] rounded text-[13px] transition-colors ${
                    errors.dueDate
                      ? 'border-red-500 text-red-500'
                      : 'text-[#666666] hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <CiCalendarDate className='text-[20px] lg: text-lg' />
                  <span className='text-[10px]'>
                    {selectedDate
                      ? selectedDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Select date'}
                  </span>
                </button>
              </DialogTrigger>

              <DialogContent
                onInteractOutside={() => setIsCalendarOpen(false)}
                className='p-0 w-auto z-[9999] !max-w-max'
              >
                <div className='p-2'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={(day) => {
                      if (day)
                        setValue('dueDate', day, { shouldValidate: true });
                      setIsCalendarOpen(false);
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setValue('dueDate', undefined);
                      setIsCalendarOpen(false);
                    }}
                    className='w-full text-sm text-gray-500 p-2 hover:bg-gray-100'
                  >
                    Clear Date
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            {errors.dueDate && (
              <p className='lg:text-xs text-[10px] text-red-500 self-center'>
                {errors.dueDate.message}
              </p>
            )}

            {/* Priority */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className='cursor-pointer flex items-center gap-1 px-2 py-[2px] rounded border text-[#666666] text-[11px] hover:bg-gray-100 hover:text-black transition-colors'
                >
                  <span className='flex items-center gap-1'>
                    <span
                      className={`w-3 h-3 rounded-full ${
                        priority === 1
                          ? 'bg-red-500'
                          : priority === 2
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    Priority {priority}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[1, 2, 3].map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => setPriority(p as 1 | 2 | 3)}
                  >
                    <span
                      className={`w-3 h-3 rounded-full ${
                        p === 1
                          ? 'bg-red-500'
                          : p === 2
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      } mr-2`}
                    />
                    Priority {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <hr className='border-t border-gray-200 w-full' />

        {/* Footer */}
        <DialogFooter>
          <div className='flex justify-between w-full items-center'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className='cursor-pointer flex items-center py-1 rounded bg-transparent text-[#666666] text-[12px] font-medium hover:text-black hover:bg-gray-100 h-8'
                >
                  <Inbox className='h-4' />
                  {selectedProjectName}
                  <IoMdArrowDropdown className='h-4 w-4 pl-0.5 text-[#666666]' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {projects.map((project: any) => {
                  const id = project._id ?? project.id;
                  return (
                    <DropdownMenuItem
                      key={id}
                      onClick={() => setDestination(id)}
                    >
                      {project.name === 'Inbox' ? (
                        <Inbox className='h-4 w-4 mr-2' />
                      ) : (
                        <Folder className='h-4 w-4 mr-2' />
                      )}
                      {project.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className='flex gap-2'>
              <DialogClose asChild>
                <Button
                  variant='ghost'
                  type='button'
                  className='cursor-pointer text-[#666666] bg-gray-100 text-[13px] px-3 py-[px] h-8 font-medium'
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button
                type='submit'
                disabled={isPending}
                className='cursor-pointer bg-[#dc4c3e] text-white text-[13px] font-medium px-2 py-[px] h-8 rounded-md hover:bg-[#c43b32]'
              >
                {isPending
                  ? isEditMode
                    ? 'Updating...'
                    : 'Adding...'
                  : isEditMode
                  ? 'Update Task'
                  : 'Add Task'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default AddTaskModalContent;

// import React, { useEffect, useState } from 'react';
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogFooter,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Button } from './ui/button';
// import { CiCalendarDate } from 'react-icons/ci';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Calendar } from '@/components/ui/calendar';
// import { IoMdArrowDropdown } from "react-icons/io";
// import { Inbox, Folder } from 'lucide-react';
// import { useCreateTask } from '@/hooks/useCreateTask';
// import { useUpdateTask } from '@/hooks/useUpdateTask';
// import type { Task, TaskPayload } from '@/types/task';
// import { useNavigate } from 'react-router';
// import { useInboxProjectId } from '@/hooks/useInboxProjectId';

// interface Props {
//   onDone?: () => void;
//   projectId?: string;
//   task?: Task | null; // NEW: for edit mode
// }

// const AddTaskModalContent: React.FC<Props> = ({ onDone, projectId, task }) => {
//   const isEditMode = Boolean(task);

//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [date, setDate] = useState<Date | undefined>(undefined);
//   const [priority, setPriority] = useState<1 | 2 | 3>(2);
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
//   const navigate = useNavigate();

//   const { mutate: createTask, isPending: isCreating } = useCreateTask();
//   const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

//   const { projects = [], inboxId: resolvedInboxId } = useInboxProjectId();
//   const [destination, setDestination] = useState<string | undefined>(projectId);

//   useEffect(() => {
//     if (task) {
//       // Prefill for edit
//       setTitle(task.title || '');
//       setDescription(task.description || '');
//       setPriority(task.priority ?? 2);
//       setDate(task.dueDate ? new Date(task.dueDate) : undefined);
//       setDestination(task.projectId);
//     } else if (!projectId && resolvedInboxId) {
//       setDestination(resolvedInboxId);
//     }
//   }, [task, projectId, resolvedInboxId]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!title.trim()) return;

//     const payload: TaskPayload = {
//       title,
//       description,
//       dueDate: date ? date.toISOString() : undefined,
//       projectId: destination,
//       priority,
//     };

//     if (isEditMode && task) {
//       updateTask(
//         { id: task._id, patch: payload },
//         {
//           onSuccess: () => {
//             if (onDone) onDone();
//           },
//         }
//       );
//     } else {
//       createTask(payload, {
//         onSuccess: (res) => {
//           if (res.ok && onDone) onDone();
//           navigate('/');
//         },
//       });
//     }
//   };

//   const selectedProjectName = destination
//     ? projects.find((p: any) => (p._id ?? p.id) === destination)?.name ??
//       (destination === resolvedInboxId ? 'Inbox' : 'Unknown')
//     : 'Inbox';

//   const isPending = isCreating || isUpdating;

//   return (
//     <DialogContent className='sm:max-w-[530px] top-18 !translate-y-3 left-1/2 -translate-x-1/2 font-todoist'>
//       <form onSubmit={handleSubmit} className='grid gap-4'>
//         <div className='grid'>
//           <textarea
//             placeholder='Practice math problems daily at 4pm'
//             className='w-full resize-none bg-transparent placeholder:text-[#b9b9b9] placeholder:font-medium placeholder:text-[16px] focus:outline-none text-[14px] font-todoistform leading-snug text-black'
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             rows={2}
//           />
//           <textarea
//             placeholder='Description'
//             className='w-full resize-none bg-transparent placeholder:text-[#b9b9b9] focus:outline-none text-[13px] text-gray-600 font-todoist leading-snug'
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             rows={2}
//           />
//           {/* Date & Priority */}
//           <div className='leading-snug flex gap-2'>
//             <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//               <DialogTrigger asChild>
//                 <button
//                   type='button'
//                   className='cursor-pointer border flex items-center gap-1 px-1 py-[px] rounded text-[#666666] text-[13px] hover:bg-gray-100 hover:text-black transition-colors'
//                 >
//                   <CiCalendarDate className='text-lg' />
//                   <span className=''>
//                     {date
//                       ? date.toLocaleDateString('en-US', {
//                           weekday: 'short',
//                           month: 'short',
//                           day: 'numeric',
//                         })
//                       : 'Date'}
//                   </span>
//                 </button>
//               </DialogTrigger>

//               <DialogContent
//                 onInteractOutside={() => setIsCalendarOpen(false)}
//                 className='p-0 w-auto z-[9999] !max-w-max'
//               >
//                 <div className='p-2'>
//                   <Calendar
//                     mode='single'
//                     selected={date}
//                     onSelect={(day) => {
//                       setDate(day);
//                       setIsCalendarOpen(false);
//                     }}
//                   />
//                   <button
//                     type='button'
//                     onClick={() => {
//                       setDate(undefined);
//                       setIsCalendarOpen(false);
//                     }}
//                     className='w-full text-sm text-gray-500 p-2 hover:bg-gray-100'
//                   >
//                     Clear Date
//                   </button>
//                 </div>
//               </DialogContent>
//             </Dialog>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button
//                   type='button'
//                   className='cursor-pointer flex items-center gap-1 px-2 py-[2px] rounded border text-[#666666] text-[13px] hover:bg-gray-100 hover:text-black transition-colors'
//                 >
//                   <span className='flex items-center gap-1'>
//                     <span
//                       className={`w-3 h-3 rounded-full ${
//                         priority === 1
//                           ? 'bg-red-500'
//                           : priority === 2
//                           ? 'bg-yellow-500'
//                           : 'bg-blue-500'
//                       }`}
//                     />
//                     Priority {priority}
//                   </span>
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent>
//                 {[1, 2, 3].map((p) => (
//                   <DropdownMenuItem
//                     key={p}
//                     onClick={() => setPriority(p as 1 | 2 | 3)}
//                   >
//                     <span
//                       className={`w-3 h-3 rounded-full ${
//                         p === 1
//                           ? 'bg-red-500'
//                           : p === 2
//                           ? 'bg-yellow-500'
//                           : 'bg-blue-500'
//                       } mr-2`}
//                     />
//                     Priority {p}
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>

//         <hr className='border-t border-gray-200 w-full' />

//         {/* Footer */}
//         <DialogFooter>
//           <div className='flex justify-between w-full items-center'>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button
//                   type='button'
//                   className='cursor-pointer flex items-center py-1 rounded bg-transparent text-[#666666] text-[12px] font-medium hover:text-black hover:bg-gray-100 h-8'
//                 >
//                   <Inbox className='h-4' />
//                   {selectedProjectName}
//                   <IoMdArrowDropdown
//                     className={`h-4 w-4 pl-0.5 text-[#666666] transition-transform ${
//                       destination ? 'rotate-180' : ''
//                     }`}
//                   />
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent>
//                 {projects.map((project: any) => {
//                   const id = project._id ?? project.id;
//                   return (
//                     <DropdownMenuItem
//                       key={id}
//                       onClick={() => setDestination(id)}
//                     >
//                       {project.name === 'Inbox' ? (
//                         <Inbox className='h-4 w-4 mr-2' />
//                       ) : (
//                         <Folder className='h-4 w-4 mr-2' />
//                       )}
//                       {project.name}
//                     </DropdownMenuItem>
//                   );
//                 })}
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <div className='flex gap-2'>
//               <DialogClose asChild>
//                 <Button
//                   variant='ghost'
//                   type='button'
//                   className='cursor-pointer text-[#666666] bg-gray-100 hover:bg-gray text-[13px] px-3 py-[px] h-8 font-medium'
//                 >
//                   Cancel
//                 </Button>
//               </DialogClose>

//               <Button
//                 type='submit'
//                 disabled={isPending || !title.trim()}
//                 className='cursor-pointer bg-[#dc4c3e] text-white text-[13px] font-medium px-2 py-[px] h-8 rounded-md hover:bg-[#c43b32]'
//               >
//                 {isPending
//                   ? isEditMode
//                     ? 'Updating...'
//                     : 'Adding...'
//                   : isEditMode
//                   ? 'Update Task'
//                   : 'Add Task'}
//               </Button>
//             </div>
//           </div>
//         </DialogFooter>
//       </form>
//     </DialogContent>
//   );
// };

// export default AddTaskModalContent;
