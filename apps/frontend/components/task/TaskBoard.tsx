'use client';

import { useRef, useState } from 'react';
import {
  DndContext,
  useDroppable, closestCenter, DragEndEvent, DragStartEvent, DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { toast } from 'react-hot-toast';
import { useTaskStore } from '@/stores/taskStore';
import { TaskStatus } from '@/lib/types/workflow';
import TaskCard from './TaskCard';
import { updateTaskStatusInTree } from '@/utils/updateTaskTree';
import taskService from '@/services/workflow/taskService';

const statuses: { key: TaskStatus; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
  { key: 'canceled', label: 'Canceled' },
];

function DroppableColumn({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow min-h-[300px] transition-colors"
    >
      <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
        {statuses.find((s) => s.key === status)?.label}
      </h2>
      {children}
    </div>
  );
}

export default function TaskBoard() {
  const workflow = useTaskStore((s) => s.workflow);
  const setWorkflow = useTaskStore((s) => s.setWorkflow);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isTaskDragging, setIsTaskDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // Simplified drag-to-scroll state
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollData = useRef({
    startX: 0,
    startScrollLeft: 0,
    isDragging: false
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't scroll if task is being dragged
    if (isTaskDragging) return;

    // Only left mouse button
    if (e.button !== 0) return;

    // Don't scroll if clicking on a task card
    const target = e.target as HTMLElement;
    if (target.closest('[data-task-card]')) return;

    if (!gridRef.current) return;

    scrollData.current.startX = e.clientX;
    scrollData.current.startScrollLeft = gridRef.current.scrollLeft;
    scrollData.current.isDragging = true;
    setIsScrolling(true);

    // Prevent text selection
    e.preventDefault();

    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!scrollData.current.isDragging || !gridRef.current || isTaskDragging) return;

    // Simple calculation - no complex logic
    const deltaX = e.clientX - scrollData.current.startX;
    const newScrollLeft = scrollData.current.startScrollLeft - deltaX * 2; // 2x speed multiplier

    // Direct scroll assignment - fastest method
    gridRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft,
      gridRef.current.scrollWidth - gridRef.current.clientWidth));
  };

  const handleMouseUp = () => {
    scrollData.current.isDragging = false;
    setIsScrolling(false);

    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Custom modifier to restrict drag within board boundaries
  const restrictToBoard = (args: any) => {
    const { transform, draggingNodeRect } = args;

    if (!gridRef.current || !draggingNodeRect) {
      return transform;
    }

    const boardRect = gridRef.current.getBoundingClientRect();
    const minX = boardRect.left - draggingNodeRect.left;
    const maxX = boardRect.right - draggingNodeRect.right;
    const restrictedX = Math.min(Math.max(transform.x, minX), maxX);

    return { ...transform, x: restrictedX };
  };

  if (!workflow) return <p>Loading board...</p>;

  // Only show root (parent) tasks in the board
  const parentTasks = workflow.tasks.filter(task => !task.parent_id);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setIsTaskDragging(true);

    // Stop any ongoing scroll immediately
    if (scrollData.current.isDragging) {
      scrollData.current.isDragging = false;
      setIsScrolling(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    // Find active task for overlay
    const task = parentTasks.find((t: any) => t.id === String(e.active.id));
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setTimeout(() => {
      setActiveId(null);
    }, 100);
    setActiveTask(null);
    setIsTaskDragging(false);

    if (!over) return;

    const draggedId = String(active.id);
    const targetStatus = over.id as TaskStatus;

    if (!statuses.some((s) => s.key === targetStatus)) return;

    // Save previous state for rollback
    const prevTasks = workflow.tasks;

    // Update local state first (optimistic update)
    const updatedTasks = updateTaskStatusInTree(workflow.tasks, draggedId, targetStatus);
    setWorkflow({ ...workflow, tasks: updatedTasks });

    // Update to backend
    try {
      await taskService.updateTaskStatusParent(workflow.id, draggedId, targetStatus);
    } catch (err) {
      // Rollback if backend update fails
      setWorkflow({ ...workflow, tasks: prevTasks });
      toast.error('Failed to update task status. Please try again.');
      console.error('Failed to update status to backend, rolling back state', err);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      modifiers={[restrictToBoard]}
    >
      <div
        ref={gridRef}
        className="grid grid-flow-col auto-cols-[320px] sm:auto-cols-[340px] md:auto-cols-[360px] gap-4 mx-8 h-[calc(100vh-64px)] overflow-x-auto pb-2 mt-12 rounded-md select-none"
        onMouseDown={handleMouseDown}
        style={{
          cursor: isScrolling ? 'grabbing' : 'grab',
          scrollbarWidth: 'thin',
        }}
      >
        {statuses.map(({ key }) => (
          <DroppableColumn key={key} status={key}>
            {parentTasks
              .filter((task) => task.status === key)
              .filter((task) => task.id !== activeId)
              .map((task) => (
                <div key={task.id} data-task-card>
                  <TaskCard task={task} />
                </div>
              ))}
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="transition-all duration-200 scale-100 opacity-100">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>

    </DndContext>


  );
}