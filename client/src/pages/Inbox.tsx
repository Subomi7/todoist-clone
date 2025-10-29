import React, { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { IoMdAdd } from 'react-icons/io';
import inboxImg from '../assets/freepik__assistant__10842.png';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useInboxProjectId } from '@/hooks/useInboxProjectId';
import type { Task } from '@/types/task';
import AddTaskModalContent from '@/components/AddTaskModalContent';
import { useUpdateTask } from '@/hooks/useUpdateTask';
import { useNavigate } from 'react-router';
import { RiEdit2Line } from 'react-icons/ri';
import { MdDeleteOutline } from 'react-icons/md';
import { useDeleteTask } from '@/hooks/useDeleteTask';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CiCalendarDate } from 'react-icons/ci';
import { FaPlusCircle } from 'react-icons/fa';
import { useSidebar } from '@/components/ui/sidebar';

/** priority -> classes */
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

const Inbox: React.FC = () => {
  const sidebar = useSidebar(); // ✅ Get sidebar context
  const isMobile = sidebar.isMobile;
  const updateTaskMutation = useUpdateTask();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const { mutate: deleteTask, isPending } = useDeleteTask();
  const { inboxId, isLoading: loadingInboxResolve } =
    useInboxProjectId() as any;
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks(
    undefined,
    false
  );

  const derivedInboxId = useMemo(() => {
    if (inboxId) return inboxId;
    if (!allTasks || allTasks.length === 0) return undefined;
    const freq: Record<string, number> = {};
    for (const t of allTasks) {
      if (t.projectId) freq[t.projectId] = (freq[t.projectId] || 0) + 1;
    }
    const entries = Object.entries(freq);
    if (entries.length === 0) return undefined;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [inboxId, allTasks]);

  const inboxProjectIdToUse = inboxId ?? derivedInboxId;
  const isLoading = loadingInboxResolve || loadingTasks;

  const inboxTasks: Task[] = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];
    if (!inboxProjectIdToUse) return allTasks.filter((t) => !t.projectId);
    return allTasks.filter((t) => t.projectId === inboxProjectIdToUse);
  }, [allTasks, inboxProjectIdToUse]);

  const handleCheckedChange =
    (task: Task) => async (checked: boolean | 'indeterminate') => {
      if (checked !== true) return;
      updateTaskMutation.mutate(
        { id: task._id, patch: { completed: true } },
        { onSuccess: () => navigate('/completed') }
      );
    };

  const handleDeleteClick = (id: string) => {
    setSelectedTaskId(id);
    setConfirmOpen(true);
  };

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

  if (isLoading)
    return (
      <div className='flex flex-col items-center justify-center space-y-3 pt-16'>
        <Skeleton className='h-[125px] w-full rounded-xl' />
        <div className='space-y-2'>
          <Skeleton className='h-7 w-full' />
          <Skeleton className='h-4 w-full' />
        </div>
      </div>
    );

  const handleAddTaskDone = () => {
    if (isMobile) sidebar.setOpenMobile(false); // ✅ Close sidebar after adding
  };

  return (
    <>
      <main className='p-10 lg:p-24'>
        <div>
          <h1 className='text-2xl font-bold mx-6'>Inbox</h1>
        </div>
        <div className='flex flex-1 w-full'>
          {inboxTasks.length === 0 ? (
            <div className='flex flex-1 w-full flex-col justify-center items-center text-center gap-2 h-full min-h-[calc(100vh-14rem)]'>
              {inboxTasks.length === 0 && (
                <div className='flex flex-col items-center'>
                  <div className='flex flex-col items-center'>
                    <img src={inboxImg} alt='Empty inbox' className='w-50' />
                    <h3 className='text-sm'>Capture now, plan later</h3>
                    <p className='text-sm text-gray-400 max-w-sm'>
                      Inbox is your go-to spot for quick task entry. Clear your
                      mind now, organize when you’re ready.
                    </p>
                  </div>

                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <button className='bg-[#dc4c3e] rounded-lg text-white px-3 py-2 flex items-center gap-2 mt-3 text-sm cursor-pointer hover:bg-[#c43b32]'>
                        <IoMdAdd />
                        Add a task
                      </button>
                    </DialogTrigger>
                    <AddTaskModalContent
                      onDone={() => setIsModalOpen(false)}
                      projectId={inboxProjectIdToUse}
                    />
                  </Dialog>
                </div>
              )}
            </div>
          ) : (
            <div className='w-full space-y-0'>
              {inboxTasks.map((task: Task) => (
                <div
                  key={task._id}
                  className='flex items-center justify-between inbox-description gap-3 border-b border-gray-300 last:border-b-0'
                >
                  <div className='flex items-start inbox-description gap-3 py-4 lg:mx-9'>
                    <Checkbox
                      id={`task-${task._id}`}
                      checked={task.completed}
                      onCheckedChange={handleCheckedChange(task)}
                      className={`cursor-pointer rounded-full w-5 h-5 mt-0.5 ${getPriorityClass(
                        task.priority as 1 | 2 | 3
                      )}`}
                    />
                    <div>
                      <h2 className='text-[13px]'>{task.title}</h2>
                      <h3 className='text-[11px] text-[#757474]'>
                        {task.description}
                      </h3>
                      <span className='flex items-center text-[12px] text-[#b81f00]'>
                        <CiCalendarDate />
                        <span>
                          {task.dueDate && (
                            <p className='text-[11px] text-[#b81f00]'>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-4'>
                    <RiEdit2Line
                      className='cursor-pointer text-xl'
                      onClick={() => {
                        setEditTask(task);
                        setIsEditModalOpen(true);
                      }}
                    />
                    <button
                      onClick={() => handleDeleteClick(task._id)}
                      disabled={isPending}
                    >
                      <MdDeleteOutline className='text-red-600 cursor-pointer text-xl' />
                    </button>
                  </div>
                </div>
              ))}
              <Dialog open={open} onOpenChange={setOpen}>
                <form>
                  <DialogTrigger asChild>
                    <button className='flex items-center gap-2.5 py-2 rounded-md text-[#dc4c3e] w-full cursor-pointer font-semibold text-[13.5px] font-todoist'>
                      <FaPlusCircle className='h-4.5 w-5' />
                      <span className='text-[#757474]'>Add task</span>
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
            </div>
          )}
        </div>
      </main>

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
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✏️ Edit Task Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {editTask && (
          <AddTaskModalContent
            task={editTask}
            onDone={() => {
              setIsEditModalOpen(false);
              setEditTask(null);
            }}
            projectId={editTask.projectId}
          />
        )}
      </Dialog>
    </>
  );
};

export default Inbox;
