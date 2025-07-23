// components/TaskTree/TaskTree.tsx
import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { getWorkflowById } from '@/services/workflow/workflowService';
import { TaskNode } from './TaskNode';
import { Task } from '@/lib/types/workflow';

export function TaskTree({ workflowId }: { workflowId: string }) {
  const { taskTree, setTaskTree } = useTaskStore();

  useEffect(() => {
    const load = async () => {
      if (!workflowId) return;
      try {
        const workflow = await getWorkflowById(workflowId);
        setTaskTree(workflow.tasks ?? []);
      } catch (error) {
        console.error('❌ Failed to load workflow:', error);
        setTaskTree([]); // fallback to empty on error
      }
    };

    load();
  }, [workflowId, setTaskTree]);

  if (taskTree.length === 0) {
    return <p className="text-sm text-gray-500 italic">No tasks found.</p>;
  }

  return (
    <div className="space-y-2">
      {taskTree.map((task) => (
        <TaskNode key={task.id} task={task} />
      ))}
    </div>
  );
}
