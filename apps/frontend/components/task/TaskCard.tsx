'use client';

import { useRef, useState, memo } from 'react';
import { UserCircle, Timer } from 'lucide-react';
import { Task } from '@/lib/types/workflow';
import { useDraggable } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';

interface Props {
  task: Task;
  level?: number;
}

function TaskCard({ task, level = 0 }: Props) {
  const router = useRouter();
  const [isDragStart, setIsDragStart] = useState(false);
  const dragStartTimeRef = useRef<number>(0);
  const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task, level },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragStart(true);
    dragStartTimeRef.current = Date.now();
    dragStartPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const timeDiff = Date.now() - dragStartTimeRef.current;
    const distanceMoved = Math.sqrt(
      Math.pow(e.clientX - dragStartPositionRef.current.x, 2) +
      Math.pow(e.clientY - dragStartPositionRef.current.y, 2)
    );

    if (timeDiff < 200 && distanceMoved < 5 && !isDragging) {
      handleClick();
    }

    setIsDragStart(false);
  };

  const handleClick = () => {
    router.push(`/task/${task.id}`);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging || isDragStart) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-task-card
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-md border-l-4 border-blue-400 mb-3 ${isDragging ? 'shadow-none' : 'shadow transition'}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        marginLeft: `${level * 12}px`,
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-start gap-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {task.title}
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

export default memo(TaskCard);
