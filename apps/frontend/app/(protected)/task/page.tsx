'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, Tag, Trash2, X } from 'lucide-react';
import taskService from '@/services/task/taskService';
import { useTaskStore } from '@/stores/taskStore';
import { Task, TaskPriority, TaskUpdateFields } from '@/lib/types/task';
import { useProjectTeamMembers } from '@/components/ui/team/TeamUtils';
import {
    getPriorityIcon,
    formatDate,
    getLabelColor,
    getLabelDotColor,
    processTaskLabels,
    priorityOptions,
    availableLabels,
    getDueDatePresets
} from '@/components/ui/task/TaskUtilsFunction';
import { getAssigneeAvatar } from '@/components/ui/team/TeamUtils';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
import Loading from '@/components/layout/Loading';
import DeleteModal from '@/components/ui/task/properties/DeleteModal';

export default function TaskDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const taskId = searchParams.get("task_id");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Dropdown states
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const [showDueDateDropdown, setShowDueDateDropdown] = useState(false);
    const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [showEstimatedHoursInput, setShowEstimatedHoursInput] = useState(false);
    const [estimatedHoursValue, setEstimatedHoursValue] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Refs for dropdowns
    const priorityRef = useRef<HTMLDivElement>(null);
    const assigneeRef = useRef<HTMLDivElement>(null);
    const dueDateRef = useRef<HTMLDivElement>(null);
    const labelsRef = useRef<HTMLDivElement>(null);
    const estimatedHoursRef = useRef<HTMLDivElement>(null);

    const task: Task | undefined = useTaskStore((state) =>
        state.tasks?.find((t: Task) => t.id === taskId)
    );
    const addTask = useTaskStore((state) => state.addTask);
    const removeTask = useTaskStore((state) => state.removeTask);
    const updateTaskPartial = useTaskStore((state) => state.updateTaskPartial);

    // Get team members using the same method as BoardPage
    const teamMembers = useProjectTeamMembers(task?.project_id ?? undefined);

    // Initialize estimated hours value and fetch task
    useEffect(() => {
        const fetchTask = async () => {
            if (!taskId) {
                setError('Invalid task ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Only fetch if task is not already in store
                if (!task) {
                    const fetchedTask = await taskService.getTaskById(taskId);
                    if (fetchedTask) {
                        addTask(fetchedTask);
                    } else {
                        setError('Task not found');
                    }
                }
            } catch (err) {
                setError('Failed to fetch task');
                console.error('Error fetching task:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [taskId, addTask]);

    // Update estimated hours value when task changes
    useEffect(() => {
        setEstimatedHoursValue(task?.estimated_hours?.toString() || '');
    }, [task?.estimated_hours]);

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
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generic function to update task
    const updateTask = async (updates: Partial<TaskUpdateFields>) => {
        if (!task || isUpdating) return;

        try {
            setIsUpdating(true);

            // Optimistic update
            updateTaskPartial(task.id, updates);

            // Call API
            await taskService.updateTaskPartial({
                task_id: task.id,
                updates
            });

            toast.success('Task updated successfully');
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task');
        } finally {
            setIsUpdating(false);
        }
    };

    // Event handlers for task updates
    const handlePriorityChange = async (priority: string) => {
        const newPriority = priority === "" ? null : priority as TaskPriority;
        await updateTask({ priority: newPriority });
        setShowPriorityDropdown(false);
    };

    const handleAssigneeChange = async (assigneeId: string) => {
        await updateTask({ assignee_id: assigneeId || null });
        setShowAssigneeDropdown(false);
    };

    const handleDueDateChange = async (dueDate: string) => {
        const isoDate = new Date(dueDate).toISOString();
        await updateTask({ due_date: isoDate });
        setShowDueDateDropdown(false);
        setShowCustomDatePicker(false);
    };

    const handleLabelsChange = async (labelName: string) => {
        const currentLabels = processedLabels;
        const newLabels = currentLabels.includes(labelName)
            ? currentLabels.filter(l => l !== labelName)
            : [...currentLabels, labelName];

        await updateTask({ labels: newLabels });
    };

    const handleEstimatedHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEstimatedHoursValue(e.target.value);
    };

    const handleEstimatedHoursBlur = async () => {
        const numericValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : null;
        if (numericValue !== task?.estimated_hours) {
            await updateTask({ estimated_hours: numericValue });
        }
        setShowEstimatedHoursInput(false);
    };

    const handleEstimatedHoursKeyPress = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const numericValue = estimatedHoursValue ? parseFloat(estimatedHoursValue) : null;
            if (numericValue !== task?.estimated_hours) {
                await updateTask({ estimated_hours: numericValue });
            }
            setShowEstimatedHoursInput(false);
        } else if (e.key === 'Escape') {
            setEstimatedHoursValue(task?.estimated_hours?.toString() || '');
            setShowEstimatedHoursInput(false);
        }
    };

    const removeDueDate = async () => {
        await updateTask({ due_date: null });
        setShowDueDateDropdown(false);
        setShowCustomDatePicker(false);
    };

    const handleDeleteTask = async () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteTask = async () => {
        if (!task) return;
        try {
            setIsDeleting(true);
            await taskService.deleteTask(task.id);
            removeTask(task.id);
            toast.success('Task deleted successfully');
            router.replace(`/board?project=${task?.project_id}`);
        } catch (err) {
            console.error('Error deleting task:', err);
            toast.error('Failed to delete task. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const getAssigneeName = (assigneeId?: string) => {
        if (!assigneeId) return 'Unassigned';
        const member = teamMembers.find(m => m.id === assigneeId);
        return member ? member.name : assigneeId;
    };

    // Loading state
    if (loading) {
        return <Loading />;
    }

    // Error state
    if (error || !task) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <DeleteModal
                        open={true}
                        title="Task not found"
                        description="The task you're looking for doesn't exist or couldn't be loaded."
                        isLoading={false}
                        onConfirm={() => window.location.href = `/board?project=${task?.project_id}`}
                        onCancel={() => window.location.href = `/board?project=${task?.project_id}`}
                        confirmText="Back to Tasks"
                        cancelText=""
                        hideCancel
                    />
                </div>
            </div>
        );
    }

    const processedLabels = processTaskLabels(task.labels || []);
    const dueDatePresets = getDueDatePresets();

    return (
        <div className="min-h-screen bg-neutral-900">
            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title, Labels & Properties in one box, one row */}
                        <div className="bg-neutral-800/50 rounded-lg p-6">
                            <div className="flex flex-col gap-4">
                                {/* Title & Status */}
                                <div className="flex items-center min-w-0 mb-2">
                                    <div className="w-1 h-5 bg-blue-500 rounded-full mr-2" />
                                    <h1 className="text-2xl font-bold text-neutral-100 truncate">{task.title}</h1>
                                    <div className="ml-2 px-2 py-0.5 rounded bg-neutral-700/30 text-xs">
                                        <span className="text-neutral-300 capitalize">
                                            {task.status.replace('-', ' ')}
                                        </span>
                                    </div>
                                </div>
                                {/* Properties mini size (all below title+status) */}
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                    {/* Labels */}
                                    <div className="relative flex flex-wrap gap-1" ref={labelsRef}>
                                        {processedLabels.length === 0 ? (
                                            <button
                                                onClick={() => setShowLabelsDropdown(true)}
                                                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-medium hover:bg-neutral-700 transition-colors"
                                                disabled={isUpdating}
                                            >
                                                <Tag size={14} className="mr-1" />
                                                Labels
                                            </button>
                                        ) : (
                                            <>
                                                {processedLabels.slice(0, 3).map((labelName, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setShowLabelsDropdown(true)}
                                                        className={`text-[9px] px-1 py-0.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity ${getLabelColor(labelName)}`}
                                                        disabled={isUpdating}
                                                    >
                                                        <div className={`w-1 h-1 rounded-full ${getLabelDotColor(labelName)}`}></div>
                                                        {labelName}
                                                    </button>
                                                ))}
                                                {processedLabels.length > 3 && (
                                                    <button
                                                        onClick={() => setShowLabelsDropdown(true)}
                                                        className="text-[9px] px-1 py-0.5 bg-neutral-700 text-neutral-300 rounded hover:opacity-80 transition-opacity"
                                                        disabled={isUpdating}
                                                    >
                                                        +{processedLabels.length - 3}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {showLabelsDropdown && (
                                            <div className="absolute left-0 top-7 z-50 w-64 bg-neutral-800/95 backdrop-blur-xl rounded-lg"
                                                style={{
                                                    minWidth: '180px',
                                                    maxHeight: '400px',
                                                    overflowY: 'auto'
                                                }}
                                            >
                                                <div className="p-2">
                                                    <div className="flex items-center justify-between px-2 py-2 mb-2">
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
                                                            disabled={isUpdating}
                                                        >
                                                            <div className={`w-3 h-3 rounded-full mr-2 ${getLabelDotColor(label.name)}`}></div>
                                                            <span className="flex-1 text-left">{label.name}</span>
                                                            {processedLabels.includes(label.name) && (
                                                                <span className="text-xs text-green-400">✓</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Priority */}
                                    <div className="relative" ref={priorityRef}>
                                        <button
                                            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                            className="flex items-center hover:bg-neutral-700/50 p-1 rounded transition-colors text-xs"
                                            disabled={isUpdating}
                                        >
                                            {getPriorityIcon(task.priority)}
                                        </button>
                                        {showPriorityDropdown && (
                                            <div className="absolute top-8 left-0 w-44 bg-neutral-800/95 rounded-lg z-20">
                                                <div className="p-1">
                                                    {priorityOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => handlePriorityChange(option.value)}
                                                            className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                                            disabled={isUpdating}
                                                        >
                                                            <span className="mr-2">{option.icon}</span>
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Due Date */}
                                    <div className="relative" ref={dueDateRef}>
                                        <button
                                            onClick={() => setShowDueDateDropdown(!showDueDateDropdown)}
                                            className="flex items-center gap-1 hover:bg-neutral-700/30 px-2 py-1 rounded transition-colors text-xs"
                                            disabled={isUpdating}
                                        >
                                            <Calendar size={12} />
                                            <span>{task.due_date ? formatDate(task.due_date) : ''}</span>
                                        </button>
                                        {showDueDateDropdown && (
                                            <div className="absolute top-10 left-0 w-56 bg-neutral-800/95 rounded-lg z-20">
                                                <div className="p-1">
                                                    {dueDatePresets.map(({ label, value }) => (
                                                        <button
                                                            key={label}
                                                            onClick={() => handleDueDateChange(value)}
                                                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                                            disabled={isUpdating}
                                                        >
                                                            <span>{label}</span>
                                                            <span className="text-xs text-neutral-500">
                                                                {new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </button>
                                                    ))}
                                                    <div className="mt-1 pt-1">
                                                        <button
                                                            onClick={() => setShowCustomDatePicker(true)}
                                                            className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                                            disabled={isUpdating}
                                                        >
                                                            <Calendar size={12} className="mr-2" />
                                                            <span>Custom...</span>
                                                        </button>
                                                        {task.due_date && (
                                                            <button
                                                                onClick={removeDueDate}
                                                                className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                                                disabled={isUpdating}
                                                            >
                                                                <X size={12} className="mr-2" />
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
                                                                        handleDueDateChange(date.toISOString().split('T')[0]);
                                                                    }
                                                                }}
                                                                inline
                                                                calendarClassName="dark-datepicker"
                                                            />
                                                            <button
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
                                    </div>
                                    {/* Estimated Hours */}
                                    <div className="relative" ref={estimatedHoursRef}>
                                        {showEstimatedHoursInput ? (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={estimatedHoursValue}
                                                onChange={handleEstimatedHoursChange}
                                                onBlur={handleEstimatedHoursBlur}
                                                onKeyDown={handleEstimatedHoursKeyPress}
                                                placeholder="Hours"
                                                className="w-14 px-1 py-0.5 bg-neutral-700/50 text-neutral-100 text-xs rounded focus:outline-none focus:border-blue-500/50"
                                                autoFocus
                                                disabled={isUpdating}
                                            />
                                        ) : (
                                            <button
                                                onClick={() => setShowEstimatedHoursInput(true)}
                                                className="flex items-center gap-1 hover:bg-neutral-700/30 px-2 py-1 rounded transition-colors text-xs"
                                                disabled={isUpdating}
                                            >
                                                <Clock size={12} />
                                                <span>{task.estimated_hours ? `${task.estimated_hours}h` : ''}</span>
                                            </button>
                                        )}
                                    </div>
                                    {/* Assignee */}
                                    <div className="relative" ref={assigneeRef}>
                                        <button
                                            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                            className="flex items-center gap-1 hover:bg-neutral-700/30 px-2 py-1 rounded transition-colors text-xs"
                                            disabled={isUpdating}
                                        >
                                            {getAssigneeAvatar(task.assignee_id ?? "", teamMembers)}
                                            <span className="text-neutral-300">{getAssigneeName(task.assignee_id ?? "")}</span>
                                        </button>
                                        {showAssigneeDropdown && (
                                            <div className="absolute top-10 left-0 w-56 bg-neutral-800/95 rounded-lg z-20">
                                                <div className="p-1">
                                                    <div className="px-3 py-2 text-xs font-medium text-neutral-400">
                                                        Assign to...
                                                    </div>
                                                    <button
                                                        onClick={() => handleAssigneeChange("")}
                                                        className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                                        disabled={isUpdating}
                                                    >
                                                        {getAssigneeAvatar("", teamMembers)}
                                                        <span className="ml-2">No assignee</span>
                                                    </button>
                                                    {teamMembers.length > 0 ? (
                                                        teamMembers.map((member) => (
                                                            <button
                                                                key={member.id}
                                                                onClick={() => handleAssigneeChange(member.id)}
                                                                className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                                                disabled={isUpdating}
                                                            >
                                                                {getAssigneeAvatar(member.id, teamMembers)}
                                                                <span className="ml-2">{member.name}</span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-xs text-neutral-500">
                                                            No team members available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Delete button */}
                                    <button
                                        onClick={handleDeleteTask}
                                        disabled={isDeleting}
                                        className="ml-auto p-1 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 text-xs"
                                    >
                                        {isDeleting ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-400" />
                                        ) : (
                                            <Trash2 className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                                {/* Description */}
                                <div className="mt-4">
                                    {task.description ? (
                                        <div className="prose prose-neutral prose-invert max-w-none">
                                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                                                {task.description}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-neutral-500 italic text-sm">
                                            No description provided for this task.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Delete Modal */}
                <DeleteModal
                    open={showDeleteModal}
                    title="Delete Task"
                    description="Are you sure you want to delete this task? This action cannot be undone."
                    isLoading={isDeleting}
                    onConfirm={confirmDeleteTask}
                    onCancel={() => setShowDeleteModal(false)}
                />
            </div>
        </div>
    );
}