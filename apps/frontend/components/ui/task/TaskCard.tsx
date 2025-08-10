'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2, Tag, Calendar, User, Clock } from 'lucide-react';
import { Task, TaskUpdateFields } from '@/lib/types/task';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import taskService from '@/services/task/taskService';
import toast from 'react-hot-toast';

// Import our new reusable components
import PriorityDropdown from '@/components/ui/task/dropdowns/PriorityDropdown';
import AssigneeDropdown from '@/components/ui/task/dropdowns/AssigneeDropdown';
import DueDateDropdown from '@/components/ui/task/dropdowns/DueDateDropdown';
import LabelsDropdown from '@/components/ui/task/dropdowns/LabelsDropdown';
import EstimatedHoursInput from '@/components/ui/task/dropdowns/EstimatedHoursInput';

import {
  getPriorityColor,
  getStatusIcon,
  processTaskLabels,
} from './TaskUtilsFunction';

interface TaskCardTeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
  status?: string;
  joined_at?: string;
}

interface Props {
  task: Task;
  isDragging?: boolean;
  teamMembers: TaskCardTeamMember[];
}

function TaskCard({ task, isDragging = false, teamMembers }: Props) {
  const router = useRouter();
  const { updateTaskPartial, removeTask } = useTaskStore();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLastCard, setIsLastCard] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showDueDateDropdown, setShowDueDateDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showEstimatedHoursInput, setShowEstimatedHoursInput] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generic function to update task
  const updateTask = async (updates: Partial<TaskUpdateFields>) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      updateTaskPartial(task.id, updates);
      await taskService.updateTaskPartial({
        task_id: task.id,
        updates
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/task?task_id=${task.id}`);
    }
  };

  const deleteTask = async () => {
    try {
      await taskService.deleteTask(task.id);
      removeTask(task.id);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  // Check if card is near top of viewport
  useEffect(() => {
    function checkPosition() {
      const cardElement = cardRef.current;
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        // Cek jika card lebih dekat ke bawah viewport (misal 200px dari bawah)
        setIsLastCard(window.innerHeight - rect.bottom < 200);
      }
    }
    checkPosition();
    window.addEventListener('scroll', checkPosition);
    window.addEventListener('resize', checkPosition);
    return () => {
      window.removeEventListener('scroll', checkPosition);
      window.removeEventListener('resize', checkPosition);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleClick}
        data-task-card
        className={`bg-neutral-800 text-neutral-100 p-3 rounded-lg border-l-4 ${getPriorityColor(task.priority)} select-none h-32 flex flex-col justify-between
          ${isDragging
            ? 'shadow-xl scale-105 opacity-90 cursor-grabbing border-neutral-600'
            : 'shadow-sm hover:shadow-md hover:border-neutral-600 transition-all duration-200 cursor-grab hover:cursor-grab'
          }
          ${isUpdating ? 'opacity-75' : ''}
        `}
      >
        {/* Header with Status Icon, Title and Avatar */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getStatusIcon(task.status)}
            <h3 className="font-medium text-sm text-neutral-100 line-clamp-2 leading-tight flex-1">
              {task.title}
            </h3>
            <div className="flex-shrink-0">
              <AssigneeDropdown
                currentAssigneeId={task.assignee_id}
                teamMembers={teamMembers}
                onAssigneeChange={assigneeId => {
                  updateTask({ assignee_id: assigneeId || null });
                }}
                disabled={isUpdating}
                size="small"
                dropdownDirection={isLastCard ? "up" : "down"}
                isOpen={showAssigneeDropdown}
                setIsOpen={setShowAssigneeDropdown}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mt-2">
            {task.description}
          </p>
        )}

        {/* Labels */}
        <div className="flex flex-wrap gap-1 mt-2">
          <LabelsDropdown
            currentLabels={task.labels || []}
            onLabelsChange={labelName => {
              const currentLabels = processTaskLabels(task.labels);
              const newLabels = currentLabels.includes(labelName)
                ? currentLabels.filter(l => l !== labelName)
                : [...currentLabels, labelName];
              updateTask({ labels: newLabels });
            }}
            disabled={isUpdating}
            size="small"
            maxVisibleLabels={3}
            dropdownDirection={isLastCard ? "up" : "down"}
            isOpen={showLabelsDropdown}
            setIsOpen={setShowLabelsDropdown}
          />
        </div>

        {/* Footer with Priority, Due Date, Estimated Hours and More menu */}
        <div className="flex justify-between items-center text-xs text-neutral-400 mt-auto">
          <div className="flex items-center gap-2">
            {/* Priority */}
            <PriorityDropdown
              currentPriority={task.priority}
              onPriorityChange={priority => {
                const newPriority = priority === "" ? null : priority as any;
                updateTask({ priority: newPriority });
              }}
              disabled={isUpdating}
              size="small"
              dropdownDirection={isLastCard ? "up" : "down"}
            />

            {/* Due Date */}
            <DueDateDropdown
              currentDueDate={task.due_date}
              onDueDateChange={dueDate => {
                updateTask({ due_date: dueDate });
              }}
              onRemoveDueDate={() => updateTask({ due_date: null })}
              disabled={isUpdating}
              size="small"
              dropdownDirection={isLastCard ? "up" : "down"}
              isOpen={showDueDateDropdown}
              setIsOpen={setShowDueDateDropdown}
            />

            {/* Estimated Hours */}
            <EstimatedHoursInput
              currentHours={task.estimated_hours}
              onHoursChange={hours => {
                updateTask({ estimated_hours: hours });
              }}
              disabled={isUpdating}
              size="small"
              isOpen={showEstimatedHoursInput}
              setIsOpen={setShowEstimatedHoursInput}
            />
          </div>

          {/* More menu */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={e => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
              }}
              className="p-1 hover:text-neutral-100 hover:bg-neutral-700/50 rounded transition-colors"
              disabled={isUpdating}
            >
              <MoreHorizontal size={14} />
            </button>

            {showMoreMenu && (
              <div className={`absolute ${isLastCard ? 'bottom-6' : 'top-6'} right-0 w-48 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                <div className="p-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowLabelsDropdown(true);
                      setShowDueDateDropdown(false);
                      setShowAssigneeDropdown(false);
                      setShowEstimatedHoursInput(false);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Tag size={14} className="mr-2" />
                    <span>Labels</span>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowLabelsDropdown(false);
                      setShowDueDateDropdown(true);
                      setShowAssigneeDropdown(false);
                      setShowEstimatedHoursInput(false);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Calendar size={14} className="mr-2" />
                    <span>Due Date</span>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowLabelsDropdown(false);
                      setShowDueDateDropdown(false);
                      setShowAssigneeDropdown(true);
                      setShowEstimatedHoursInput(false);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <User size={14} className="mr-2" />
                    <span>Assignee</span>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowLabelsDropdown(false);
                      setShowDueDateDropdown(false);
                      setShowAssigneeDropdown(false);
                      setShowEstimatedHoursInput(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Clock size={14} className="mr-2" />
                    <span>Estimated Hours</span>
                  </button>
                </div>
                <div className="border-t border-neutral-700/50 mt-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteTask();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-200 hover:bg-red-800/50 rounded-md transition-colors"
                  >
                    <Trash2 size={14} className="mr-2" />
                    <span>Delete Task</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(TaskCard);