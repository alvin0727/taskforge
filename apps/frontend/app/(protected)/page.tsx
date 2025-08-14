"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  Clock,
  Users,
  AlertCircle,
  Plus,
  MoreHorizontal,
  ArrowRight,
  Target,
  Activity,
  Zap,
  Filter
} from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import AcceptInvitationModal from "@/components/layout/AcceptInvitationModal";
import { InvitationInfo } from "@/lib/types/organization";
import organizationService from "@/services/organization/organizationService";
import toast from "react-hot-toast";


const mockStats = {
  totalTasks: 24,
  completedTasks: 18,
  overdueTasks: 3,
  teamMembers: 8,
  activeProjects: 5,
  completionRate: 75
};

const mockRecentTasks = [
  { id: 1, title: "Design system documentation", project: "Design System", priority: "high", status: "in-progress", assignee: "John Doe", dueDate: "2025-08-02" },
  { id: 2, title: "API integration testing", project: "Mobile App", priority: "medium", status: "todo", assignee: "Jane Smith", dueDate: "2025-08-03" },
  { id: 3, title: "User feedback analysis", project: "Website Redesign", priority: "low", status: "completed", assignee: "Mike Johnson", dueDate: "2025-08-01" },
  { id: 4, title: "Performance optimization", project: "Backend", priority: "high", status: "in-progress", assignee: "Sarah Chen", dueDate: "2025-08-04" },
];

const mockProjects = [
  { id: 1, name: "Website Redesign", progress: 85, tasks: 12, members: 4, color: "bg-blue-500", status: "On Track" },
  { id: 2, name: "Mobile App", progress: 60, tasks: 18, members: 6, color: "bg-green-500", status: "On Track" },
  { id: 3, name: "Design System", progress: 40, tasks: 8, members: 3, color: "bg-purple-500", status: "At Risk" },
  { id: 4, name: "Marketing Campaign", progress: 90, tasks: 6, members: 2, color: "bg-orange-500", status: "Almost Done" },
];

const mockUpcomingDeadlines = [
  { title: "Q3 Planning Review", date: "2025-08-02", type: "meeting" },
  { title: "Design Handoff", date: "2025-08-03", type: "deliverable" },
  { title: "Sprint Review", date: "2025-08-05", type: "meeting" },
  { title: "User Testing Session", date: "2025-08-07", type: "research" },
];

const mockActivity = [
  { id: 1, user: "John Doe", action: "completed", item: "Login page design", time: "2 hours ago", avatar: "JD" },
  { id: 2, user: "Jane Smith", action: "commented on", item: "API documentation", time: "4 hours ago", avatar: "JS" },
  { id: 3, user: "Mike Johnson", action: "updated", item: "User feedback report", time: "6 hours ago", avatar: "MJ" },
  { id: 4, user: "Sarah Chen", action: "assigned", item: "Performance task to Alex", time: "1 day ago", avatar: "SC" },
];

function DashboardInner() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitationToken");
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-neutral-400 bg-neutral-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'in-progress': return 'text-blue-400 bg-blue-400/10';
      case 'todo': return 'text-neutral-400 bg-neutral-400/10';
      default: return 'text-neutral-400 bg-neutral-400/10';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Tasks Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">{mockStats.completedTasks}/{mockStats.totalTasks}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckSquare className="text-green-400" size={24} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-green-500 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${(mockStats.completedTasks / mockStats.totalTasks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-neutral-400">{mockStats.completionRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold text-white mt-1">{mockStats.activeProjects}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Target className="text-blue-400" size={24} />
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-4">2 launching this week</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Team Members</p>
                  <p className="text-2xl font-bold text-white mt-1">{mockStats.teamMembers}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="text-purple-400" size={24} />
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-4">3 online now</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{mockStats.overdueTasks}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="text-red-400" size={24} />
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-4">Needs attention</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Tasks */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Recent Tasks</h2>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors">
                      <Filter size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                      <Plus size={16} />
                      New Task
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {mockRecentTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-neutral-500'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{task.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-neutral-400">{task.project}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-400">
                        <span>{task.assignee}</span>
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 p-3 text-center text-neutral-400 hover:text-blue-400 hover:bg-neutral-800/50 rounded-lg transition-colors border border-dashed border-neutral-700 hover:border-blue-400/50">
                  View All Tasks
                </button>
              </div>

              {/* Projects Overview */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Active Projects</h2>
                  <button className="text-neutral-400 hover:text-blue-400 transition-colors">
                    <ArrowRight size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockProjects.map((project) => (
                    <div key={project.id} className="p-4 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                        <h3 className="text-white font-medium flex-1">{project.name}</h3>
                        <button className="text-neutral-400 hover:text-white">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Progress</span>
                          <span className="text-white">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-2">
                          <div
                            className={`${project.color} rounded-full h-2 transition-all duration-300`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-neutral-400 mt-3">
                          <span>{project.tasks} tasks</span>
                          <span>{project.members} members</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Deadlines */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="text-orange-400" size={20} />
                  <h2 className="text-lg font-semibold text-white">Upcoming</h2>
                </div>

                <div className="space-y-4">
                  {mockUpcomingDeadlines.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-medium">{item.title}</h3>
                        <p className="text-neutral-400 text-xs mt-1">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Activity */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="text-blue-400" size={20} />
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                </div>

                <div className="space-y-4">
                  {mockActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
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
                  ))}
                </div>

                <button className="w-full mt-4 text-center text-neutral-400 hover:text-blue-400 text-sm transition-colors">
                  View All Activity
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-yellow-400" size={20} />
                  <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Plus size={16} className="text-blue-400" />
                    Create New Task
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Users size={16} className="text-green-400" />
                    Invite Team Member
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Target size={16} className="text-purple-400" />
                    Start New Project
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Calendar size={16} className="text-orange-400" />
                    Schedule Meeting
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