'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import taskService from '@/services/task/taskService';
import { useTaskStore } from '@/stores/taskStore';
import { Task, TaskUpdateFields } from '@/lib/types/task';
import { useProjectTeamMembers } from '@/components/ui/team/TeamUtils';
import toast from 'react-hot-toast';
import Loading from '@/components/layout/Loading';
import DeleteModal from '@/components/ui/task/properties/DeleteModal';
import PriorityDropdown from '@/components/ui/task/dropdowns/PriorityDropdown';
import AssigneeDropdown from '@/components/ui/task/dropdowns/AssigneeDropdown';
import DueDateDropdown from '@/components/ui/task/dropdowns/DueDateDropdown';
import LabelsDropdown from '@/components/ui/task/dropdowns/LabelsDropdown';
import EstimatedHoursInput from '@/components/ui/task/dropdowns/EstimatedHoursInput';

export default function TaskDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const taskId = searchParams.get("task_id");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const task: Task | undefined = useTaskStore((state) =>
        state.tasks?.find((t: Task) => t.id === taskId)
    );
    const addTask = useTaskStore((state) => state.addTask);
    const removeTask = useTaskStore((state) => state.removeTask);
    const updateTaskPartial = useTaskStore((state) => state.updateTaskPartial);

    const teamMembers = useProjectTeamMembers(task?.project_id ?? undefined);

    // Fetch task if not in store
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

    // Generic function to update task
    const updateTask = async (updates: Partial<TaskUpdateFields>) => {
        if (!task || isUpdating) return;

        try {
            setIsUpdating(true);
            updateTaskPartial(task.id, updates);
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

    return (
        <div className="min-h-screen bg-neutral-900">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
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

                                {/* Properties using our reusable components */}
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                    {/* Labels */}
                                    <LabelsDropdown
                                        currentLabels={task.labels || []}
                                        onLabelsChange={(labelName) => {
                                            const currentLabels = Array.isArray(task.labels) ? task.labels : [];
                                            const newLabels = currentLabels.includes(labelName)
                                                ? currentLabels.filter(l => l !== labelName)
                                                : [...currentLabels, labelName];
                                            updateTask({ labels: newLabels });
                                        }}
                                        disabled={isUpdating}
                                        size="small"
                                    />

                                    {/* Priority */}
                                    <PriorityDropdown
                                        currentPriority={task.priority}
                                        onPriorityChange={(priority) => {
                                            const newPriority = priority === "" ? null : priority as any;
                                            updateTask({ priority: newPriority });
                                        }}
                                        disabled={isUpdating}
                                        size="small"
                                        dropdownDirection="down"
                                    />

                                    {/* Due Date */}
                                    <DueDateDropdown
                                        currentDueDate={task.due_date}
                                        onDueDateChange={(dueDate) => updateTask({ due_date: dueDate })}
                                        onRemoveDueDate={() => updateTask({ due_date: null })}
                                        disabled={isUpdating}
                                        size="small"
                                        dropdownDirection="down"
                                    />

                                    {/* Estimated Hours */}
                                    <EstimatedHoursInput
                                        currentHours={task.estimated_hours}
                                        onHoursChange={(hours) => updateTask({ estimated_hours: hours })}
                                        disabled={isUpdating}
                                        size="small"
                                    />

                                    {/* Assignee */}
                                    <AssigneeDropdown
                                        currentAssigneeId={task.assignee_id}
                                        teamMembers={teamMembers}
                                        onAssigneeChange={(assigneeId) => updateTask({ assignee_id: assigneeId || null })}
                                        disabled={isUpdating}
                                        size="small"
                                        showName={true}
                                        dropdownDirection="down"
                                    />

                                    {/* Delete button */}
                                    <button
                                        onClick={handleDeleteTask}
                                        disabled={isDeleting}
                                        className="ml-auto p-1 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 text-xs"
                                    >
                                        {isDeleting ? (
                                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-400" />
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
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