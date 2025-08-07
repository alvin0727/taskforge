'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Calendar, Clock, MoreHorizontal, Tag, User, X } from 'lucide-react';
import { Task, TaskUpdateFields, TaskPriority } from '@/lib/types/task';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import taskService from '@/services/task/taskService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

// Import utilities
import {
  getPriorityColor,
  getPriorityIcon,
  getStatusIcon,
  formatDate,
  getDueDatePresets,
  getLabelColor,
  getLabelDotColor,
  priorityOptions,
  availableLabels,
  processTaskLabels
} from './TaskUtilsFunction';

// Import team members hooks and functions
import { useTeamMembers, getAssigneeAvatar } from '../team/TeamUtils';

interface Props {
  task: Task;
  isDragging?: boolean;
}

function TaskCard({ task, isDragging = false }: Props) {
  const router = useRouter();
  const { updateTaskPartial } = useTaskStore();
  
  // Get team members using the hook
  const teamMembers = useTeamMembers();

  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showDueDateDropdown, setShowDueDateDropdown] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showEstimatedHoursInput, setShowEstimatedHoursInput] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isTopCard, setIsTopCard] = useState(false);
  const [estimatedHoursValue, setEstimatedHoursValue] = useState(task.estimated_hours?.toString() || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const dueDateRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const estimatedHoursRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generic function to update task partial data
  const updateTask = async (updates: Partial<TaskUpdateFields>) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      
      // Optimistic update
      updateTaskPartial(task.id, updates);

      // Call API
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
      router.push(`/task/${task.id}`);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Check if this card is near the top of the viewport
  useEffect(() => {
    function checkPosition() {
      const cardElement = cardRef.current;
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        setIsTopCard(rect.top < 200);
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
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (dueDateRef.current && !dueDateRef.current.contains(event.target as Node)) {
        setShowDueDateDropdown(false);
        setShowCustomDatePicker(false);
      }
      if (labelsRef.current && !labelsRef.current.contains(event.target as Node)) {
        setShowLabelsDropdown(false);
      }
      if (estimatedHoursRef.current && !estimatedHoursRef.current.contains(event.target as Node)) {
        setShowEstimatedHoursInput(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      setShowContextMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update local estimated hours value when task changes
  useEffect(() => {
    setEstimatedHoursValue(task.estimated_hours?.toString() || '');
  }, [task.estimated_hours]);

  // Event handlers
  const handlePriorityChange = async (e: React.MouseEvent, priority: string) => {
    e.stopPropagation();
    // Handle empty string priority as null for backend
    const newPriority = priority === "" ? null : priority as TaskPriority;
    await updateTask({ priority: newPriority });
    setShowPriorityDropdown(false);
  };

  const handleAssigneeChange = async (e: React.MouseEvent, assigneeId: string) => {
    e.stopPropagation();
    console.log('Changing assignee to:', assigneeId);
    await updateTask({ assignee_id: assigneeId || null });
    setShowAssigneeDropdown(false);
  };

  const handleDueDateChange = (e: React.MouseEvent, dueDate: string) => {
    e.stopPropagation();
    setDueDate(dueDate);
  };

  const handleLabelsChange = async (e: React.MouseEvent, labelName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentLabels = processTaskLabels(task.labels);
    const newLabels = currentLabels.includes(labelName)
      ? currentLabels.filter(l => l !== labelName)
      : [...currentLabels, labelName];

    await updateTask({ labels: newLabels });
  };

  const handleEstimatedHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEstimatedHoursValue(value);
  };

  const handleEstimatedHoursBlur = async () => {
    const numericValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : null;
    if (numericValue !== task.estimated_hours) {
      await updateTask({ estimated_hours: numericValue });
    }
    setShowEstimatedHoursInput(false);
  };

  const handleEstimatedHoursKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const numericValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : null;
      if (numericValue !== task.estimated_hours) {
        await updateTask({ estimated_hours: numericValue });
      }
      setShowEstimatedHoursInput(false);
    } else if (e.key === 'Escape') {
      setEstimatedHoursValue(task.estimated_hours?.toString() || '');
      setShowEstimatedHoursInput(false);
    }
  };

  const setDueDate = async (date: string) => {
    await updateTask({ due_date: date || null });
    setShowDueDateDropdown(false);
    setShowCustomDatePicker(false);
  };

  const removeDueDate = async () => {
    await updateTask({ due_date: null });
    setShowDueDateDropdown(false);
    setShowCustomDatePicker(false);
  };

  // Process current labels
  const currentLabels = processTaskLabels(task.labels);
  const dueDatePresets = getDueDatePresets();

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleClick}
        onContextMenu={handleRightClick}
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
            <div className="flex-shrink-0 relative" ref={assigneeRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssigneeDropdown(!showAssigneeDropdown);
                }}
                className="hover:opacity-80 transition-opacity"
                disabled={isUpdating}
              >
                {getAssigneeAvatar(task.assignee_id ?? "", teamMembers)}
              </button>

              {showAssigneeDropdown && (
                <div className="absolute top-6 right-0 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20">
                  <div className="p-1">
                    <div className="px-3 py-2 text-xs font-medium text-neutral-400 border-b border-neutral-700/50">
                      Assign to...
                    </div>
                    <button
                      onClick={(e) => handleAssigneeChange(e, "")}
                      className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                      disabled={isUpdating}
                    >
                      {getAssigneeAvatar("", teamMembers)}
                      <span className="ml-2">No assignee</span>
                    </button>
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={(e) => handleAssigneeChange(e, member.id)}
                          className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                          disabled={isUpdating}
                        >
                          {getAssigneeAvatar(member.id, teamMembers)}
                          <span className="ml-2">{member.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-neutral-500">
                        No team members available
                      </div>
                    )}
                  </div>
                </div>
              )}
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
        {currentLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {currentLabels.slice(0, 3).map((labelName, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLabelsDropdown(true);
                }}
                className={`text-[10px] px-1.5 py-0.5 border rounded-md flex items-center gap-1 hover:opacity-80 transition-opacity ${getLabelColor(labelName)}`}
                disabled={isUpdating}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${getLabelDotColor(labelName)}`}></div>
                {labelName}
              </button>
            ))}
            {currentLabels.length > 3 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLabelsDropdown(true);
                }}
                className="text-[10px] px-1.5 py-0.5 bg-neutral-700 text-neutral-300 border border-neutral-600 rounded-md hover:opacity-80 transition-opacity"
              >
                +{currentLabels.length - 3}
              </button>
            )}
          </div>
        )}

        {/* Footer with Priority, Due Date, Estimated Hours and More menu */}
        <div className="flex justify-between items-center text-xs text-neutral-400 mt-auto">
          <div className="flex items-center gap-2">
            {/* Priority */}
            <div className="relative" ref={priorityRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPriorityDropdown(!showPriorityDropdown);
                }}
                className="flex items-center gap-1 hover:text-neutral-100 transition-colors"
                disabled={isUpdating}
              >
                {getPriorityIcon(task.priority)}
              </button>

              {showPriorityDropdown && (
                <div className={`absolute ${isTopCard ? 'top-6' : 'bottom-6'} left-0 w-48 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                  <div className="p-1">
                    <div className="px-3 py-2 text-xs font-medium text-neutral-400 border-b border-neutral-700/50">
                      Set priority to...
                    </div>
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => handlePriorityChange(e, option.value)}
                        className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        disabled={isUpdating}
                      >
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="relative" ref={dueDateRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDueDateDropdown(!showDueDateDropdown);
                }}
                className="flex items-center gap-1 hover:text-neutral-100 transition-colors"
                disabled={isUpdating}
              >
                <Calendar size={12} />
                {task.due_date && (
                  <span>{formatDate(task.due_date)}</span>
                )}
              </button>

              {showDueDateDropdown && (
                <div className={`absolute ${isTopCard ? 'top-6' : 'bottom-6'} left-0 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                  <div className="p-1">
                    {dueDatePresets.map(({ label, value }) => (
                      <button
                        key={label}
                        onClick={(e) => handleDueDateChange(e, value)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        disabled={isUpdating}
                      >
                        <span>{label}</span>
                        <span className="text-xs text-neutral-500">
                          {new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-neutral-700/50 mt-1 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomDatePicker(true);
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        disabled={isUpdating}
                      >
                        <Calendar size={14} className="mr-2" />
                        <span>Custom...</span>
                      </button>
                      {task.due_date && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDueDate();
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                          disabled={isUpdating}
                        >
                          <X size={14} className="mr-2" />
                          <span>Remove Due Date</span>
                        </button>
                      )}
                    </div>
                    {showCustomDatePicker && (
                      <div className="mt-2 px-2 pb-2">
                        <DatePicker
                          selected={task.due_date ? new Date(task.due_date) : null}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setDueDate(date.toISOString().split('T')[0]);
                            }
                          }}
                          inline
                          calendarClassName="dark-datepicker"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCustomDatePicker(false);
                          }}
                          className="mt-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Estimated Hours */}
            <div className="relative" ref={estimatedHoursRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEstimatedHoursInput(!showEstimatedHoursInput);
                }}
                className="flex items-center gap-1 hover:text-neutral-100 transition-colors"
                disabled={isUpdating}
              >
                <Clock size={12} />
                {task.estimated_hours && (
                  <span>{task.estimated_hours}h</span>
                )}
              </button>

              {showEstimatedHoursInput && (
                <div className={`absolute ${isTopCard ? 'top-6' : 'bottom-6'} left-0 w-32 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                  <div className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={estimatedHoursValue}
                      onChange={handleEstimatedHoursChange}
                      onBlur={handleEstimatedHoursBlur}
                      onKeyDown={handleEstimatedHoursKeyPress}
                      placeholder="Hours"
                      className="w-full px-2 py-1 bg-neutral-700/50 text-neutral-100 text-sm rounded border border-neutral-600/50 focus:outline-none focus:border-blue-500/50"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* More menu */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(!showMoreMenu);
              }}
              className="p-1 hover:text-neutral-100 hover:bg-neutral-700/50 rounded transition-colors"
              disabled={isUpdating}
            >
              <MoreHorizontal size={14} />
            </button>

            {showMoreMenu && (
              <div className={`absolute ${isTopCard ? 'top-6' : 'bottom-6'} right-0 w-48 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                <div className="p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLabelsDropdown(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Tag size={14} className="mr-2" />
                    <span>Labels</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPriorityDropdown(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Tag size={14} className="mr-2" />
                    <span>Priority</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDueDateDropdown(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Calendar size={14} className="mr-2" />
                    <span>Due Date</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAssigneeDropdown(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <User size={14} className="mr-2" />
                    <span>Assignee</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEstimatedHoursInput(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  >
                    <Clock size={14} className="mr-2" />
                    <span>Estimated Hours</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Labels Dropdown - Fixed positioning yang benar */}
      {showLabelsDropdown && (
        <div className="fixed inset-0 z-50" ref={labelsRef}>
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowLabelsDropdown(false)} />
          <div 
            className="absolute w-64 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl"
            style={{
              top: cardRef.current ? cardRef.current.getBoundingClientRect().bottom + 8 : '50%',
              left: cardRef.current ? Math.min(cardRef.current.getBoundingClientRect().left, window.innerWidth - 280) : '50%',
              transform: cardRef.current ? 'none' : 'translate(-50%, -50%)',
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-2 border-b border-neutral-700/50 mb-2">
                <span className="text-xs font-medium text-neutral-400">Labels</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLabelsDropdown(false);
                  }}
                  className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                >
                  <X size={12} className="text-neutral-400" />
                </button>
              </div>
              {availableLabels.map((label) => (
                <button
                  key={label.name}
                  onClick={(e) => handleLabelsChange(e, label.name)}
                  className="w-full flex items-center px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                  disabled={isUpdating}
                >
                  <div className={`w-3 h-3 rounded-full mr-2 ${getLabelDotColor(label.name)}`}></div>
                  <span className="flex-1 text-left">{label.name}</span>
                  {currentLabels.includes(label.name) && (
                    <span className="text-xs text-green-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" onClick={() => setShowContextMenu(false)} />
          <div
            className="absolute w-48 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              transform: 'translate(-50%, -10px)'
            }}
          >
            <div className="p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLabelsDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Tag size={14} className="mr-2" />
                <span>Edit Labels</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPriorityDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Tag size={14} className="mr-2" />
                <span>Set Priority</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDueDateDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Calendar size={14} className="mr-2" />
                <span>Set Due Date</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssigneeDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <User size={14} className="mr-2" />
                <span>Assign To</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEstimatedHoursInput(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Clock size={14} className="mr-2" />
                <span>Set Hours</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(TaskCard);