"use client";
import { TaskTree } from '@/components/task/TaskTree';
import { useParams } from 'next/navigation';

export default function WorkflowPage() {
  const params = useParams();
  const workflowId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;

  if (!workflowId) {
    return (
      <main className="p-4">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Task Tree</h1>
      <TaskTree workflowId={workflowId} />
    </main>
  );
}