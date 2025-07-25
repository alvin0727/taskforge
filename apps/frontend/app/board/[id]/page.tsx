
'use client';

import { useEffect, use } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { getWorkflowById } from '@/services/workflow/workflowService';
import TaskBoard from '@/components/task/TaskBoard';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const setWorkflow = useTaskStore((s) => s.setWorkflow);


  useEffect(() => {
    if (!id) return;
    getWorkflowById(id)
      .then((workflow) => {
        setWorkflow(workflow)
      })
      .catch((err) => {
        console.error('Failed to fetch workflow', err);
      });
  }, [id, setWorkflow]);

  return <TaskBoard />;
}
