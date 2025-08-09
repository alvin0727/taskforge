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
import { Plus, MoreHorizontal, Filter, Search, X } from 'lucide-react';
import boardService from "@/services/board/boardService";
import taskService from "@/services/task/taskService";
import { useBoardStore } from "@/stores/boardStore";
import { useTaskStore } from "@/stores/taskStore";
import { Board, BoardColumn } from "@/lib/types/board";
import { Task } from "@/lib/types/task";
import { useSidebarStore } from "@/stores/sidebarStore";
import TaskCard from "@/components/ui/task/TaskCard";
import Loading from "@/components/layout/Loading";
import TaskForm from "@/components/ui/task/TaskForm";
import { RequestTaskCreate, TaskPriority } from "@/lib/types/task";
import { useProjectTeamMembers } from '@/components/ui/team/TeamUtils';
import { ProjectMember } from "@/lib/types/project";

function DroppableColumn({
  column,
  tasks,
  children,
  onAddTask
}: {
  column: BoardColumn;
  tasks: Task[];
  children: React.ReactNode;
  onAddTask: (columnId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="bg-neutral-900 border border-neutral-800 rounded-md shadow-sm h-full transition-colors hover:border-neutral-700 flex-shrink-0 flex flex-col"
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
          <button
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
            onClick={() => onAddTask(column.id)}
          >
            <Plus size={14} />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <div className="p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-500">
        {children}
      </div>
    </div>
  );
}

// Update the TaskCard usage in your board page
function SortableTaskCard({ task, teamMembers }: { task: Task, teamMembers: ProjectMember[] }) {
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
      {/* Updated TaskCard without callbacks */}
      <TaskCard task={task} isDragging={isDragging} teamMembers={teamMembers} />
    </div>
  );
}

