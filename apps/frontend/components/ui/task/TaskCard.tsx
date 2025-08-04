'use client';

import { memo, useState } from 'react';
import { UserCircle, Calendar, Clock, CheckCircle, AlertCircle, Play, Pause, ChevronDown, Flame, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { Task } from '@/lib/types/task';
import { useRouter } from 'next/navigation';

interface Props {
  task: Task;
  isDragging?: boolean;
  onPriorityChange?: (taskId: string, priority: string) => void;
}

function TaskCard({ task, isDragging = false, onPriorityChange }: Props) {
  const router = useRouter();
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/task/${task.id}`);
    }
  };

  const handlePriorityChange = (e: React.MouseEvent, priority: string) => {
    e.stopPropagation();
    onPriorityChange?.(task.id, priority);
    setShowPriorityDropdown(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'border-[#e11d48]'; // pink-700
      case 'high':
        return 'border-[#dc2626]'; // red-600
      case 'medium':
        return 'border-[#f59e42]'; // amber-400
      case 'low':
        return 'border-[#22c55e]'; // green-500
      default:
        return 'border-[#3b82f6]'; // blue-500
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-[#fda4af]/20 text-[#e11d48]'; // pink
      case 'high':
        return 'bg-[#fecaca]/20 text-[#dc2626]'; // red
      case 'medium':
        return 'bg-[#fde68a]/20 text-[#f59e42]'; // amber
      case 'low':
        return 'bg-[#bbf7d0]/20 text-[#22c55e]'; // green
      default:
        return 'bg-[#dbeafe]/20 text-[#3b82f6]'; // blue
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <Flame size={12} className="text-[#e11d48]" />;
      case 'high':
        return <ArrowUp size={12} className="text-[#dc2626]" />;
      case 'medium':
        return <Minus size={12} className="text-[#f59e42]" />;
      case 'low':
        return <ArrowDown size={12} className="text-[#22c55e]" />;
      default:
        return <ArrowUp size={12} className="text-[#3b82f6]" />;
    }
  };

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: 'bg-[#fda4af]/20 text-[#e11d48]', icon: <Flame size={12} className="text-[#e11d48] mr-2" /> },
    { value: 'high', label: 'High', color: 'bg-[#fecaca]/20 text-[#dc2626]', icon: <ArrowUp size={12} className="text-[#dc2626] mr-2" /> },
    { value: 'medium', label: 'Medium', color: 'bg-[#fde68a]/20 text-[#f59e42]', icon: <Minus size={12} className="text-[#f59e42] mr-2" /> },
    { value: 'low', label: 'Low', color: 'bg-[#bbf7d0]/20 text-[#22c55e]', icon: <ArrowDown size={12} className="text-[#22c55e] mr-2" /> }
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'in-progress':
      case 'doing':
        return <Play size={14} className="text-blue-400" />;
      case 'blocked':
        return <AlertCircle size={14} className="text-red-400" />;
      case 'review':
        return <Pause size={14} className="text-yellow-400" />;
      case 'todo':
      case 'backlog':
      default:
        return <Clock size={14} className="text-neutral-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
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
      className={`bg-neutral-800 text-neutral-100 p-4 rounded-lg border-l-4 ${getPriorityColor(task.priority)} select-none
        ${isDragging
          ? 'shadow-xl scale-105 opacity-90 cursor-grabbing border-neutral-600'
          : 'shadow-sm hover:shadow-md hover:border-neutral-600 transition-all duration-200 cursor-grab hover:cursor-grab'
        }`}
    >
      {/* Header with Status Icon and Priority */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(task.status)}
          <div className="flex-1">  
            <h3 className="font-medium text-sm text-neutral-100 line-clamp-2 leading-tight">
              {task.title}
            </h3>
          </div>
        </div>

        {/* Priority Dropdown */}
        {task.priority && (
          <div className="relative ml-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPriorityDropdown(!showPriorityDropdown);
              }}
              className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 hover:opacity-80 transition-opacity ${getPriorityBadgeColor(task.priority)}`}
            >
              {getPriorityIcon(task.priority)}
              {task.priority}
              <ChevronDown size={10} />
            </button>

            {showPriorityDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-neutral-900 rounded-lg shadow-lg z-10 min-w-[100px]">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => handlePriorityChange(e, option.value)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-800 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${option.color}`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-neutral-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 3).map((label, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md"
            >
              {typeof label === 'string' ? label : label.name || 'Label'}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-xs px-2 py-1 bg-neutral-700 text-neutral-300 border border-neutral-600 rounded-md">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-neutral-400">
        <div className="flex items-center gap-1">
          <UserCircle size={12} />
          <span>{task.assignee_id ? 'Assigned' : 'Unassigned'}</span>
        </div>

        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(task.due_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TaskCard);