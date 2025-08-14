"use client";

import React, { useState, useEffect, useRef } from "react";
import { TaskPriority, RequestTaskCreate } from "@/lib/types/task";
import { Plus, Calendar, User, Clock, Tag, X, ChevronDown, Signal, SignalHigh, SignalMedium, SignalLow, Minus } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import LoadingButton from "@/components/ui/loading/LoadingButton";
import DatePicker from "react-datepicker";
import { useTeamMembers, getAssigneeAvatar } from '../team/TeamUtils';
import "react-datepicker/dist/react-datepicker.css";

interface TaskFormProps {
  onSubmit: (data: RequestTaskCreate) => void;
  loading?: boolean;
  onClose?: () => void;
  defaultValues?: {
    project_id?: string;
    board_id?: string;
    column_id?: string;
  };
}

export default function TaskForm({ onSubmit, loading, onClose, defaultValues }: TaskFormProps) {
  const [form, setForm] = useState<RequestTaskCreate>({
    title: "",
    priority: undefined, // Make priority optional/undefined by default
    project_id: defaultValues?.project_id || "",
    board_id: defaultValues?.board_id || "",
    column_id: defaultValues?.column_id || "",
    assignee_id: undefined,
    due_date: undefined,
    estimated_hours: undefined,
    labels: [],
  });

  const [isVisible, setIsVisible] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDueDateDropdown, setShowDueDateDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showEstimatedHoursInput, setShowEstimatedHoursInput] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const teamMembers = useTeamMembers();

  const priorityRef = useRef<HTMLDivElement>(null);
  const dueDateRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const estimatedHoursRef = useRef<HTMLDivElement>(null);

  // Available labels with colors
  const availableLabels = [
    { name: "Bug", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { name: "Feature", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { name: "Improvement", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { name: "KnowledgeBase", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { name: "Documentation", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { name: "Testing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  ];

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

  // Sidebar state for responsive margin
  const sidebarHidden = useSidebarStore((state) => state.hidden);

  // Helper to get sidebar margin (responsive, SSR safe)
  const [sidebarMargin, setSidebarMargin] = useState('0');
  const [topMargin, setTopMargin] = useState('0');
  const [bottomPadding, setBottomPadding] = useState('0');

  // Animation entrance effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (dueDateRef.current && !dueDateRef.current.contains(event.target as Node)) {
        setShowDueDateDropdown(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (labelsRef.current && !labelsRef.current.contains(event.target as Node)) {
        setShowLabelsDropdown(false);
      }
      if (estimatedHoursRef.current && !estimatedHoursRef.current.contains(event.target as Node)) {
        setShowEstimatedHoursInput(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Set margin and padding on client only
    function updateMargin() {
      if (window.innerWidth >= 768) {
        setSidebarMargin(sidebarHidden ? '4rem' : '18rem');
        setTopMargin('0');
        setBottomPadding('0');
        setIsMobile(false);
      } else {
        setSidebarMargin('0');
        setTopMargin('56px');
        setBottomPadding('56px');
        setIsMobile(true);
      }
    }
    updateMargin();
    window.addEventListener('resize', updateMargin);
    return () => window.removeEventListener('resize', updateMargin);
  }, [sidebarHidden]);

  // Update form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      setForm(prev => ({
        ...prev,
        project_id: defaultValues.project_id || prev.project_id,
        board_id: defaultValues.board_id || prev.board_id,
        column_id: defaultValues.column_id || prev.column_id,
      }));
    }
  }, [defaultValues]);

  // Update labels in form when selectedLabels change
  useEffect(() => {
    setForm(prev => ({ ...prev, labels: selectedLabels }));
  }, [selectedLabels]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Handle number fields
    if (name === "estimated_hours") {
      setForm({ ...form, [name]: value ? Number(value) : undefined });
    } else if (name === "assignee_id" || name === "due_date") {
      setForm({ ...form, [name]: value ? value : undefined });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const toggleLabel = (labelName: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelName)
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const handleClose = () => {
    if (onClose) {
      setIsVisible(false);
      // Small delay to allow exit animation
      setTimeout(onClose, 200);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form); // Submit form as is, priority can be undefined
  };

  const getPriorityIcon = (priority?: TaskPriority) => {
    if (!priority) return <Minus size={14} className="text-gray-500" />;

    switch (priority) {
      case TaskPriority.URGENT:
        return <Signal size={14} className="text-red-400" />;
      case TaskPriority.HIGH:
        return <SignalHigh size={14} className="text-orange-400" />;
      case TaskPriority.MEDIUM:
        return <SignalMedium size={14} className="text-blue-400" />;
      case TaskPriority.LOW:
        return <SignalLow size={14} className="text-gray-400" />;
      default:
        return <Minus size={14} className="text-gray-500" />;
    }
  };

  const getPriorityLabel = (priority?: TaskPriority) => {
    if (!priority) return "No Priority";

    switch (priority) {
      case TaskPriority.URGENT:
        return "Urgent";
      case TaskPriority.HIGH:
        return "High";
      case TaskPriority.MEDIUM:
        return "Medium";
      case TaskPriority.LOW:
        return "Low";
      default:
        return "No Priority";
    }
  };

  const setPriority = (priority?: TaskPriority) => {
    setForm(prev => ({ ...prev, priority }));
    setShowPriorityDropdown(false);
  };

  const setDueDate = (date: string) => {
    setForm(prev => ({ ...prev, due_date: date }));
    setShowDueDateDropdown(false);
    setShowCustomDatePicker(false);
  };

  const removeDueDate = () => {
    setForm(prev => ({ ...prev, due_date: undefined }));
    setShowDueDateDropdown(false);
    setShowCustomDatePicker(false);
  };

  const setAssignee = (assigneeId: string) => {
    setForm(prev => ({ ...prev, assignee_id: assigneeId || undefined }));
    setShowAssigneeDropdown(false);
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return "Due Date";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return "Assignee";
    const member = teamMembers.find(m => m.id === assigneeId);
    return member ? member.name : "Assignee";
  };

  // Helper functions to determine if mobile should show text
  const shouldShowPriorityText = () => {
    return !isMobile || form.priority; // Show text if priority is set (not undefined)
  };

  const shouldShowAssigneeText = () => {
    return !isMobile || form.assignee_id; // Show text if assignee is selected
  };

  const shouldShowDueDateText = () => {
    return !isMobile || form.due_date; // Show text if due date is set
  };

  const shouldShowEstimatedHoursText = () => {
    return !isMobile || form.estimated_hours; // Show text if estimated hours is set
  };

  const shouldShowLabelsText = () => {
    return !isMobile || selectedLabels.length > 0; // Show text if labels are selected
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-20 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        style={{
          marginLeft: sidebarMargin,
          marginTop: topMargin,
          paddingBottom: bottomPadding,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className={`bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/30 rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 ease-out ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Plus size={16} className="text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-100">New Task</h2>
            </div>
            {onClose && (
              <button
                onClick={handleClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Title */}
            <div>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="Task title"
                className="w-full px-0 py-2 bg-transparent text-neutral-100 placeholder-neutral-500 border-0 border-b border-transparent focus:border-blue-500/50 focus:outline-none text-lg font-medium transition-colors"
                maxLength={200}
                autoFocus
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 py-2">
              {/* Priority Dropdown */}
              <div className="relative" ref={priorityRef}>
                <button
                  type="button"
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${isMobile && !shouldShowPriorityText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                    }`}
                  aria-label={isMobile && !shouldShowPriorityText() ? "Priority" : undefined}
                >
                  {getPriorityIcon(form.priority ?? undefined)}
                  {shouldShowPriorityText() && (
                    <span className="text-xs">{getPriorityLabel(form.priority ?? undefined)}</span>
                  )}
                </button>

                {showPriorityDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-1">
                      <div className="px-3 py-2 text-xs font-medium text-neutral-400 border-b border-neutral-700/50">
                        Set priority to...
                      </div>
                      <button
                        type="button"
                        onClick={() => setPriority(undefined)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Minus size={14} className="text-gray-500" />
                          <span>No Priority</span>
                        </div>
                        <span className="text-xs text-neutral-500">0</span>
                      </button>
                      {[
                        { priority: TaskPriority.URGENT, label: "Urgent", number: "1" },
                        { priority: TaskPriority.HIGH, label: "High", number: "2" },
                        { priority: TaskPriority.MEDIUM, label: "Medium", number: "3" },
                        { priority: TaskPriority.LOW, label: "Low", number: "4" },
                      ].map(({ priority, label, number }) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setPriority(priority)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(priority)}
                            <span>{label}</span>
                          </div>
                          <span className="text-xs text-neutral-500">{number}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assignee Dropdown */}
              <div className="relative" ref={assigneeRef}>
                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${isMobile && !shouldShowAssigneeText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                    }`}
                  aria-label={isMobile && !shouldShowAssigneeText() ? "Assignee" : undefined}
                >
                  <User size={14} />
                  {shouldShowAssigneeText() && (
                    <span className="text-xs">{getAssigneeName(form.assignee_id ?? "")}</span>
                  )}
                </button>

                {showAssigneeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-1">
                      <div className="px-3 py-2 text-xs font-medium text-neutral-400 border-b border-neutral-700/50">
                        Assign to...
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignee("")}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-neutral-600 rounded-full flex items-center justify-center text-xs">
                            👤
                          </div>
                          <span>No assignee</span>
                        </div>
                      </button>
                      <div className="px-3 py-1 text-xs text-neutral-500">Team members</div>
                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setAssignee(member.id)}
                          className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs mr-2">
                            {getAssigneeAvatar(member.id, teamMembers)}
                          </div>
                          <span>{member.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date Dropdown */}
              <div className="relative" ref={dueDateRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDueDateDropdown(!showDueDateDropdown);
                    setShowCustomDatePicker(false);
                  }}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${isMobile && !shouldShowDueDateText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                    }`}
                  aria-label={isMobile && !shouldShowDueDateText() ? "Due Date" : undefined}
                >
                  <Calendar size={14} />
                  {shouldShowDueDateText() && (
                    <span className="text-xs">{formatDueDate(form.due_date ?? "")}</span>
                  )}
                </button>

                {/* Dropdown for desktop */}
                {!isMobile && showDueDateDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-1">
                      {dueDatePresets.map(({ label, value }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setDueDate(value)}
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
                          type="button"
                          onClick={() => {
                            setShowCustomDatePicker(true);
                          }}
                          className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <Calendar size={14} className="mr-2" />
                          <span>Custom...</span>
                        </button>
                        {form.due_date && (
                          <button
                            type="button"
                            onClick={removeDueDate}
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
                            selected={form.due_date ? new Date(form.due_date) : null}
                            onChange={(date: Date | null) => {
                              if (date) {
                                setDueDate(date.toISOString().split('T')[0]);
                              }
                            }}
                            inline
                            calendarClassName="dark-datepicker"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomDatePicker(false)}
                            className="mt-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal for mobile */}
                {isMobile && showDueDateDropdown && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
                    <div className="bg-neutral-900 rounded-xl shadow-2xl p-4 w-[90vw] max-w-xs flex flex-col items-center">
                      <div className="mb-2 text-sm text-neutral-300 font-semibold">Select Due Date</div>
                      <DatePicker
                        selected={form.due_date ? new Date(form.due_date) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setDueDate(date.toISOString().split('T')[0]);
                          }
                        }}
                        inline
                        calendarClassName="dark-datepicker"
                      />
                      <div className="flex gap-2 mt-2">
                        {form.due_date && (
                          <button
                            type="button"
                            onClick={removeDueDate}
                            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800/50 rounded transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowDueDateDropdown(false)}
                          className="px-4 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Estimated Hours Button */}
              <div className="relative" ref={estimatedHoursRef}>
                <button
                  type="button"
                  onClick={() => setShowEstimatedHoursInput(!showEstimatedHoursInput)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${isMobile && !shouldShowEstimatedHoursText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                    }`}
                  aria-label={isMobile && !shouldShowEstimatedHoursText() ? "Estimated Hours" : undefined}
                >
                  <Clock size={14} />
                  {shouldShowEstimatedHoursText() && (
                    <span className="text-xs">
                      {form.estimated_hours ? `${form.estimated_hours}h` : "Est Hours"}
                    </span>
                  )}
                </button>

                {showEstimatedHoursInput && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={form.estimated_hours ?? ""}
                        onChange={handleChange}
                        name="estimated_hours"
                        placeholder="Hours"
                        className="w-full px-2 py-1 bg-neutral-700/50 text-neutral-100 text-sm rounded border border-neutral-600/50 focus:outline-none focus:border-blue-500/50"
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Labels Dropdown */}
              <div className="relative" ref={labelsRef}>
                <button
                  type="button"
                  onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${isMobile && !shouldShowLabelsText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                    }`}
                  aria-label={isMobile && !shouldShowLabelsText() ? "Labels" : undefined}
                >
                  <Tag size={14} />
                  {shouldShowLabelsText() && (
                    <span className="text-xs">
                      {selectedLabels.length > 0 ? `${selectedLabels.length} labels` : "Labels"}
                    </span>
                  )}
                </button>

                {showLabelsDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-2">
                      <div className="px-2 py-2 text-xs font-medium text-neutral-400 border-b border-neutral-700/50 mb-2">
                        Add labels...
                      </div>
                      <div className="mb-2">
                        <div className="px-2 py-1 text-xs text-neutral-500">Suggestions</div>
                        {availableLabels.slice(0, 3).map((label) => (
                          <button
                            key={label.name}
                            type="button"
                            onClick={() => toggleLabel(label.name)}
                            className="w-full flex items-center px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                          >
                            <div className={`w-3 h-3 rounded-full mr-2 ${label.name === 'Bug' ? 'bg-red-500' :
                                label.name === 'Feature' ? 'bg-purple-500' :
                                  'bg-blue-500'
                              }`}></div>
                            <span>{label.name}</span>
                            {selectedLabels.includes(label.name) && (
                              <span className="ml-auto text-xs text-green-400">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div>
                        <div className="px-2 py-1 text-xs text-neutral-500">Labels</div>
                        {availableLabels.slice(3).map((label) => (
                          <button
                            key={label.name}
                            type="button"
                            onClick={() => toggleLabel(label.name)}
                            className="w-full flex items-center px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                          >
                            <div className={`w-3 h-3 rounded-full mr-2 ${label.name === 'KnowledgeBase' ? 'bg-green-500' :
                                label.name === 'Documentation' ? 'bg-yellow-500' :
                                  'bg-orange-500'
                              }`}></div>
                            <span>{label.name}</span>
                            {selectedLabels.includes(label.name) && (
                              <span className="ml-auto text-xs text-green-400">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Labels Display */}
            {selectedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLabels.map((labelName) => {
                  const label = availableLabels.find(l => l.name === labelName);
                  return (
                    <span
                      key={labelName}
                      className={`px-2 py-1 text-xs rounded-full border ${label?.color || 'bg-neutral-800/30 text-neutral-400 border-neutral-700/30'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${labelName === 'Bug' ? 'bg-red-500' :
                            labelName === 'Feature' ? 'bg-purple-500' :
                              labelName === 'Improvement' ? 'bg-blue-500' :
                                labelName === 'KnowledgeBase' ? 'bg-green-500' :
                                  labelName === 'Documentation' ? 'bg-yellow-500' :
                                    'bg-orange-500'
                          }`}></div>
                        {labelName}
                      </div>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800/30">
              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
              <LoadingButton
                type="submit"
                loading={loading}
                disabled={loading || !form.title.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create Task
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}