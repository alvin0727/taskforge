'use client'

import { useEffect, useState } from "react"
import { useBoardStore } from "@/stores/boardStore"
import { useOrganizationStore } from "@/stores/organizationStore"
import { Kanban, Calendar, Folder, CheckCircle, Clock, AlertCircle, BarChart3, Layers, Activity, Zap, Archive } from "lucide-react"
import boardService from "@/services/board/boardService"
import { getAxiosErrorMessage } from "@/utils/errorMessage"
import toast from "react-hot-toast"
import Loading from "@/components/layout/Loading"

export default function ActiveBoardsPage() {
    const activeOrg = useOrganizationStore((state) => state.activeOrg)
    const boardList = useBoardStore((state) => state.boardList)
    const archivedBoardList = useBoardStore((state) => state.archivedBoardList)
    const setBoardList = useBoardStore((state) => state.setBoardList)
    const setArchivedBoardList = useBoardStore((state) => state.setArchivedBoardList)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBoards = async () => {
            if (!activeOrg?.id) return;
            try {
                const res = await boardService.listBoardByOrganization(activeOrg.id)
                setBoardList(res.active ?? []);
                setArchivedBoardList(res.archived ?? []);
            } catch (error) {
                const errMsg = getAxiosErrorMessage(error)
                toast.error(`Failed to fetch boards: ${errMsg}`)
            } finally {
                setLoading(false)
            }
        };
        fetchBoards();
    }, [activeOrg, setBoardList, setArchivedBoardList]);

    if (loading) return <Loading />;

    const totalActiveBoards = boardList.reduce((acc, group) => acc + group.boards.length, 0);
    const totalArchivedBoards = archivedBoardList.reduce((acc, group) => acc + group.boards.length, 0);
    const totalBoards = totalActiveBoards + totalArchivedBoards;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 pt-20 md:pt-16 lg:pt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* Header Section */}
                <div className="mb-8 md:mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                            <Kanban className="w-6 h-6 md:w-7 md:h-7 text-neutral-300" />
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                            All Boards
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                        Manage your kanban boards and track workflow progress. Stay organized with visual task management across active and archived projects.
                    </p>
                </div>

                {/* Content Section */}
                {totalBoards === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 md:py-24">
                        <div className="p-4 md:p-6 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 mb-6">
                            <Kanban className="w-12 h-12 md:w-16 md:h-16 text-neutral-500" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-neutral-300 mb-2">
                            No Boards Found
                        </h3>
                        <p className="text-sm md:text-base text-neutral-500 text-center max-w-md">
                            You don't have any boards yet. Create your first board to start organizing tasks.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:gap-10">
                        {/* Summary Stats */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-neutral-400">
                                {totalBoards} total board{totalBoards !== 1 ? 's' : ''} ({totalActiveBoards} active, {totalArchivedBoards} archived) across {boardList.length + archivedBoardList.length} project{(boardList.length + archivedBoardList.length) !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Active Boards Section */}
                        {boardList.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-neutral-200">
                                        Active Projects
                                    </h2>
                                    <span className="text-xs text-neutral-500 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                                        {totalActiveBoards} board{totalActiveBoards !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {boardList.map(projectGroup => (
                                    <div key={projectGroup.project.id} className="space-y-4">
                                        {/* Project Header */}
                                        <div className="flex items-center gap-3 p-4 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg"
                                                style={{ background: projectGroup.project.color || "#3B82F6" }}
                                            />
                                            <h3 className="text-lg md:text-xl font-semibold text-neutral-200">
                                                {projectGroup.project.name}
                                            </h3>
                                            <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-700/50 rounded-full">
                                                {projectGroup.boards.length} board{projectGroup.boards.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Boards Grid */}
                                        <div className="grid gap-4 md:gap-5">
                                            {projectGroup.boards.map(board => (
                                                <div
                                                    key={board.id}
                                                    className="group relative p-5 md:p-6 bg-neutral-800/40 hover:bg-neutral-800/60 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/20"
                                                >
                                                    {/* Board Header */}
                                                    <div className="flex items-start gap-3 md:gap-4 mb-4">
                                                        <div className="p-2 bg-neutral-700/50 rounded-lg flex-shrink-0">
                                                            <Layers className="w-4 h-4 text-neutral-300" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="text-lg md:text-xl font-semibold text-neutral-100 truncate group-hover:text-white transition-colors">
                                                                    {board.name}
                                                                </h4>
                                                                {board.is_default && (
                                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex-shrink-0">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Board Stats */}
                                                    {board.stats && (
                                                        <div className="mb-4 p-4 bg-neutral-900/50 rounded-xl border border-neutral-700/30">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <BarChart3 className="w-4 h-4 text-neutral-400" />
                                                                <span className="text-sm font-medium text-neutral-300">Board Statistics</span>
                                                            </div>

                                                            {/* Main Stats */}
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-4">
                                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                                    <div className="text-lg md:text-xl font-bold text-blue-400">
                                                                        {board.stats.total_tasks}
                                                                    </div>
                                                                    <div className="text-xs text-neutral-500">Total Tasks</div>
                                                                </div>

                                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                                    <div className="text-lg md:text-xl font-bold text-green-400 flex items-center justify-center gap-1">
                                                                        <Activity className="w-4 h-4" />
                                                                        {board.stats.workflow_efficiency.active_tasks}
                                                                    </div>
                                                                    <div className="text-xs text-neutral-500">Active</div>
                                                                </div>

                                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                                    <div className="text-lg md:text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                                                                        <Clock className="w-4 h-4" />
                                                                        {board.stats.workflow_efficiency.blocked_tasks}
                                                                    </div>
                                                                    <div className="text-xs text-neutral-500">Blocked</div>
                                                                </div>

                                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                                    <div className="text-lg md:text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        {board.stats.workflow_efficiency.completed_tasks}
                                                                    </div>
                                                                    <div className="text-xs text-neutral-500">Completed</div>
                                                                </div>
                                                            </div>

                                                            {/* Completion Rate Progress Bar */}
                                                            <div className="mb-4">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-xs text-neutral-400">Completion Rate</span>
                                                                    <span className="text-xs font-semibold text-neutral-300">
                                                                        {Math.round(board.stats.completion_rate)}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-neutral-700 rounded-full h-2">
                                                                    <div
                                                                        className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-500"
                                                                        style={{ width: `${Math.min(100, Math.max(0, board.stats.completion_rate))}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Column Stats */}
                                                            {Object.keys(board.stats.columns).length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Zap className="w-4 h-4 text-neutral-400" />
                                                                        <span className="text-xs font-medium text-neutral-400">Column Distribution</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                        {Object.entries(board.stats.columns).map(([columnName, stats]) => (
                                                                            <div key={columnName} className="p-2 bg-neutral-800/30 rounded-lg">
                                                                                <div className="text-sm font-medium text-neutral-200 truncate mb-1">
                                                                                    {columnName}
                                                                                </div>
                                                                                <div className="text-xs text-neutral-400 space-y-1">
                                                                                    <div className="flex justify-between">
                                                                                        <span>Tasks:</span>
                                                                                        <span className="text-neutral-300">{stats.count}</span>
                                                                                    </div>
                                                                                    {stats.high_priority > 0 && (
                                                                                        <div className="flex justify-between">
                                                                                            <span>High:</span>
                                                                                            <span className="text-orange-400">{stats.high_priority}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {stats.urgent_priority > 0 && (
                                                                                        <div className="flex justify-between">
                                                                                            <span>Urgent:</span>
                                                                                            <span className="text-red-400">{stats.urgent_priority}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {stats.overdue > 0 && (
                                                                                        <div className="flex justify-between">
                                                                                            <span>Overdue:</span>
                                                                                            <span className="text-red-400">{stats.overdue}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Board Footer */}
                                                    <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500">
                                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                                        <span>
                                                            Updated {new Date(board.updated_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>

                                                    {/* Hover Effect Overlay */}
                                                    <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-transparent via-transparent to-neutral-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Archived Boards Section */}
                        {archivedBoardList.length > 0 && (
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-neutral-400">
                                        Archived Projects
                                    </h2>
                                    <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-600/20 rounded-full border border-neutral-600/30">
                                        {totalArchivedBoards} board{totalArchivedBoards !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {archivedBoardList.map(projectGroup => (
                                    <div key={`archived-${projectGroup.project.id}`} className="space-y-4">
                                        {/* Project Header */}
                                        <div className="flex items-center gap-3 p-4 bg-neutral-800/20 rounded-xl border border-neutral-700/20 opacity-75">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg opacity-60"
                                                style={{ background: projectGroup.project.color || "#3B82F6" }}
                                            />
                                            <h3 className="text-lg md:text-xl font-semibold text-neutral-400">
                                                {projectGroup.project.name}
                                            </h3>
                                            <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-700/30 rounded-full">
                                                {projectGroup.boards.length} board{projectGroup.boards.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-600/20rounded-full border border-neutral-600/30">
                                                Archived
                                            </span>
                                        </div>

                                        {/* Boards Grid */}
                                        <div className="grid gap-4 md:gap-5">
                                            {projectGroup.boards.map(board => (
                                                <div
                                                    key={board.id}
                                                    className="group relative p-5 md:p-6 bg-neutral-800/20 hover:bg-neutral-800/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/30 hover:border-neutral-600/30 transition-all duration-300 opacity-75"
                                                >
                                                    {/* Board Header */}
                                                    <div className="flex items-start gap-3 md:gap-4 mb-4">
                                                        <div className="p-2 bg-neutral-700/30 rounded-lg flex-shrink-0">
                                                            <Layers className="w-4 h-4 text-neutral-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="text-lg md:text-xl font-semibold text-neutral-300 truncate group-hover:text-neutral-200 transition-colors">
                                                                    {board.name}
                                                                </h4>
                                                                {board.is_default && (
                                                                    <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400/70 rounded-full border border-blue-500/20 flex-shrink-0">
                                                                        Default
                                                                    </span>
                                                                )}
                                                                <span className="px-2 py-1 text-xs font-medium bg-neutral-600/20 text-neutral-400 rounded-full border border-neutral-600/30 flex-shrink-0">
                                                                    Archived
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Board Footer */}
                                                    <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500">
                                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                                        <span>
                                                            Updated {new Date(board.updated_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>

                                                    {/* Hover Effect Overlay */}
                                                    <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-transparent via-transparent to-neutral-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}