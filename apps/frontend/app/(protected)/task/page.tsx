'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import taskService from '@/services/task/taskService';
import { useTaskStore } from '@/stores/taskStore';
import { Task, TaskUpdateFields, GenerateDescriptionRequest } from '@/lib/types/task';
import { useProjectTeamMembers } from '@/components/ui/team/TeamUtils';
import toast from 'react-hot-toast';
import Loading from '@/components/layout/LoadingPage';
import DeleteModal from '@/components/ui/task/properties/DeleteModal';
import PriorityDropdown from '@/components/ui/task/dropdowns/PriorityDropdown';
import AssigneeDropdown from '@/components/ui/task/dropdowns/AssigneeDropdown';
import DueDateDropdown from '@/components/ui/task/dropdowns/DueDateDropdown';
import LabelsDropdown from '@/components/ui/task/dropdowns/LabelsDropdown';
import EstimatedHoursInput from '@/components/ui/task/dropdowns/EstimatedHoursInput';
import BlockEditor from '@/components/ui/task/editor/BlockEditor';
import { getAxiosErrorMessage } from '@/utils/errorMessage';

function TaskDetailPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const taskId = searchParams.get("task_id");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [task, setTask] = useState<Task | null>(null);

    // AI Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenerateInput, setShowGenerateInput] = useState(false);
    const [generateRequirements, setGenerateRequirements] = useState('');

    // Local content state with debounced saving
    const [taskContent, setTaskContent] = useState("");
    const [contentInitialized, setContentInitialized] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedContentRef = useRef<string>("");

    // Store functions
    const addTask = useTaskStore((state) => state.addTask);
    const removeTask = useTaskStore((state) => state.removeTask);
    const updateTaskPartial = useTaskStore((state) => state.updateTaskPartial);
    const setTaskDescription = useTaskStore((state) => state.setTaskDescription);
    const teamMembers = useProjectTeamMembers(task?.project_id ?? undefined);

    // Fetch task directly from backend on first load
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

                const fetchedTask = await taskService.getTaskById(taskId);

                if (fetchedTask) {
                    setTask(fetchedTask);
                    // Add to store for future reference
                    addTask(fetchedTask);
                } else {
                    setError('Task not found');
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

    // Initialize content when task loads from backend
    useEffect(() => {
        if (task && taskId && !contentInitialized) {

            let initialContent = "";

            // Use task.description directly from backend
            if (task.description) {
                initialContent = task.description;
                // Store it in the store for future use
                setTaskDescription(taskId, task.description);
            }

            // Validate if content is valid JSON blocks
            if (initialContent) {
                try {
                    const parsed = JSON.parse(initialContent);
                    if (Array.isArray(parsed)) {
                        // Valid block structure
                        setTaskContent(initialContent);
                        lastSavedContentRef.current = initialContent;
                    } else {
                        // Invalid structure, convert to paragraph block
                        const paragraphBlock = [{
                            id: Date.now().toString(),
                            type: 'paragraph',
                            content: initialContent,
                            position: 0
                        }];
                        const blockContent = JSON.stringify(paragraphBlock);
                        setTaskContent(blockContent);
                        lastSavedContentRef.current = blockContent;
                    }
                } catch (e) {
                    // Not JSON, convert to paragraph block
                    const paragraphBlock = [{
                        id: Date.now().toString(),
                        type: 'paragraph',
                        content: initialContent,
                        position: 0
                    }];
                    const blockContent = JSON.stringify(paragraphBlock);
                    setTaskContent(blockContent);
                    lastSavedContentRef.current = blockContent;
                }
            } else {
                // No content, start with empty
                setTaskContent("");
                lastSavedContentRef.current = "";
            }

            setContentInitialized(true);
        }
    }, [task, taskId, contentInitialized, setTaskDescription]);

    // AI Generate Description Function
    const handleGenerateDescription = async () => {
        if (!task) return;

        try {
            setIsGenerating(true);

            const request: GenerateDescriptionRequest = {
                title: task.title,
                project_id: task.project_id,
                user_requirements: generateRequirements.trim() || null,
                priority: task.priority
            };

            const response = await taskService.generateTaskDescription(request);

            if (response.success) {
                // Update local content state
                setTaskContent(response.description);
                lastSavedContentRef.current = response.description;

                // Update store
                setTaskDescription(taskId!, response.description);
                updateTaskPartial(task.id, { description: response.description });

                // Update local task state
                setTask(prev => prev ? { ...prev, description: response.description } : prev);

                // Save to backend
                await taskService.updateTaskPartial({
                    task_id: task.id,
                    updates: { description: response.description }
                });

                toast.success('Task description generated successfully!');
                setShowGenerateInput(false);
                setGenerateRequirements('');
            }
        } catch (error: any) {
            const errMsg = getAxiosErrorMessage(error);
            toast.error(errMsg || 'Failed to generate description');
        } finally {
            setIsGenerating(false);
        }
    };

    // Check if description is empty or minimal
    const isDescriptionEmpty = () => {
        if (!taskContent) return true;

        try {
            const blocks = JSON.parse(taskContent);
            if (!Array.isArray(blocks) || blocks.length === 0) return true;

            // Check if all blocks are empty
            return blocks.every(block => !block.content || block.content.trim() === '');
        } catch {
            return !taskContent.trim();
        }
    };

    // Debounced save function
    const debouncedSave = useCallback(async (content: string) => {
        if (!task || !taskId || content === lastSavedContentRef.current || isSaving) return;

        try {
            setIsSaving(true);
            // Update local task state first for immediate UI feedback
            setTask(prev => prev ? { ...prev, description: content } : prev);
            setTaskDescription(taskId, content);
            updateTaskPartial(task.id, { description: content });

            // Save to backend
            await taskService.updateTaskPartial({
                task_id: task.id,
                updates: { description: content }
            });

            lastSavedContentRef.current = content;
        } catch (error) {
            console.error('Error saving task description:', error);
            // Revert local change on error
            const previousContent = lastSavedContentRef.current;
            setTask(prev => prev ? { ...prev, description: previousContent } : prev);
            setTaskDescription(taskId, previousContent);
            updateTaskPartial(task.id, { description: previousContent });
            setTaskContent(previousContent);
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    }, [task, taskId, updateTaskPartial, setTaskDescription, isSaving]);

    // Handle content change with debouncing
    const handleContentChange = useCallback((newContent: string) => {
        if (!contentInitialized) return;

        setTaskContent(newContent);

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save (2 seconds after user stops typing)
        saveTimeoutRef.current = setTimeout(() => {
            debouncedSave(newContent);
        }, 2000);
    }, [debouncedSave, contentInitialized]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Generic function to update task properties (not description)
    const updateTask = async (updates: Partial<TaskUpdateFields>) => {
        if (!task || isUpdating) return;

        try {
            setIsUpdating(true);

            // Update local task state first
            setTask(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : prev);
            updateTaskPartial(task.id, updates);

            await taskService.updateTaskPartial({
                task_id: task.id,
                updates
            });
            toast.success('Task updated successfully');
        } catch (error) {
            console.error('Error updating task:', error);
            // Revert local change on error
            setTask(prev => {
                if (!prev) return prev;
                const revertedTask = { ...prev };
                // Remove the failed updates
                Object.keys(updates).forEach(key => {
                    // This is a simple revert - in practice you might want to keep original values
                    delete (revertedTask as any)[key];
                });
                return revertedTask;
            });
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
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
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
        <div className="min-h-screen bg-neutral-900 pt-16 sm:pt-2">
            {/* Responsive container with better mobile padding */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="grid grid-cols-1 gap-4 sm:gap-8">
                    <div className="space-y-4 sm:space-y-8">
                        <div className="bg-neutral-800/50 rounded-lg p-0 sm:p-6 lg:p-8">
                            <div className="flex flex-col gap-4 border-b border-neutral-700 pb-4 sm:pb-6 lg:pb-8">
                                {/* Title & Status - Mobile responsive */}
                                <div className="flex items-center min-w-0 mb-2 gap-2 m-2">
                                    <div className="w-1 h-5 bg-blue-500 rounded-full flex-shrink-0" />
                                    <div className="flex items-center min-w-0 flex-1">
                                        <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 break-words">
                                            {task.title}
                                        </h1>
                                        <div className="ml-2 px-2 py-0.5 rounded bg-neutral-700/30 text-xs flex items-center">
                                            <span className="text-neutral-300 capitalize">
                                                {task.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                        {/* Save indicator */}
                                        {isSaving && (
                                            <div className="flex items-center gap-1 text-xs text-neutral-400 ml-2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b border-neutral-400" />
                                                <span className="hidden sm:inline">Saving...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Properties - Mobile responsive layout */}
                                <div className="flex flex-wrap gap-2 m-2 mt-1">
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

                                    <DueDateDropdown
                                        currentDueDate={task.due_date}
                                        onDueDateChange={(dueDate) => updateTask({ due_date: dueDate })}
                                        onRemoveDueDate={() => updateTask({ due_date: null })}
                                        disabled={isUpdating}
                                        size="small"
                                        dropdownDirection="down"
                                    />

                                    <EstimatedHoursInput
                                        currentHours={task.estimated_hours}
                                        onHoursChange={(hours) => updateTask({ estimated_hours: hours })}
                                        disabled={isUpdating}
                                        size="small"
                                    />

                                    <AssigneeDropdown
                                        currentAssigneeId={task.assignee_id}
                                        teamMembers={teamMembers}
                                        onAssigneeChange={(assigneeId) => updateTask({ assignee_id: assigneeId || null })}
                                        disabled={isUpdating}
                                        size="small"
                                        showName={true}
                                        dropdownDirection="down"
                                    />

                                    <div className="flex-1 sm:flex-none flex justify-end">
                                        <button
                                            onClick={handleDeleteTask}
                                            disabled={isDeleting}
                                            className="p-1.5 sm:p-1 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 text-xs"
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
                                </div>
                            </div>

                            {/* Enhanced Task Description Editor - Mobile responsive */}
                            <div className="bg-neutral-800/40 rounded-lg p-4 sm:p-6 lg:p-8 mt-4 sm:mt-8">
                                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                                    <h3 className="text-base sm:text-lg font-semibold text-neutral-100">Description</h3>

                                    {/* AI Generate Button - Show when description is empty or minimal */}
                                    {isDescriptionEmpty() && !showGenerateInput && (
                                        <button
                                            onClick={() => setShowGenerateInput(true)}
                                            disabled={isGenerating}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Generate with AI
                                        </button>
                                    )}
                                </div>

                                {/* AI Generate Input Section */}
                                {showGenerateInput && (
                                    <div className="mb-4 p-4 bg-neutral-700/30 rounded-lg border border-neutral-600/50">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-200 mb-2">
                                                    Additional Requirements (Optional)
                                                </label>
                                                <textarea
                                                    value={generateRequirements}
                                                    onChange={(e) => setGenerateRequirements(e.target.value)}
                                                    placeholder="Describe any specific requirements, features, or details you want included in the task description..."
                                                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-100 placeholder-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                                    rows={3}
                                                    maxLength={1000}
                                                />
                                                <div className="text-xs text-neutral-400 mt-1">
                                                    {generateRequirements.length}/1000 characters
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setShowGenerateInput(false);
                                                        setGenerateRequirements('');
                                                    }}
                                                    disabled={isGenerating}
                                                    className="px-3 py-1.5 text-neutral-400 hover:text-neutral-300 text-sm transition-colors disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleGenerateDescription}
                                                    disabled={isGenerating}
                                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                            Generate Description
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Container responsive padding */}
                                <div className="px-0 sm:px-2 lg:px-4 py-2">
                                    {contentInitialized && (
                                        <BlockEditor
                                            content={taskContent}
                                            onChange={handleContentChange}
                                            placeholder="Add task description..."
                                        />
                                    )}
                                    {!contentInitialized && (
                                        <div className="animate-pulse bg-neutral-800/30 rounded h-20 flex items-center justify-center">
                                            <span className="text-neutral-400 text-sm">Loading content...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteModal
                open={showDeleteModal}
                title="Delete Task"
                description="Are you sure you want to delete this task? This action cannot be undone."
                isLoading={isDeleting}
                onConfirm={confirmDeleteTask}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}

export default function TaskDetailPage() {
    return (
        <Suspense fallback={null}>
            <TaskDetailPageInner />
        </Suspense>
    );
}