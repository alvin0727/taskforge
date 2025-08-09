'use client'

import { useEffect, useState } from "react"
import { useProjectStore } from "@/stores/projectStore"
import { useOrganizationStore } from "@/stores/organizationStore"
import { Archive, Calendar, Folder, CheckCircle, Clock, AlertCircle, BarChart3 } from "lucide-react"
import projectService from "@/services/projects/projectService"
import { getAxiosErrorMessage } from "@/utils/errorMessage"
import toast from "react-hot-toast"
import Loading from "@/components/layout/Loading"

export default function ArchivedProjectPage() {
    const activeOrg = useOrganizationStore((state) => state.activeOrg)
    const projectList = useProjectStore((state) => state.projectList)
    const setProjectList = useProjectStore((state) => state.setProjectList)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchArchivedProjects = async () => {
            if (!activeOrg?.id) return;
            try {
                const res = await projectService.listProjects(activeOrg.id, { archived: true })
                setProjectList(res.projects.projects ?? []);
            } catch (error) {
                const errMsg = getAxiosErrorMessage(error)
                toast.error(`Failed to fetch archived projects: ${errMsg}`)
            } finally {
                setLoading(false)
            }

        };
        fetchArchivedProjects();
    }, [activeOrg, setProjectList]);

    if (loading) return <Loading />;

    return (
        <div className="min-h-screentext-neutral-100 pt-20 md:pt-16 lg:pt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* Header Section */}
                <div className="mb-8 md:mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
                            <Archive className="w-6 h-6 md:w-7 md:h-7 text-neutral-300" />
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                            Archived Projects
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                        View and manage your archived projects. These projects are no longer active but preserved for reference.
                    </p>
                </div>

                {/* Content Section */}
                {projectList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 md:py-24">
                        <div className="p-4 md:p-6 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 mb-6">
                            <Folder className="w-12 h-12 md:w-16 md:h-16 text-neutral-500" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-neutral-300 mb-2">
                            No Archived Projects
                        </h3>
                        <p className="text-sm md:text-base text-neutral-500 text-center max-w-md">
                            You don't have any archived projects yet. Projects that are archived will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:gap-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-neutral-400">
                                {projectList.length} archived project{projectList.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="grid gap-4 md:gap-5">
                            {projectList.map(project => (
                                <div
                                    key={project.id}
                                    className="group relative p-5 md:p-6 bg-neutral-800/40 hover:bg-neutral-800/60 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/20"
                                >
                                    {/* Project Header */}
                                    <div className="flex items-start gap-3 md:gap-4 mb-4">
                                        <div
                                            className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 mt-1 shadow-lg"
                                            style={{ background: project.color || "#3B82F6" }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg md:text-xl font-semibold text-neutral-100 mb-2 truncate group-hover:text-white transition-colors">
                                                {project.name}
                                            </h3>
                                            {project.description && (
                                                <p className="text-sm md:text-base text-neutral-300 leading-relaxed line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                        {project.status && (
                                            <span className="px-3 py-1 text-xs font-medium bg-neutral-700/50 text-neutral-300 rounded-full border border-neutral-600/30 flex-shrink-0">
                                                {project.status}
                                            </span>
                                        )}
                                    </div>

                                    {/* Project Stats */}
                                    {project.stats && (
                                        <div className="mb-4 p-4 bg-neutral-900/50 rounded-xl border border-neutral-700/30">
                                            <div className="flex items-center gap-2 mb-3">
                                                <BarChart3 className="w-4 h-4 text-neutral-400" />
                                                <span className="text-sm font-medium text-neutral-300">Project Statistics</span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                    <div className="text-lg md:text-xl font-bold text-blue-400">
                                                        {project.stats.total_tasks}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">Total Tasks</div>
                                                </div>

                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                    <div className="text-lg md:text-xl font-bold text-green-400 flex items-center justify-center gap-1">
                                                        <CheckCircle className="w-4 h-4" />
                                                        {project.stats.completed_tasks}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">Completed</div>
                                                </div>

                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                    <div className="text-lg md:text-xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {project.stats.in_progress_tasks}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">In Progress</div>
                                                </div>

                                                <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
                                                    <div className="text-lg md:text-xl font-bold text-red-400 flex items-center justify-center gap-1">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {project.stats.overdue_tasks}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">Overdue</div>
                                                </div>
                                            </div>

                                            {/* Completion Rate Progress Bar */}
                                            <div className="mt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-neutral-400">Completion Rate</span>
                                                    <span className="text-xs font-semibold text-neutral-300">
                                                        {Math.round(project.stats.completion_rate)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, Math.max(0, project.stats.completion_rate))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Footer */}
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500">
                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                        <span>
                                            Updated {new Date(project.updated_at).toLocaleDateString('en-US', {
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
                )}
            </div>
        </div>
    );
}