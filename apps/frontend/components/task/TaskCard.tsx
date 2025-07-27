'use client';

import { memo } from 'react';
import { UserCircle, Timer } from 'lucide-react';
import { Task } from '@/lib/types/workflow';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';

interface Props {
  task: Task;
  level?: number;
}

function TaskCard({ task, level = 0 }: Props) {
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, level }
  });

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/task/${task.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      data-task-card
      className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-md border-l-4 border-blue-400 mb-3 select-none
        ${isDragging
          ? 'shadow-lg scale-105 opacity-90 cursor-grabbing'
          : 'shadow hover:shadow-md transition-all duration-200 cursor-grab hover:cursor-grab'
        }`}
      style={{
        transform: CSS.Transform.toString(transform),
        marginLeft: `${level * 12}px`,
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {task.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              {task.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-200 mt-2">
        <div className="flex items-center gap-1">
          <UserCircle size={14} />
          <span>Unassigned</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer size={14} />
          <span>~ Est. N/A</span>
        </div>
      </div>
    </div>
  );
}

export default memo(TaskCard);