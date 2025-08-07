import { create } from 'zustand';
import { Task } from '@/lib/types/task';
import { BoardColumn } from '@/lib/types/board';

interface TaskStore {
  tasks: Task[];
  tasksByColumn: Record<string, Task[]>;
  setTasks: (tasks: Task[]) => void;
  setTasksByColumn: (tasksByColumn: Record<string, Task[]>) => void;
  clearTasks: () => void;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
  reorderTasks: (columnId: string, tasks: Task[]) => void;
  updateTaskPartial: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  tasksByColumn: {},

  setTasks: (tasks) => {
    // Group tasks by status/column
    const tasksByColumn: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!tasksByColumn[task.status]) {
        tasksByColumn[task.status] = [];
      }
      tasksByColumn[task.status].push(task);
    });

    // Sort tasks by position within each column
    Object.keys(tasksByColumn).forEach(columnId => {
      tasksByColumn[columnId].sort((a, b) => a.position - b.position);
    });

    set({ tasks, tasksByColumn });
  },

  setTasksByColumn: (tasksByColumn) => set({ tasksByColumn }),

  clearTasks: () => set({ tasks: [], tasksByColumn: {} }),

  updateTaskStatus: (taskId, newStatus) => {
    const { tasks, tasksByColumn } = get();

    // Update the task in the tasks array
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );

    // Update tasksByColumn
    const newTasksByColumn = { ...tasksByColumn };

    // Find and remove task from old column
    Object.keys(newTasksByColumn).forEach(columnId => {
      newTasksByColumn[columnId] = newTasksByColumn[columnId].filter(task => task.id !== taskId);
    });

    // Add task to new column
    const updatedTask = updatedTasks.find(task => task.id === taskId);
    if (updatedTask) {
      if (!newTasksByColumn[newStatus]) {
        newTasksByColumn[newStatus] = [];
      }
      newTasksByColumn[newStatus].push(updatedTask);

      // Update positions
      newTasksByColumn[newStatus] = newTasksByColumn[newStatus].map((task, index) => ({
        ...task,
        position: index
      }));
    }

    set({ tasks: updatedTasks, tasksByColumn: newTasksByColumn });
  },

  reorderTasks: (columnId, tasks) => {
    const { tasksByColumn } = get();
    const newTasksByColumn = {
      ...tasksByColumn,
      [columnId]: tasks.map((task, index) => ({ ...task, position: index }))
    };

    // Update the main tasks array
    const allTasks: Task[] = [];
    Object.values(newTasksByColumn).forEach(columnTasks => {
      allTasks.push(...columnTasks);
    });

    set({ tasks: allTasks, tasksByColumn: newTasksByColumn });
  },
  // New method for partial task updates
  updateTaskPartial: (taskId, updates) => {
    const { tasks, tasksByColumn } = get();

    // Update the task in the tasks array
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
    );

    // Update tasksByColumn
    const newTasksByColumn = { ...tasksByColumn };
    Object.keys(newTasksByColumn).forEach(columnId => {
      newTasksByColumn[columnId] = newTasksByColumn[columnId].map(task =>
        task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      );
    });

    set({ tasks: updatedTasks, tasksByColumn: newTasksByColumn });
  },

  removeTask: (taskId) => {
    const { tasks, tasksByColumn } = get();

    // Find task to remove
    const taskToRemove = tasks.find(task => task.id === taskId);
    if (!taskToRemove) return;

    const columnId = taskToRemove.status;

    // Remove task from tasks array

    const updatedTasks = tasks
      .filter(task => task.id !== taskId)
      .map(task =>
        task.status === columnId
          ? {
            ...task, position: (tasksByColumn[columnId] || [])
              .filter(t => t.id !== taskId)
              .findIndex(t => t.id === task.id)
          }
          : task
      );
    const updatedColumnTasks = (tasksByColumn[columnId] || [])
      .filter(task => task.id !== taskId)
      .map((task, idx) => ({ ...task, position: idx }));

    const updatedTasksByColumn = { ...tasksByColumn, [columnId]: updatedColumnTasks };

    set({ tasks: updatedTasks, tasksByColumn: updatedTasksByColumn });
  }

}));