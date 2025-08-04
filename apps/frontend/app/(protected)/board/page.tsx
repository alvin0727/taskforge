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
import { Plus, MoreHorizontal, Filter, Search } from 'lucide-react';
import boardService from "@/services/board/boardService";
import taskService from "@/services/task/taskService";
import { useBoardStore } from "@/stores/boardStore";
import { useTaskStore } from "@/stores/taskStore";
import { Board, BoardColumn } from "@/lib/types/board";
import { Task } from "@/lib/types/task";
import { useSidebarStore } from "@/stores/sidebarStore";
import TaskCard from "@/components/ui/task/TaskCard";
import Loading from "@/components/layout/Loading";

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
      className="bg-neutral-900 border border-neutral-800 rounded-md shadow-sm min-h-[200px] transition-colors hover:border-neutral-700"
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            {column.name}
          </h2>
          <span className="px-2 py-1 text-xs font-medium bg-neutral-800 text-neutral-400 rounded-full">
            {tasks.length}
          </span>
          {column.task_limit && (
            <span className="px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded-full">
              Max {column.task_limit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors">
            <Plus size={14} />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <div className="p-3 h-[calc(100%-4rem)] overflow-y-auto scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-500">
        {children}
      </div>
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
      className="mb-3"
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

  const sidebarHidden = useSidebarStore((state) => state.hidden);

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
          setLoading(false);
          return;
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
        setError("Failed to load board data");
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
          setError("Failed to move task. Please try again.");
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
          setError("Failed to reorder tasks. Please try again.");
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
        setError("Failed to move task. Please try again.");
      }
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 text-6xl">📋</div>
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">No Project Selected</h2>
          <p className="text-neutral-400">Select a project from the sidebar to view its board.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-neutral-950 md:ml-[18rem] h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-neutral-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
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
      <div
        className="fixed inset-0 bg-neutral-950 h-screen transition-all duration-300"
        style={{
          marginLeft: sidebarHidden ? '4rem' : '18rem',
        }}
      >
        <div className="w-full h-screen px-2 pt-6">
          {board && (
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-4 ml-10">
                <h1 className="text-2xl font-bold text-neutral-100">
                  {board?.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded-full">
                    {Object.values(tasksByColumn).reduce((total, tasks) => total + tasks.length, 0)} tasks
                  </span>
                  <span className="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded-full">
                    {board?.columns.length} columns
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors">
                  <Filter size={16} />
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                  <Plus size={16} />
                  Add Task
                </button>
              </div>
            </div>
          )}
          {/* Board Grid */}
          <div
            ref={gridRef}
            className="grid grid-flow-col auto-cols-[320px] sm:auto-cols-[340px] md:auto-cols-[360px] gap-4 h-[calc(100vh-110px)] min-h-0 max-h-none overflow-x-auto rounded-sm select-none"
            onMouseDown={handleMouseDown}
            style={{
              cursor: isScrolling ? 'grabbing' : 'grab',
              scrollbarWidth: 'thin',
              scrollbarColor: '#404040 #171717',
              overscrollBehaviorX: 'none',
              width: '100%',
            }}
          >
            {board?.columns
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
                    {columnTasks.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-neutral-500 text-sm border-2 border-dashed border-neutral-700 rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </DroppableColumn>
                );
              })}
          </div>
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