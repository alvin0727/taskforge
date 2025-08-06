'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { UserCircle, Calendar, Clock, CheckCircle, AlertCircle, Play, Pause, Minus, Ban, Eye, EyeOff, MoreHorizontal, Signal, SignalHigh, SignalMedium, SignalLow, Tag, User, X } from 'lucide-react';
import { Task } from '@/lib/types/task';
import { useRouter } from 'next/navigation';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Props {
  task: Task;
  isDragging?: boolean;
  onPriorityChange?: (taskId: string, priority: string) => void;
  onAssigneeChange?: (taskId: string, assigneeId: string) => void;
  onDueDateChange?: (taskId: string, dueDate: string) => void;
  onLabelsChange?: (taskId: string, labels: string[]) => void;
  onEstimatedHoursChange?: (taskId: string, hours: number | undefined) => void;
}

// Mock team members - you can replace with actual data
const teamMembers = [
  { id: "1", name: "alvin.gea", avatar: "AG" },
  { id: "2", name: "aufa", avatar: "AU" },
  { id: "3", name: "drpaulang", avatar: "DP" },
  { id: "4", name: "eunike", avatar: "EU" },
  { id: "5", name: "fidaa", avatar: "FI" },
  { id: "6", name: "jennifer.florentina", avatar: "JF" },
];

