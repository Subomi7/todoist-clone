import React, { useState } from 'react';
import {
  DialogClose,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { CiCalendarDate, CiFlag1 } from 'react-icons/ci';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Inbox, Folder } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCreateTask } from '@/hooks/useCreateTask';
import type { TaskPayload } from '@/types/task';

const AddTaskModalContent: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [destination, setDestination] = useState<string>('Inbox');
  const [priority, setPriority] = useState<1 | 2 | 3>(2); // default medium

  const navigate = useNavigate();
  const { mutate: createTask, isPending } = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/auth/login');
      return;
    }

    const newTask: TaskPayload = {
      title,
      description,
      dueDate: date ? date.toISOString() : undefined,
      projectId: destination === 'Inbox' ? undefined : destination,
      priority,
    };

    createTask(newTask, {
      onSuccess: (res) => {
        if (res.ok) {
          console.log('Task created:', res.data);
          // reset form
          setTitle('');
          setDescription('');
          setDate(undefined);
          setPriority(2);
          setDestination('Inbox');
        } else {
          console.error('Task create failed:', res.message);
        }
      },
    });
  };

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
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]"
              >
                <CiCalendarDate className="text-xl" />
                <span>{date ? date.toDateString() : 'Date'}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          {/* Priority Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer border text-sm px-2 py-1 rounded flex items-center gap-1 text-[#8a8a8a]"
              >
                <CiFlag1 className="text-xl" />
                <span>Priority {priority}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPriority(1)}>
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                Priority 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriority(2)}>
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                Priority 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriority(3)}>
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                Priority 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <hr className="border-t border-gray-300 my-4" />

        <DialogFooter>
          <div className="flex justify-between w-full items-center">
            {/* Inbox Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1 rounded bg-transparent text-[#8a8a8a] cursor-pointer"
                >
                  <Inbox className="h-4 w-4" />
                  {destination}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setDestination('Inbox')}>
                  <Inbox className="h-4 w-4 mr-2" /> Inbox
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDestination('Work')}>
                  <Folder className="h-4 w-4 mr-2" /> Work
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDestination('Personal')}>
                  <Folder className="h-4 w-4 mr-2" /> Personal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex gap-2">
              <DialogClose asChild className="p-4 text-[#8a8a8a] cursor-pointer">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending || !title.trim()}
                className="bg-[#dc4c3e] text-white cursor-pointer"
              >
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
