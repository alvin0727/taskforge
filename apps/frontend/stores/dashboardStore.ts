import { create } from "zustand";
import {
    DashboardResponse,
    DashboardStats,
    DashboardSummary,
    RecentActivity,
    RecentTask,
    ActiveProject,
    UpcomingDeadline
} from "@/lib/types/dashboard";

// Dashboard Store Type
type DashboardStore = {
    // State
    dashboardData: DashboardResponse | null;
    lastUpdated: string | null;

    // Basic Actions - Set
    setDashboardData: (data: DashboardResponse) => void;
    setLastUpdated: (timestamp: string) => void;

    // Section-specific Set Actions
    setStats: (stats: DashboardStats) => void;
    setRecentTasks: (tasks: RecentTask[]) => void;
    setActiveProjects: (projects: ActiveProject[]) => void;
    setUpcomingDeadlines: (deadlines: UpcomingDeadline[]) => void;
    setRecentActivity: (activities: RecentActivity[]) => void;

    // Get Actions (selectors)
    getStats: () => DashboardStats | null;
    getRecentTasks: () => RecentTask[];
    getActiveProjects: () => ActiveProject[];
    getUpcomingDeadlines: () => UpcomingDeadline[];
    getRecentActivity: () => RecentActivity[];
    getDashboardData: () => DashboardSummary | null;

    // Utility Actions
    clearDashboard: () => void;
};

// Create Dashboard Store
export const useDashboardStore = create<DashboardStore>((set, get) => ({
    // Initial State
    dashboardData: null,
    lastUpdated: null,

    // Basic Set Actions
    setDashboardData: (data) =>
        set({
            dashboardData: data,
            lastUpdated: new Date().toISOString()
        }),

    setLastUpdated: (timestamp) =>
        set({ lastUpdated: timestamp }),

    // Section-specific Set Actions
    setStats: (stats) => {
        const { dashboardData } = get();
        if (dashboardData?.data) {
            set({
                dashboardData: {
                    ...dashboardData,
                    data: {
                        ...dashboardData.data,
                        stats
                    }
                },
                lastUpdated: new Date().toISOString()
            });
        }
    },

    setRecentTasks: (tasks) => {
        const { dashboardData } = get();
        if (dashboardData?.data) {
            set({
                dashboardData: {
                    ...dashboardData,
                    data: {
                        ...dashboardData.data,
                        recent_tasks: tasks
                    }
                },
                lastUpdated: new Date().toISOString()
            });
        }
    },

    setActiveProjects: (projects) => {
        const { dashboardData } = get();
        if (dashboardData?.data) {
            set({
                dashboardData: {
                    ...dashboardData,
                    data: {
                        ...dashboardData.data,
                        active_projects: projects
                    }
                },
                lastUpdated: new Date().toISOString()
            });
        }
    },

    setUpcomingDeadlines: (deadlines) => {
        const { dashboardData } = get();
        if (dashboardData?.data) {
            set({
                dashboardData: {
                    ...dashboardData,
                    data: {
                        ...dashboardData.data,
                        upcoming_deadlines: deadlines
                    }
                },
                lastUpdated: new Date().toISOString()
            });
        }
    },

    setRecentActivity: (activities) => {
        const { dashboardData } = get();
        if (dashboardData?.data) {
            set({
                dashboardData: {
                    ...dashboardData,
                    data: {
                        ...dashboardData.data,
                        recent_activity: activities
                    }
                },
                lastUpdated: new Date().toISOString()
            });
        }
    },

    // Get Actions (selectors)
    getStats: () => {
        const { dashboardData } = get();
        return dashboardData?.data?.stats || null;
    },

    getRecentTasks: () => {
        const { dashboardData } = get();
        return dashboardData?.data?.recent_tasks || [];
    },

    getActiveProjects: () => {
        const { dashboardData } = get();
        return dashboardData?.data?.active_projects || [];
    },

    getUpcomingDeadlines: () => {
        const { dashboardData } = get();
        return dashboardData?.data?.upcoming_deadlines || [];
    },

    getRecentActivity: () => {
        const { dashboardData } = get();
        return dashboardData?.data?.recent_activity || [];
    },

    getDashboardData: () => {
        const { dashboardData } = get();
        return dashboardData?.data || null;
    },

    // Utility Actions
    clearDashboard: () =>
        set({
            dashboardData: null,
            lastUpdated: null
        }),
}));