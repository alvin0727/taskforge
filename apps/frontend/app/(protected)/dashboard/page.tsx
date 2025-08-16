"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  Clock,
  Users,
  AlertCircle,
  Plus,
  ArrowRight,
  Target,
  Activity,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import AcceptInvitationModal from "@/components/layout/AcceptInvitationModal";
import { InvitationInfo, OrganizationInviteRequest } from "@/lib/types/organization";
import organizationService from "@/services/organization/organizationService";
import dashboardService from "@/services/dashboard/dashboardService";
import toast from "react-hot-toast";
import Loading from "@/components/layout/LoadingPage";
import InviteMemberModal from "@/components/ui/organization/InviteMember";
import ProjectForm from "@/components/ui/project/ProjectForm";
import { getAxiosErrorMessage } from "@/utils/errorMessage";
import { RequestCreateProject } from "@/lib/types/project";
import projectService from "@/services/projects/projectService";
import { RequestTaskCreate } from "@/lib/types/task";
import { useTaskStore } from "@/stores/taskStore";
import taskService from "@/services/task/taskService";
import TaskFormDashboard from "@/components/ui/task/TaskFormDashboard";

function DashboardInner() {
  const user = useUserStore((state) => state.user);
  const activeOrg = useOrganizationStore((state) => state.activeOrg);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [projectFormLoading, setProjectFormLoading] = useState(false);
  const {
    setDashboardData,
    getStats,
    getRecentTasks,
    getActiveProjects,
    getUpcomingDeadlines,
    getRecentActivity
  } = useDashboardStore();

  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitationToken");
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const { setTasks } = useTaskStore();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Get current date formatted
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!activeOrg?.id) return;

    setLoading(true);
    try {
      const response = await dashboardService.getDashboardData(activeOrg.id);
      setDashboardData(response);
    } catch (err: any) {
      const errMsg = getAxiosErrorMessage(err);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrg?.id) {
      fetchDashboardData();
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    if (invitationToken) {
      setShowInvitationModal(true);
      organizationService.getInvitationDetails(invitationToken)
        .then((data) => {
          setInvitationInfo(data);
        })
        .catch((error) => {
          console.error("Failed to fetch invitation details:", error);
          toast.error("Failed to fetch invitation details.");
        });
    }
  }, [invitationToken]);

  // Get data from store
  const stats = getStats();
  const recentTasks = getRecentTasks();
  const activeProjects = getActiveProjects();
  const upcomingDeadlines = getUpcomingDeadlines();
  const recentActivity = getRecentActivity();

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-neutral-400 bg-neutral-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done': return 'text-green-400 bg-green-400/10';
      case 'in-progress':
      case 'in_progress': return 'text-blue-400 bg-blue-400/10';
      case 'todo':
      case 'backlog': return 'text-neutral-400 bg-neutral-400/10';
      default: return 'text-neutral-400 bg-neutral-400/10';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'almost done': return 'bg-green-500';
      case 'on track': return 'bg-blue-500';
      case 'in progress': return 'bg-yellow-500';
      case 'at risk': return 'bg-red-500';
      default: return 'bg-neutral-500';
    }
  };

  const handleInviteMember = async (data: OrganizationInviteRequest) => {
    if (!activeOrg?.id) return;
    try {
      const response = await organizationService.inviteMember(activeOrg.id, data);
      toast.success(response.message || "Invitation sent successfully.");
    } catch (error) {
      const errMsg = getAxiosErrorMessage(error);
      toast.error(errMsg);
    }
  }

  const handleCreateProject = async (data: RequestCreateProject) => {
    setProjectFormLoading(true);
    try {
      const response = await projectService.createNewProject(data);
      return response.project; // Return the created project
    } catch (error) {
      throw error;
    } finally {
      setProjectFormLoading(false);
    }
  }


  // Handler submit task
  const handleCreateTask = async (data: RequestTaskCreate) => {
    setTaskFormLoading(true);
    try {
      const payload: RequestTaskCreate = {
        ...data,
      };
      const response = await taskService.createNewTask(payload);
      const newTask = response.task;

      if (!newTask) {
        throw new Error("Failed to create task");
      }
      console.log("New task created:", newTask);

      const existingTasks = useTaskStore.getState().tasks;
      const hasSameBoard = existingTasks.some(t => t.board_id === newTask.board_id);

      if (hasSameBoard) {
        setTasks([...existingTasks, newTask]);
      }

      toast.success("Task created successfully");
      setShowTaskForm(false);
    } catch (err) {
      toast.error("Failed to create task");
    } finally {
      setTaskFormLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400">No data available</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Load Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 pt-16 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Header with Greeting */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              {getGreeting()}, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-sm sm:text-base text-neutral-400">
              {getCurrentDate()} • Here's what's happening with your projects today.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-xs sm:text-sm">Tasks Completed</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1">{stats.completed_tasks}/{stats.total_tasks}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg">
                  <CheckSquare className="text-green-400" size={16} />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral-800 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-green-500 rounded-full h-1.5 sm:h-2 transition-all duration-300"
                      style={{ width: `${stats.completion_rate}%` }}
                    ></div>
                  </div>
                  <span className="text-xs sm:text-sm text-neutral-400">{stats.completion_rate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-xs sm:text-sm">Active Projects</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1">{stats.active_projects}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg">
                  <Target className="text-blue-400" size={16} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-3 sm:mt-4">{activeProjects.filter(p => p.progress > 80).length} launching this week</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-xs sm:text-sm">Team Members</p>
                  <p className="text-lg sm:text-2xl font-bold text-white mt-1">{stats.team_members}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-500/10 rounded-lg">
                  <Users className="text-purple-400" size={16} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-3 sm:mt-4">{stats.active_members} active now</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-xs sm:text-sm">Overdue Tasks</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-400 mt-1">{stats.overdue_tasks}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="text-red-400" size={16} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-3 sm:mt-4">Needs attention</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content Area */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              {/* Recent Tasks */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Recent Tasks</h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {recentTasks.length > 0 ? recentTasks.map((task) => (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-neutral-500'}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate text-sm sm:text-base">{task.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                            <span className="text-xs sm:text-sm text-neutral-400">{task.project}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-neutral-400 sm:flex-shrink-0">
                        <span>{task.assignee}</span>
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 sm:py-8 text-neutral-400">
                      <CheckSquare className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8" />
                      <p className="text-sm sm:text-base">No recent tasks found</p>
                    </div>
                  )}
                </div>

                <button className="w-full mt-4 p-3 text-center text-neutral-400 hover:text-blue-400 hover:bg-neutral-800/50 rounded-lg transition-colors border border-dashed border-neutral-700 hover:border-blue-400/50 text-sm sm:text-base">
                  View All Tasks
                </button>
              </div>

              {/* Projects Overview */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Active Projects</h2>
                  <Link
                    href={`/project`}
                    className="text-neutral-400 hover:text-white"
                    onClick={e => e.stopPropagation()}
                  >
                    <ArrowRight size={20} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {activeProjects.length > 0 ? activeProjects.map((project) => (
                    <div key={project.id} className="p-3 sm:p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${getProjectStatusColor(project.display_status)}`}></div>
                        <h3 className="text-white font-medium flex-1 text-sm sm:text-base truncate">{project.name}</h3>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Progress</span>
                          <span className="text-white">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-1.5 sm:h-2">
                          <div
                            className={`${getProjectStatusColor(project.display_status)} rounded-full h-1.5 sm:h-2 transition-all duration-300`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm text-neutral-400 mt-3">
                          <span>{project.total_tasks} tasks</span>
                          <span>{project.members_count} members</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-1 lg:col-span-2 text-center py-6 sm:py-8 text-neutral-400">
                      <Target className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8" />
                      <p className="text-sm sm:text-base">No active projects found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Upcoming Deadlines */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <Clock className="text-orange-400" size={18} />
                  <h2 className="text-base sm:text-lg font-semibold text-white">Upcoming</h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400 mt-1.5 sm:mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-medium">{item.title}</h3>
                        <p className="text-neutral-400 text-xs mt-1">{formatDate(item.date)}</p>
                      </div>
                      <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded flex-shrink-0">
                        {item.type}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-neutral-400">
                      <Clock className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6" />
                      <p className="text-sm">No upcoming deadlines</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Activity */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <Activity className="text-blue-400" size={18} />
                  <h2 className="text-base sm:text-lg font-semibold text-white">Recent Activity</h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.length > 0 ? recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                        {activity.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-300">
                          <span className="font-medium text-white">{activity.user}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium">{activity.item}</span>
                        </p>
                        <p className="text-neutral-500 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-neutral-400">
                      <Activity className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>

                <button className="w-full mt-4 text-center text-neutral-400 hover:text-blue-400 text-sm transition-colors">
                  View All Activity
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-yellow-400" size={18} />
                  <h2 className="text-base sm:text-lg font-semibold text-white">Quick Actions</h2>
                </div>

                <div className="space-y-2">
                  <button onClick={() => setShowTaskForm(true)} className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Plus size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm">Create New Task</span>
                  </button>
                  <button onClick={() => setInviteOpen(true)} className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Users size={16} className="text-green-400 flex-shrink-0" />
                    <span className="text-sm">Invite Team Member</span>
                  </button>
                  <button onClick={() => setNewProjectOpen(true)} className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Target size={16} className="text-purple-400 flex-shrink-0" />
                    <span className="text-sm">Start New Project</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AcceptInvitationModal
        open={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        invitationToken={invitationToken ?? ""}
        invitationInfo={invitationInfo ?? undefined}
      />
      <InviteMemberModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInviteMember}
      />

      {newProjectOpen && (
        <ProjectForm
          onClose={() => setNewProjectOpen(false)}
          onSubmit={handleCreateProject}
          loading={projectFormLoading}
        />
      )}

      {/* Modal TaskForm */}
      {showTaskForm && (
        <TaskFormDashboard
          onSubmit={handleCreateTask}
          loading={taskFormLoading}
          onClose={() => {
            setShowTaskForm(false);
          }}
        />
      )}

    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}