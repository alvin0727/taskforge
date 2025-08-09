// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import taskService from '@/services/workflow/taskService';
// import { Task } from "@/lib/types/workflow";
// import { useTaskStore } from '@/stores/taskStore';

// export default function TaskPage() {
//     const router = useRouter();
//     const params = useParams();
//     const { id } = params as { id: string };
//     const workflow = useTaskStore((s) => s.workflow);
//     const [task, setTask] = useState<Task | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     // Helper: cari task secara rekursif di tree
//     function findTaskById(tasks: Task[], taskId: string): Task | null {
//         // for (const t of tasks) {
//         //     if (t.id === taskId) return t;
//         //     if (t.children && t.children.length > 0) {
//         //         const found = findTaskById(t.children, taskId);
//         //         if (found) return found;
//         //     }
//         // }
//         return null;
//     }

//     useEffect(() => {
//         if (!id) return;
//         if (workflow && workflow.tasks) {
//             const found = findTaskById(workflow.tasks, id);
//             if (found) {
//                 setTask(found);
//                 setLoading(false);
//                 return;
//             }
//         }
//         // Jika tidak ditemukan di store, fetch dari backend
//         setLoading(true);
//         taskService.fetchTaskById(id)
//             .then((data) => {
//                 setTask(data);
//                 setLoading(false);
//             })
//             .catch(() => {
//                 setError("Failed to fetch task");
//                 setLoading(false);
//             });
//     }, [id, workflow]);

//     if (loading) return <div className="p-8">Loading...</div>;
//     if (error) return <div className="p-8 text-red-500">{error}</div>;
//     if (!task) return <div className="p-8">Task not found</div>;

//     return (
//         <div className="max-w-2xl mx-auto p-8">
//             <h1 className="text-2xl font-bold mb-2">{task.title}</h1>
//             <div className="mb-4 text-gray-500">Status: <span className="font-semibold">{task.status}</span></div>
//             <div className="mb-4">{task.description}</div>
//             {/* Tambahkan detail lain sesuai kebutuhan, misal sub-task, assignee, dsb */}
//             <button
//                 className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                 onClick={() => router.back()}
//             >
//                 Back
//             </button>
//         </div>
//     );

// }
