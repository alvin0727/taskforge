import { Task } from '@/lib/types/workflow';
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';

export function TaskNode({ task }: { task: Task }) {
  const { updateTask } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  // Sync local title state if task.title is updated externally
  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed });
    }
    setIsEditing(false);
  };

  return (
    <div className="ml-4 border-l-2 pl-2 py-1">
      {isEditing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setIsEditing(false);
              setTitle(task.title); // Revert if canceled
            }
          }}
          className="border rounded px-1 text-sm"
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className="cursor-pointer hover:underline"
        >
          {task.title}
        </span>
      )}

      {/* Render children recursively */}
      {task.children?.length > 0 && (
        <div className="ml-4 space-y-1">
          {task.children.map((child) => (
            <TaskNode key={child.id} task={child} />
          ))}
        </div>
      )}
    </div>
  );
}
