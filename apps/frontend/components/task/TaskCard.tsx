'use client';

import { useState } from 'react';
import { UserCircle, Timer, GripVertical } from 'lucide-react';
import { Task } from '@/lib/types/workflow';
import { useDraggable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';

interface Props {
  task: Task;
  level?: number;
}

export default function TaskCard({ task, level = 0 }: Props) {
  const router = useRouter();
  const displayStatus = task.status;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, level },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
        opacity: isDragging ? 0.5 : 1,
        marginLeft: `${level * 12}px`,
        cursor: 'pointer',
      }}
      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-md shadow border-l-4 border-blue-400 transition mb-3"
      onClick={() => router.push(`/task/${task.id}`)}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-start gap-2">
          {/* Drag handle only here */}
          <span
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white mt-1"
          >
            <GripVertical size={16} />
          </span>
          <div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {task.title}
              <span className="ml-2 text-xs font-semibold text-blue-400 dark:text-blue-300">
                ({displayStatus})
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-300">{task.description}</p>
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
