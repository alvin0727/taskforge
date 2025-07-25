// import { useDroppable } from '@dnd-kit/core';
// import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import TaskCard from './TaskCard';

// export default function Column({ id, tasks }) {
//     const { setNodeRef } = useDroppable({ id });

//     return (
//         <div ref={setNodeRef} className="w-1/3 p-4 bg-gray-100 rounded">
//             <h2 className="font-bold capitalize mb-2">{id.replace('_', ' ')}</h2>
//             <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
//                 {tasks.map((task) => (
//                     <TaskCard key={task.id} task={task} />
//                 ))}
//             </SortableContext>
//         </div>
//     );
// }
