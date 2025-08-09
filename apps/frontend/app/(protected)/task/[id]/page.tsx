'use client';

import { useParams } from 'next/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { Task } from '@/lib/types/task';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const task: Task | undefined = useTaskStore((state) =>
    state.tasks?.find((t: Task) => t.id === taskId)
  );

  if (!task) {
    return (
      <div className="p-8 text-center text-neutral-400">
        Task not found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-neutral-800 rounded-lg shadow-lg text-neutral-100 mt-10">
      <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
      <div className="mb-4 text-neutral-400 text-sm">{task.status}</div>
      {task.description && (
        <p className="mb-4">{task.description}</p>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="font-semibold">Priority:</span> {task.priority || '-'}
        </div>
        <div>
          <span className="font-semibold">Due Date:</span> {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
        </div>
        <div>
          <span className="font-semibold">Estimated Hours:</span> {task.estimated_hours ?? '-'}
        </div>
        <div>
          <span className="font-semibold">Assignee:</span> {task.assignee_id || '-'}
        </div>
      </div>
    </div>
  );
}