export default function BoardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const { board, setBoard } = useBoardStore();
  const { tasksByColumn, setTasks, updateTaskStatus, reorderTasks, setTasksByColumn } = useTaskStore();

  const teamMembers = useProjectTeamMembers(projectId ?? undefined);

  const [loading, setLoading] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskDragging, setIsTaskDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Helper to get sidebar margin (responsive, SSR safe)
  const [sidebarMargin, setSidebarMargin] = useState('0');
  const [topMargin, setTopMargin] = useState('0');
  const [bottomPadding, setBottomPadding] = useState('0');

  useEffect(() => {
    // Set margin and padding on client only
    function updateMargin() {
      if (window.innerWidth >= 768) {
        setSidebarMargin(sidebarHidden ? '4rem' : '18rem');
        setTopMargin('0');
        setBottomPadding('0');
      } else {
        setSidebarMargin('0');
        setTopMargin('56px');
        setBottomPadding('56px');
      }
    }
    updateMargin();
    window.addEventListener('resize', updateMargin);
    return () => window.removeEventListener('resize', updateMargin);
  }, [sidebarHidden]);

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

    setActiveId(null);
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
          await taskService.updateTaskStatus({
            task_id: activeTaskId,
            new_column_id: targetColumn.id
          });
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
          await taskService.updateTaskPosition({
            new_position: targetIndex,
            column_id: sourceColumnId
          }, activeTaskId);
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
        await taskService.updateTaskStatus({
          task_id: activeTaskId,
          new_column_id: targetColumnId
        });
      } catch (error) {
        // Revert on error
        setTasksByColumn(previousState);
        setError("Failed to move task. Please try again.");
      }
    }
  };

  // Handler for adding new task
  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowTaskForm(true);
  };

  // Handler submit task
  const handleCreateTask = async (data: RequestTaskCreate) => {
    setTaskFormLoading(true);
    setError(null);
    try {
      const payload: RequestTaskCreate = {
        ...data,
        column_id: selectedColumnId || data.column_id,
        board_id: board?.id || data.board_id,
        project_id: projectId || data.project_id,
      };
      const response = await taskService.createNewTask(payload);
      const newTask = response.task;

      // Update tasks array, optimistic update
      if (!newTask) {
        throw new Error("Failed to create task");
      }
      setTasks([...useTaskStore.getState().tasks, newTask]);

      setShowTaskForm(false);
      setSelectedColumnId(null);
    } catch (err) {
      console.error("Error creating task:", err);
      setError("Failed to create task");
    }
    setTaskFormLoading(false);
  };

  // Filter tasks based on search query
  const filterTasks = (tasks: Task[]) => {
    if (!searchQuery.trim()) return tasks;
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      <div
        className="fixed inset-0 bg-neutral-950 h-screen flex items-center justify-center transition-all duration-300"
        style={{
          marginLeft: sidebarMargin,
          marginTop: topMargin,
          paddingBottom: bottomPadding,
        }}
      >
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-[calc(100vh-200px)] bg-neutral-950"
        style={{
          marginLeft: sidebarMargin,
          marginTop: topMargin,
          paddingBottom: bottomPadding,
        }}
      >
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
          marginLeft: sidebarMargin,
          marginTop: topMargin,
          paddingBottom: bottomPadding,
        }}
      >
        <div className="w-full h-screen px-2 pt-6">
          {board && (
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-4 ml-2 md:ml-10">
                <h1 className="text-xl md:text-2xl font-bold text-neutral-100">
                  {board.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Board Grid - Horizontal scrolling layout */}
          <div
            ref={gridRef}
            className={`flex gap-4 h-[calc(100vh-110px)] overflow-x-auto overflow-y-hidden ${bottomPadding !== '0' ? 'pb-12' : ''}`}
            onMouseDown={handleMouseDown}
            style={{
              cursor: isScrolling ? 'grabbing' : 'grab',
              scrollbarWidth: 'thin',
              scrollbarColor: '#404040 #171717',
              overscrollBehaviorX: 'contain', // Changed from 'none' to 'contain'
              scrollBehavior: 'auto', // Add explicit scroll behavior
              willChange: 'scroll-position', // Optimize for scroll performance
            }}
          >
            {board?.columns
              .sort((a, b) => a.position - b.position)
              .map((column) => {
                const columnTasks = filterTasks(tasksByColumn[column.id] || []);

                return (
                  <div
                    key={column.id}
                    className="w-[320px] flex-shrink-0 h-full"
                    onMouseEnter={() => setHoveredColumnId(column.id)}
                    onMouseLeave={() => setHoveredColumnId(null)}
                  >
                    <DroppableColumn
                      column={column}
                      tasks={columnTasks}
                      onAddTask={handleAddTask}
                    >
                      <SortableContext
                        items={columnTasks.map(task => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {columnTasks.map((task) =>
                          task.id === activeId ? null : (
                            <SortableTaskCard key={task.id} task={task} teamMembers={teamMembers} />
                          )
                        )}

                        {columnTasks.length === 0 && (
                          <div className="relative h-32 flex items-center justify-center">
                            {/* Drop tasks here box */}
                            <div
                              className={`absolute inset-0 flex flex-col items-center justify-center text-neutral-500 text-sm border-2 border-dashed border-neutral-700 rounded-lg bg-neutral-900
                                transition-all duration-300
                                ${hoveredColumnId === column.id ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}
                              `}
                            >
                              <span>Drop tasks here or create new</span>
                            </div>
                            {/* Plus button */}
                            <div
                              className={`absolute inset-0 flex justify-center items-start transition-all duration-300 py-4
                                ${hoveredColumnId === column.id ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
                              `}
                              onClick={() => handleAddTask(column.id)}
                            >
                              <div className="flex items-center justify-center h-8 w-full bg-neutral-800 border border-neutral-600 rounded-md cursor-pointer hover:bg-neutral-700 hover:border-neutral-500">
                                <Plus size={20} className="text-neutral-400" />
                              </div>
                            </div>
                          </div>
                        )}

                        {columnTasks.length > 0 && hoveredColumnId === column.id && (
                          <div
                            className="flex items-center justify-center h-8 mt-2 bg-neutral-800 border-1 border-neutral-600 rounded-md cursor-pointer transition-all hover:bg-neutral-700 hover:border-neutral-500"
                            onClick={() => handleAddTask(column.id)}
                          >
                            <Plus size={20} className="text-neutral-400" />
                          </div>
                        )}
                      </SortableContext>
                    </DroppableColumn>
                  </div>
                );
              })}
          </div>

          {/* Modal TaskForm */}
          {showTaskForm && (
            <TaskForm
              onSubmit={handleCreateTask}
              loading={taskFormLoading}
              onClose={() => {
                setShowTaskForm(false);
                setSelectedColumnId(null);
              }}
              defaultValues={{
                project_id: projectId || "",
                board_id: board?.id || "",
                column_id: selectedColumnId || "",
              }}
            />
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-100">
            <TaskCard task={activeTask} isDragging={true} teamMembers={teamMembers} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}