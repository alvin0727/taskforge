import { create } from 'zustand';
import { Task, AIUsageResponse } from '@/lib/types/task';

interface TaskStore {
  tasks: Task[];
  tasksByColumn: Record<string, Task[]>;
  taskDescriptions: Record<string, string>;
  aiUsageInfo: AIUsageResponse | null;
  setTasks: (tasks: Task[]) => void;
  setTasksByColumn: (tasksByColumn: Record<string, Task[]>) => void;
  clearTasks: () => void;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
  reorderTasks: (columnId: string, tasks: Task[]) => void;
  updateTaskPartial: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  addTask: (task: Task) => void;
  setTaskDescription: (taskId: string, description: string) => void;
  getTaskDescription: (taskId: string) => string;
  setAIUsageInfo: (info: AIUsageResponse | null) => void;
  getAIUsageInfo: () => AIUsageResponse | null;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  tasksByColumn: {},
  taskDescriptions: {},
  aiUsageInfo: null,

  setTasks: (tasks) => {
    // Group tasks by status/column
    const tasksByColumn: Record<string, Task[]> = {};
    const taskDescriptions: Record<string, string> = {};

    // Deduplicate tasks by id
    const uniqueTasksMap: Record<string, Task> = {};
    tasks.forEach(task => {
      uniqueTasksMap[task.id] = task;
    });
    const uniqueTasks = Object.values(uniqueTasksMap);

    uniqueTasks.forEach(task => {
      if (!tasksByColumn[task.status]) {
        tasksByColumn[task.status] = [];
      }
      tasksByColumn[task.status].push(task);

      // Store description separately
      if (task.description) {
        taskDescriptions[task.id] = task.description;
      }
    });

    // Sort tasks by position within each column
    Object.keys(tasksByColumn).forEach(columnId => {
      tasksByColumn[columnId].sort((a, b) => a.position - b.position);
    });

    set({ tasks: uniqueTasks, tasksByColumn, taskDescriptions });
  },

  setTasksByColumn: (tasksByColumn) => set({ tasksByColumn }),

  clearTasks: () => set({ tasks: [], tasksByColumn: {}, taskDescriptions: {} }),

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

  // Updated method for partial task updates with description handling
  updateTaskPartial: (taskId, updates) => {
    const { tasks, tasksByColumn, taskDescriptions } = get();

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

    // Update description if it's in updates
    const newTaskDescriptions = { ...taskDescriptions };
    if (updates.description !== undefined) {
      newTaskDescriptions[taskId] = updates.description;
    }

    set({ tasks: updatedTasks, tasksByColumn: newTasksByColumn, taskDescriptions: newTaskDescriptions });
  },

  removeTask: (taskId) => {
    const { tasks, tasksByColumn, taskDescriptions } = get();

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

    // Remove description
    const newTaskDescriptions = { ...taskDescriptions };
    delete newTaskDescriptions[taskId];

    set({
      tasks: updatedTasks,
      tasksByColumn: updatedTasksByColumn,
      taskDescriptions: newTaskDescriptions
    });
  },

  addTask: (task: Task) => {
    const { tasks, tasksByColumn, taskDescriptions } = get();

    if (tasks.some(t => t.id === task.id)) {
      return;
    }

    // Add task to tasks array
    const updatedTasks = [...tasks, task];

    // Add task to tasksByColumn
    const columnId = task.status;
    const updatedColumnTasks = [...(tasksByColumn[columnId] || []), task].map((t, idx) => ({
      ...t,
      position: idx,
    }));
    const updatedTasksByColumn = { ...tasksByColumn, [columnId]: updatedColumnTasks };

    // Add description if exists
    const newTaskDescriptions = { ...taskDescriptions };
    if (task.description) {
      newTaskDescriptions[task.id] = task.description;
    }

    set({
      tasks: updatedTasks,
      tasksByColumn: updatedTasksByColumn,
      taskDescriptions: newTaskDescriptions
    });
  },

  setTaskDescription: (taskId, description) => {
    const { taskDescriptions } = get();
    set({
      taskDescriptions: {
        ...taskDescriptions,
        [taskId]: description
      }
    });
  },

  getTaskDescription: (taskId) => {
    const { taskDescriptions } = get();
    return taskDescriptions[taskId] || '';
  },

  setAIUsageInfo: (info) => {
    set({ aiUsageInfo: info });
  },

  getAIUsageInfo: () => {
    const { aiUsageInfo } = get();
    return aiUsageInfo;
  }

}));