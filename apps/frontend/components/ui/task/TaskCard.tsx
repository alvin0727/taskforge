'use client';

import { memo } from 'react';
import { UserCircle, Timer, Calendar } from 'lucide-react';
import { Task } from '@/lib/types/task';
import { useRouter } from 'next/navigation';

interface Props {
  task: Task;
  isDragging?: boolean;
}

function TaskCard({ task, isDragging = false }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/task/${task.id}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'border-red-400';
      case 'medium':
        return 'border-yellow-400';
      case 'low':
        return 'border-green-400';
      default:
        return 'border-blue-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return null;
    }
  };

  return (
    <div
      onClick={handleClick}
      data-task-card
      className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-md border-l-4 ${getPriorityColor(task.priority)} mb-3 select-none
        ${isDragging
          ? 'shadow-lg scale-105 opacity-90 cursor-grabbing'
          : 'shadow hover:shadow-md transition-all duration-200 cursor-grab hover:cursor-grab'
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        {task.priority && (
          <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
            task.priority.toLowerCase() === 'high' 
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : task.priority.toLowerCase() === 'medium'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded"
            >
              {typeof label === 'string' ? label : label.name || 'Label'}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-200 mt-2">
        <div className="flex items-center gap-1">
          <UserCircle size={14} />
          <span>{task.assignee_id ? 'Assigned' : 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Timer size={14} />
            <span>#{task.position}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TaskCard);