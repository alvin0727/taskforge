
"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import {
  DndContext,
  useDroppable,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import boardService from "@/services/board/boardService";
import taskService from "@/services/task/taskService";
import { useBoardStore } from "@/stores/boardStore";
import { useTaskStore } from "@/stores/taskStore";
import { Board, BoardColumn } from "@/lib/types/board";
import { Task } from "@/lib/types/task";
import TaskCard from "@/components/ui/task/TaskCard";

function DroppableColumn({
  column,
  tasks,
  children
}: {
  column: BoardColumn;
  tasks: Task[];
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow min-h-[300px] transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {column.name}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
          {column.task_limit && (
            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              Max: {column.task_limit}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-task-card
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

export default function BoardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const { board, setBoard } = useBoardStore();
  const { tasksByColumn, setTasks, updateTaskStatus, reorderTasks, setTasksByColumn } = useTaskStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskDragging, setIsTaskDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollData = useRef({
    startX: 0,
    startScrollLeft: 0,
    isDragging: false
  });

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    const fetchBoardData = async () => {
      try {
        // Get board data
        const boardResponse = await boardService.getBoard(projectId);
        const boardData = boardResponse.board || boardResponse.boards;

        if (!boardData) {
          throw new Error("Board data not found");
        }

        setBoard(boardData);

        // Get tasks data
        const tasksResponse = await taskService.getTasksByBoard(boardData.id);

        // Transform the response structure to flat array
        const allTasks: Task[] = [];
        const tasksByColumn: Record<string, Task[]> = tasksResponse.tasks || {};
        Object.entries(tasksByColumn).forEach(([columnId, columnTasks]) => {
          columnTasks.forEach((task: Task) => {
            // Use status from backend, only fallback to columnId if missing
            allTasks.push({
              ...task,
              status: task.status || columnId
            });
          });
        });

        setTasks(allTasks);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching board data:", err);
        setError("Gagal mengambil data board");
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [projectId, setBoard, setTasks]);

  // Drag & Drop sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // Drag-to-scroll functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTaskDragging) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-task-card]')) return;
    if (!gridRef.current) return;

    scrollData.current.startX = e.clientX;
    scrollData.current.startScrollLeft = gridRef.current.scrollLeft;
    scrollData.current.isDragging = true;
    setIsScrolling(true);
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!scrollData.current.isDragging || !gridRef.current || isTaskDragging) return;
    const deltaX = e.clientX - scrollData.current.startX;
    const newScrollLeft = scrollData.current.startScrollLeft - deltaX * 2;
    gridRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft,
      gridRef.current.scrollWidth - gridRef.current.clientWidth));
  };

  const handleMouseUp = () => {
    scrollData.current.isDragging = false;
    setIsScrolling(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(String(active.id));
    setIsTaskDragging(true);

    if (scrollData.current.isDragging) {
      scrollData.current.isDragging = false;
      setIsScrolling(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    // Find the active task
    let foundTask: Task | null = null;
    Object.values(tasksByColumn).forEach(columnTasks => {
      const task = columnTasks.find(t => t.id === String(active.id));
      if (task) foundTask = task;
    });
    setActiveTask(foundTask);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setTimeout(() => setActiveId(null), 100);
    setActiveTask(null);
    setIsTaskDragging(false);

    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    // Find source column for active task
    let sourceColumnId: string | null = null;
    Object.keys(tasksByColumn).forEach(columnId => {
      if (tasksByColumn[columnId].find(task => task.id === activeTaskId)) {
        sourceColumnId = columnId;
      }
    });

    if (!sourceColumnId) return;

    // Check if dropping on a column
    const targetColumn = board?.columns.find(col => col.id === overId);
    if (targetColumn) {
      // Moving to different column
      if (sourceColumnId !== targetColumn.id) {
        // Optimistic update
        const previousState = { ...tasksByColumn };
        updateTaskStatus(activeTaskId, targetColumn.id);

        try {
          // Call backend service to update task status
          // You might need to add this method to your boardService
          // await boardService.updateTaskStatus(board.id, activeTaskId, targetColumn.id);
        } catch (error) {
          // Revert on error
          setTasksByColumn(previousState);
          setError("Gagal memindahkan task. Silakan coba lagi.");
        }
      }
      return;
    }

    // Check if dropping on another task
    let targetColumnId: string | null = null;
    let targetTaskIndex = -1;

    Object.keys(tasksByColumn).forEach(columnId => {
      const taskIndex = tasksByColumn[columnId].findIndex(task => task.id === overId);
      if (taskIndex !== -1) {
        targetColumnId = columnId;
        targetTaskIndex = taskIndex;
      }
    });

    if (!targetColumnId) return;

    if (sourceColumnId === targetColumnId) {
      // Reordering within same column
      const columnTasks = [...tasksByColumn[sourceColumnId]];
      const activeIndex = columnTasks.findIndex(task => task.id === activeTaskId);
      const targetIndex = columnTasks.findIndex(task => task.id === overId);

      if (activeIndex !== -1 && targetIndex !== -1 && activeIndex !== targetIndex) {
        // Optimistic update
        const previousState = { ...tasksByColumn };
        const reorderedTasks = arrayMove(columnTasks, activeIndex, targetIndex);
        reorderTasks(sourceColumnId, reorderedTasks);

        try {
          // Call backend service to update task positions
          // You might need to add this method to your boardService
          // await boardService.updateTaskPositions(board.id, sourceColumnId, reorderedTasks);
        } catch (error) {
          // Revert on error
          setTasksByColumn(previousState);
          setError("Gagal mengubah urutan task. Silakan coba lagi.");
        }
      }
    } else {
      // Moving to different column at specific position
      // Optimistic update
      const previousState = { ...tasksByColumn };
      updateTaskStatus(activeTaskId, targetColumnId);

      try {
        // Call backend service to update task status
        // await boardService.updateTaskStatus(board.id, activeTaskId, targetColumnId);
      } catch (error) {
        // Revert on error
        setTasksByColumn(previousState);
        setError("Gagal memindahkan task. Silakan coba lagi.");
      }
    }
  };

  if (!projectId) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <h2 className="text-xl font-bold mb-2">Board Overview</h2>
        <p>Pilih project dari sidebar untuk melihat board task.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <h2 className="text-xl font-bold mb-2">Loading Board...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <h2 className="text-xl font-bold mb-2">{error}</h2>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="p-8 text-center text-neutral-400">
        <h2 className="text-xl font-bold mb-2">Board tidak ditemukan</h2>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-7xl mx-auto px-6 py-6" >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {board.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Project ID: {board.project_id}
          </p>
        </div>

        <div
          ref={gridRef}
          className="grid grid-flow-col auto-cols-[320px] sm:auto-cols-[340px] md:auto-cols-[360px] gap-4 h-[calc(100vh-200px)] overflow-x-hidden pb-2 rounded-md select-none"
          onMouseDown={handleMouseDown}
          style={{
            cursor: isScrolling ? 'grabbing' : 'grab',
            scrollbarWidth: 'none', // hide scrollbar
            msOverflowStyle: 'none', // IE and Edge
            overscrollBehaviorX: 'none', // prevent scroll chaining
          }}
        >
          {board.columns
            .sort((a, b) => a.position - b.position)
            .map((column) => {
              const columnTasks = tasksByColumn[column.id] || [];

              return (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                >
                  <SortableContext
                    items={columnTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.map((task) =>
                      task.id === activeId ? null : (
                        <SortableTaskCard key={task.id} task={task} />
                      )
                    )}
                  </SortableContext>
                </DroppableColumn>
              );
            })}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-100">
            <TaskCard task={activeTask} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}