// Available labels
const availableLabels = [
  { name: "Bug", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { name: "Feature", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { name: "Improvement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { name: "KnowledgeBase", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { name: "Documentation", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { name: "Testing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
];

function TaskCard({ task, isDragging = false, onPriorityChange, onAssigneeChange, onDueDateChange, onLabelsChange, onEstimatedHoursChange }: Props) {
  const router = useRouter();
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

  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const dueDateRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const estimatedHoursRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

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
      const cardElement = document.querySelector(`[data-task-card]`);
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        setIsTopCard(rect.top < 200); // If card is within 200px of top
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

  const handlePriorityChange = (e: React.MouseEvent, priority: string) => {
    e.stopPropagation();
    onPriorityChange?.(task.id, priority);
    setShowPriorityDropdown(false);
  };

  const handleAssigneeChange = (e: React.MouseEvent, assigneeId: string) => {
    e.stopPropagation();
    onAssigneeChange?.(task.id, assigneeId);
    setShowAssigneeDropdown(false);
  };

  const handleDueDateChange = (e: React.MouseEvent, dueDate: string) => {
    e.stopPropagation();
    setDueDate(dueDate);
  };

  const handleLabelsChange = (labelName: string) => {
    const currentLabels = Array.isArray(task.labels)
      ? task.labels.map(label => typeof label === 'string' ? label : label.name || '')
      : [];

    const newLabels = currentLabels.includes(labelName)
      ? currentLabels.filter(l => l !== labelName)
      : [...currentLabels, labelName];

    onLabelsChange?.(task.id, newLabels);
  };

  const handleEstimatedHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEstimatedHoursValue(value);

    // Update the task when user finishes typing (on blur) or presses Enter
    const numericValue = value ? parseFloat(value) : undefined;
    if (numericValue !== task.estimated_hours) {
      onEstimatedHoursChange?.(task.id, numericValue);
    }
  };

  const handleEstimatedHoursBlur = () => {
    const numericValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : undefined;
    onEstimatedHoursChange?.(task.id, numericValue);
    setShowEstimatedHoursInput(false);
  };

  const handleEstimatedHoursKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const numericValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : undefined;
      onEstimatedHoursChange?.(task.id, numericValue);
      setShowEstimatedHoursInput(false);
    } else if (e.key === 'Escape') {
      setEstimatedHoursValue(task.estimated_hours?.toString() || '');
      setShowEstimatedHoursInput(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'border-[#e11d48]';
      case 'high':
        return 'border-[#dc2626]';
      case 'medium':
        return 'border-[#f59e42]';
      case 'low':
        return 'border-[#22c55e]';
      default:
        return 'border-[#3b82f6]';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <Signal size={14} className="text-[#e11d48]" />;
      case 'high':
        return <SignalHigh size={14} className="text-[#dc2626]" />;
      case 'medium':
        return <SignalMedium size={14} className="text-[#f59e42]" />;
      case 'low':
        return <SignalLow size={14} className="text-[#22c55e]" />;
      default:
        return <Minus size={14} className="text-gray-500" />;
    }
  };

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
      case 'canceled':
        return <Ban size={14} className="text-neutral-500" />;
      case 'backlog':
        return <EyeOff size={14} className="text-neutral-400" />;
      case 'todo':
        return <Eye size={14} className="text-neutral-400" />;
      default:
        return <Clock size={14} className="text-neutral-400" />;
    }
  };

  const getAssigneeAvatar = (assigneeId?: string) => {
    if (!assigneeId) {
      return (
        <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
          <UserCircle size={12} className="text-neutral-400" />
        </div>
      );
    }

    const member = teamMembers.find(m => m.id === assigneeId);
    if (!member) {
      return (
        <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
          <UserCircle size={12} className="text-neutral-400" />
        </div>
      );
    }

    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-medium text-white">
        {member.avatar}
      </div>
    );
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

  const getLabelColor = (labelName: string) => {
    const label = availableLabels.find(l => l.name === labelName);
    return label?.color || 'bg-neutral-800/30 text-neutral-400 border-neutral-700/30';
  };

  const getLabelDotColor = (labelName: string) => {
    switch (labelName) {
      case 'Bug': return 'bg-red-500';
      case 'Feature': return 'bg-purple-500';
      case 'Improvement': return 'bg-blue-500';
      case 'KnowledgeBase': return 'bg-green-500';
      case 'Documentation': return 'bg-yellow-500';
      case 'Testing': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const currentLabels = Array.isArray(task.labels)
    ? task.labels.map(label => typeof label === 'string' ? label : label.name || '')
    : [];

  // Due date presets
  const dueDatePresets = [
    { label: "Today", value: new Date().toISOString().split('T')[0] },
    { label: "Tomorrow", value: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { label: "End of this week", value: getEndOfWeek() },
    { label: "In one week", value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  ];

  function getEndOfWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = 5 - dayOfWeek; // Friday is day 5
    const friday = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
    return friday.toISOString().split('T')[0];
  }

  const setDueDate = (date: string) => {
    onDueDateChange?.(task.id, date);
    setShowDueDateDropdown(false);
    setShowCustomDatePicker(false);
  };

  const removeDueDate = () => {
    onDueDateChange?.(task.id, "");
    setShowDueDateDropdown(false);
    setShowCustomDatePicker(false);
  };

  const priorityOptions = [
    { value: '', label: 'No Priority', color: 'text-gray-500', icon: <Minus size={12} className="text-gray-500" /> },
    { value: 'urgent', label: 'Urgent', color: 'text-[#e11d48]', icon: <Signal size={12} className="text-[#e11d48]" /> },
    { value: 'high', label: 'High', color: 'text-[#dc2626]', icon: <SignalHigh size={12} className="text-[#dc2626]" /> },
    { value: 'medium', label: 'Medium', color: 'text-[#f59e42]', icon: <SignalMedium size={12} className="text-[#f59e42]" /> },
    { value: 'low', label: 'Low', color: 'text-[#22c55e]', icon: <SignalLow size={12} className="text-[#22c55e]" /> }
  ];

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleRightClick}
        data-task-card
        className={`bg-neutral-800 text-neutral-100 p-3 rounded-lg border-l-4 ${getPriorityColor(task.priority)} select-none h-32 flex flex-col justify-between
          ${isDragging
            ? 'shadow-xl scale-105 opacity-90 cursor-grabbing border-neutral-600'
            : 'shadow-sm hover:shadow-md hover:border-neutral-600 transition-all duration-200 cursor-grab hover:cursor-grab'
          }`}
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
              >
                {getAssigneeAvatar(task.assignee_id ?? '')}
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
                    >
                      <div className="w-6 h-6 bg-neutral-600 rounded-full flex items-center justify-center text-xs mr-2">
                        <UserCircle size={14} className="text-neutral-400" />
                      </div>
                      <span>No assignee</span>
                    </button>
                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={(e) => handleAssigneeChange(e, member.id)}
                        className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs mr-2 text-white font-medium">
                          {member.avatar}
                        </div>
                        <span>{member.name}</span>
                      </button>
                    ))}
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
              >
                <div className={`w-1.5 h-1.5 rounded-full ${getLabelDotColor(labelName)}`}></div>
                {labelName}
              </button>
            ))}
            {currentLabels.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-neutral-700 text-neutral-300 border border-neutral-600 rounded-md">
                +{currentLabels.length - 3}
              </span>
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
              >
                {getPriorityIcon(task.priority || '')}
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
                    <Signal size={14} className="mr-2" />
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

        {/* Labels Dropdown */}
        {showLabelsDropdown && (
          <div className="fixed inset-0 z-50" ref={labelsRef}>
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowLabelsDropdown(false)} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl">
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-2 border-b border-neutral-700/50 mb-2">
                  <span className="text-xs font-medium text-neutral-400">Labels</span>
                  <button
                    onClick={() => setShowLabelsDropdown(false)}
                    className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                  >
                    <X size={12} className="text-neutral-400" />
                  </button>
                </div>
                {availableLabels.map((label) => (
                  <button
                    key={label.name}
                    onClick={() => handleLabelsChange(label.name)}
                    className="w-full flex items-center px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
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
      </div>

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
                onClick={() => {
                  setShowLabelsDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Tag size={14} className="mr-2" />
                <span>Edit Labels</span>
              </button>
              <button
                onClick={() => {
                  setShowPriorityDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Signal size={14} className="mr-2" />
                <span>Set Priority</span>
              </button>
              <button
                onClick={() => {
                  setShowDueDateDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <Calendar size={14} className="mr-2" />
                <span>Set Due Date</span>
              </button>
              <button
                onClick={() => {
                  setShowAssigneeDropdown(true);
                  setShowContextMenu(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
              >
                <User size={14} className="mr-2" />
                <span>Assign To</span>
              </button>
              <button
                onClick={() => {
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