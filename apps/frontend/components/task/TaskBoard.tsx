'use client';

import { useTaskStore } from '@/stores/taskStore';
import TaskCard from './TaskCard';
import { flattenTasks } from '@/utils/flattenTasks';
import { DndContext, useDroppable, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { TaskStatus } from '@/lib/types/workflow';
import { updateTaskStatusInTree } from '@/utils/updateTaskTree';
import taskService from '@/services/workflow/taskService';
import { toast } from 'react-hot-toast';

const statuses: { key: TaskStatus; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
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

  if (!workflow) return <p>Loading board...</p>;

  const flatTasks = flattenTasks(workflow.tasks);

    const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;

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
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={(e) => setActiveId(String(e.active.id))}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {statuses.map(({ key }) => (
          <DroppableColumn key={key} status={key}>
            {flatTasks
              .filter((task) => task.level === 0 && task.status === key)
              .map((task) => (
                <TaskCard key={task.id} task={task} level={task.level} />
              ))}
          </DroppableColumn>
        ))}
      </div>
    </DndContext>
  );
}
