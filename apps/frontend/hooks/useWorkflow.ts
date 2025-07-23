import { useEffect, useState } from "react";
import { Workflow } from "@/lib/types/workflow";
import { getWorkflowById } from "@/services/workflow/workflowService";

export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorkflowById(id)
      .then(setWorkflow)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { workflow, loading, error };
}
