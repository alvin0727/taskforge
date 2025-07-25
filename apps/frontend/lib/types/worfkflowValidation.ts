// import { z } from "zod";

// const TaskSchema: z.ZodType<Task> = z.lazy(() =>
//   z.object({
//     id: z.string(),
//     title: z.string(),
//     description: z.string().optional().default(""),
//     status: z.string().optional().default("todo"),
//     is_completed: z.boolean().optional().default(false),
//     children: z.array(TaskSchema).optional().default([]),
//   })
// );

// const WorkflowSchema = z.object({
//   _id: z.string(),
//   title: z.string().optional(),
//   description: z.string().optional(),
//   user_id: z.string().optional(),
//   prompt: z.string().optional(),
//   created_at: z.string().optional(),
//   tasks: z.array(TaskSchema),
// });
