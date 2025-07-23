import api from "@/lib/axios";
import { Workflow } from "@/lib/types/workflow";

export async function fetchWorkflowById(id: string): Promise<Workflow> {
  const res = await api.get(`/workflows/${id}`);
  return res.data;
}