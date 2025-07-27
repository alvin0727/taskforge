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
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import { useTaskStore } from '@/stores/taskStore';
import { TaskStatus } from '@/lib/types/workflow';
import TaskCard from './TaskCard';
import taskService from '@/services/workflow/taskService';

const statuses: { key: TaskStatus; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
  { key: 'canceled', label: 'Canceled' },
];

export default function TaskBoard() {
  const workflow = useTaskStore((s) => s.workflow);
  const parentTasksByStatus = useTaskStore((s) => s.parentTasksByStatus);
  const setParentTasksByStatus = useTaskStore((s) => s.setParentTasksByStatus);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isTaskDragging, setIsTaskDragging] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

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

  function SortableTaskCard({ task }: { task: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-task-card>
        <TaskCard task={task} />
      </div>
    );
  }

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

  // Drag-to-scroll state
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollData = useRef({
    startX: 0,
    startScrollLeft: 0,
    isDragging: false
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTaskDragging) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-task-card]')) return;
    if (!gridRef.current) return;

    scrollData.current.startX = e.clientX;
    scrollData.current.startScrollLeft = gridRef.current.scrollLeft;
    scrollData.current.isDragging = true;
    setIsScrolling(true);
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!scrollData.current.isDragging || !gridRef.current || isTaskDragging) return;
    const deltaX = e.clientX - scrollData.current.startX;
    const newScrollLeft = scrollData.current.startScrollLeft - deltaX * 2;
    gridRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft,
      gridRef.current.scrollWidth - gridRef.current.clientWidth));
  };

  const handleMouseUp = () => {
    scrollData.current.isDragging = false;
    setIsScrolling(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const restrictToBoard = (args: any) => {
    const { transform, draggingNodeRect } = args;
    if (!gridRef.current || !draggingNodeRect) return transform;
    const boardRect = gridRef.current.getBoundingClientRect();
    const minX = boardRect.left - draggingNodeRect.left;
    const maxX = boardRect.right - draggingNodeRect.right;
    const restrictedX = Math.min(Math.max(transform.x, minX), maxX);
    return { ...transform, x: restrictedX };
  };

  if (!workflow) return <p>Loading board...</p>;

  // Helper: get parent task by id
  const getParentTaskById = (id: string) => {
    for (const status of Object.keys(parentTasksByStatus)) {
      const found = parentTasksByStatus[status]?.find((t) => t.id === id);
      if (found) return found;
    }
    return undefined;
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setIsTaskDragging(true);
    if (scrollData.current.isDragging) {
      scrollData.current.isDragging = false;
      setIsScrolling(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    const task = getParentTaskById(String(e.active.id));
    setActiveTask(task);
  };

  // Reorder parent tasks in the same status
  const handleParentTaskSortEnd = async (activeId: string, overId: string, status: TaskStatus) => {
    const prev = JSON.parse(JSON.stringify(parentTasksByStatus));
    const tasks = [...(parentTasksByStatus[status] || [])];
    const oldIndex = tasks.findIndex(task => task.id === activeId);
    const newIndex = tasks.findIndex(task => task.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex).map((task, idx) => ({ ...task, order: idx }));
    setParentTasksByStatus({ ...parentTasksByStatus, [status]: reordered });

    try {
      await taskService.updateTaskOrderParent(workflow.id, activeId, newIndex);
    } catch (error) {
      setParentTasksByStatus(prev);
      toast.error('Failed to update task order. Please try again.');
    }
  };

  // Handle drag end (reorder or move status)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setTimeout(() => setActiveId(null), 100);
    setActiveTask(null);
    setIsTaskDragging(false);

    if (!over) return;

    const activeTaskObj = getParentTaskById(String(active.id));
    const overTaskObj = getParentTaskById(String(over.id));

    // Reorder in same status
    if (
      activeTaskObj &&
      overTaskObj &&
      activeTaskObj.status === overTaskObj.status &&
      active.id !== over.id
    ) {
      await handleParentTaskSortEnd(String(active.id), String(over.id), activeTaskObj.status);
      return;
    }

    // Move to different status
    let targetStatus: TaskStatus | undefined;
    if (overTaskObj) {
      targetStatus = overTaskObj.status;
    } else if (statuses.some((s) => s.key === over.id)) {
      targetStatus = over.id as TaskStatus;
    }
    if (!targetStatus || !activeTaskObj) return;

    const prev = JSON.parse(JSON.stringify(parentTasksByStatus));
    // Remove from old status
    const oldStatus = activeTaskObj.status;
    const oldTasks = (parentTasksByStatus[oldStatus] || []).filter(t => t.id !== activeTaskObj.id)
      .map((task, idx) => ({ ...task, order: idx }));

    // Add to new status at the end
    const newTasks = [
      ...(parentTasksByStatus[targetStatus] || []),
      { ...activeTaskObj, status: targetStatus, order: (parentTasksByStatus[targetStatus]?.length || 0) }
    ].map((task, idx) => ({ ...task, order: idx }));

    setParentTasksByStatus({
      ...parentTasksByStatus,
      [oldStatus]: oldTasks,
      [targetStatus]: newTasks,
    });

    try {
      await taskService.updateTaskStatusParent(workflow.id, String(active.id), targetStatus);
    } catch (error) {
      setParentTasksByStatus(prev);
      toast.error('Failed to update task status/order. Please try again.');
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
            <SortableContext
              items={parentTasksByStatus[key]?.map(t => t.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {(parentTasksByStatus[key] || []).map((task) =>
                task.id === activeId ? null : (
                  <SortableTaskCard key={task.id} task={task} />
                )
              )}
            </SortableContext>
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