'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import organizationService from "@/services/organization/organizationService";
import { GetOrganizationTasksResponse } from "@/lib/types/organization";
import { useOrganizationStore } from "@/stores/organizationStore";
import Loading from "@/components/layout/LoadingPage";
import { useProjectStore } from "@/stores/projectStore";
import { Search, Filter, ChevronDown, Calendar, User, AlertCircle, Clock, ChevronLeft, ChevronRight, CheckSquare, ListTodo, X } from "lucide-react";

interface TaskFilters {
    project_id: string;
    assignee_id: string;
    status: string;
    priority: string;
    search: string;
    limit: number;
    offset: number;
}

const statusOptions = [
    { value: "", label: "All Status", color: "#6B7280" },
    { value: "backlog", label: "Backlog", color: "#6B7280" },
    { value: "todo", label: "To Do", color: "#3B82F6" },
    { value: "in_progress", label: "In Progress", color: "#F59E0B" },
    { value: "review", label: "Review", color: "#8B5CF6" },
    { value: "done", label: "Done", color: "#10B981" },
    { value: "canceled", label: "Canceled", color: "#EF4444" }
];

const priorityOptions = [
    { value: "", label: "All Priority", color: "#6B7280" },
    { value: "low", label: "Low", color: "#10B981" },
    { value: "medium", label: "Medium", color: "#F59E0B" },
    { value: "high", label: "High", color: "#F97316" },
    { value: "urgent", label: "Urgent", color: "#EF4444" }
];

// Custom Dropdown Component
const CustomDropdown = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    showColors = false,
    className = "",
    label = ""
}: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; color?: string }>;
    placeholder?: string;
    showColors?: boolean;
    className?: string;
    label?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 border border-neutral-600/40 rounded-xl hover:border-neutral-500/60 hover:from-neutral-800/60 hover:to-neutral-700/40 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-300 text-left group shadow-lg backdrop-blur-sm"
            >
                <div className="flex items-center gap-3">
                    {showColors && selectedOption?.color && (
                        <div
                            className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20"
                            style={{ backgroundColor: selectedOption.color }}
                        />
                    )}
                    <span className={`text-sm ${selectedOption ? 'text-neutral-100' : 'text-neutral-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-[99999] w-full mt-2 py-2 bg-neutral-900/98 backdrop-blur-lg border border-neutral-600/60 rounded-xl shadow-2xl max-h-60 overflow-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700/60 transition-all duration-200 ${value === option.value ? 'bg-blue-900/40 text-blue-200 border-l-2 border-blue-400' : 'text-neutral-300 hover:text-neutral-100'
                                    }`}
                            >
                                {showColors && option.color && (
                                    <div
                                        className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20 flex-shrink-0"
                                        style={{ backgroundColor: option.color }}
                                    />
                                )}
                                <span className="text-sm font-medium truncate">{option.label}</span>
                                {value === option.value && (
                                    <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'backlog': return 'bg-neutral-700/50 text-neutral-300 border border-neutral-600/30';
        case 'todo': return 'bg-blue-900/40 text-blue-300 border border-blue-700/40';
        case 'in_progress': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40';
        case 'review': return 'bg-purple-900/40 text-purple-300 border border-purple-700/40';
        case 'done': return 'bg-green-900/40 text-green-300 border border-green-700/40';
        case 'canceled': return 'bg-red-900/40 text-red-300 border border-red-700/40';
        default: return 'bg-neutral-700/50 text-neutral-300 border border-neutral-600/30';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'low': return 'text-green-400';
        case 'medium': return 'text-yellow-400';
        case 'high': return 'text-orange-400';
        case 'urgent': return 'text-red-400';
        default: return 'text-neutral-400';
    }
};

const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'urgent': return <AlertCircle className="w-4 h-4" />;
        case 'high': return <Clock className="w-4 h-4" />;
        default: return null;
    }
};

export default function OrganizationTaskPage() {
    const router = useRouter();
    const [organizationTask, setOrganizationTask] = useState<GetOrganizationTasksResponse | null>(null);
    const activeOrg = useOrganizationStore((state) => state.activeOrg);
    const recentProjects = useProjectStore((state) => state.projects);
    const [loading, setLoading] = useState<boolean>(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [filters, setFilters] = useState<TaskFilters>({
        project_id: "",
        assignee_id: "",
        status: "",
        priority: "",
        search: "",
        limit: 10,
        offset: 0
    });

    function cleanObject(obj: Record<string, any>) {
        const cleaned: Record<string, any> = {};
        Object.entries(obj).forEach(([key, value]) => {
            if (value !== "" && value !== undefined && value !== null) {
                cleaned[key] = value;
            }
        });
        return cleaned;
    }

    const fetchOrganizationTask = async (newFilters: TaskFilters = filters) => {
        if (!activeOrg) return;

        setLoading(true);
        try {
            const cleanedFilters = cleanObject(newFilters);
            const response = await organizationService.getOrganizationTask(activeOrg.id, cleanedFilters);
            setOrganizationTask(response);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!activeOrg) return;
        fetchOrganizationTask();
    }, [activeOrg?.id]);

    // Handle search input with debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search !== searchTerm) {
                const newFilters = { ...filters, search: searchTerm, offset: 0 };
                setFilters(newFilters);
                fetchOrganizationTask(newFilters);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleFilterChange = (key: keyof TaskFilters, value: any) => {
        const newFilters = { ...filters, [key]: value, offset: 0 };
        setFilters(newFilters);
        fetchOrganizationTask(newFilters);
    };

    const handlePageChange = (newOffset: number) => {
        const newFilters = { ...filters, offset: newOffset };
        setFilters(newFilters);
        fetchOrganizationTask(newFilters);
    };

    const resetFilters = () => {
        const resetFilters = {
            project_id: "",
            assignee_id: "",
            status: "",
            priority: "",
            search: "",
            limit: 10,
            offset: 0
        };
        setFilters(resetFilters);
        setSearchTerm("");
        fetchOrganizationTask(resetFilters);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString();
    };

    const currentPage = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = organizationTask ? Math.ceil(organizationTask.total / filters.limit) : 0;

    // Project options for dropdown
    const projectOptions = [
        { value: "", label: "All Projects", color: "#6B7280" },
        ...(recentProjects?.map(project => ({
            value: project.id,
            label: project.name,
            color: project.color || "#3B82F6"
        })) || [])
    ];

    const limitsOptions = [
        { value: "10", label: "10 items", color: "#6B7280" },
        { value: "20", label: "20 items", color: "#6B7280" },
        { value: "50", label: "50 items", color: "#6B7280" }
    ];

    if (loading && !organizationTask) {
        return <Loading />;
    }

    const hasActiveFilters = filters.project_id || filters.status || filters.priority || filters.search;

    return (
        <div className="min-h-screen text-neutral-100 pt-20 md:pt-16 lg:pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* Header */}
                <div className="mb-8 md:mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-neutral-800/60 to-neutral-700/40 rounded-xl border border-neutral-700/50 shadow-lg">
                            <CheckSquare className="w-6 h-6 md:w-7 md:h-7 text-neutral-300" />
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                            Organization Tasks
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                        View and manage all tasks across your organization. Track progress and stay organized.
                    </p>
                    {activeOrg && (
                        <p className="text-xs md:text-sm text-neutral-500 mt-1">{activeOrg.name}</p>
                    )}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/50 p-4 md:p-6 mb-6 shadow-xl relative z-50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tasks by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-10 py-3 bg-gradient-to-r from-neutral-900/60 to-neutral-800/40 border border-neutral-600/40 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 text-neutral-100 placeholder-neutral-500 transition-all duration-300 shadow-lg backdrop-blur-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neutral-700/60 to-neutral-600/40 hover:from-neutral-600/60 hover:to-neutral-500/40 border border-neutral-600/40 hover:border-neutral-500/60 rounded-xl transition-all duration-300 text-neutral-300 shadow-lg backdrop-blur-sm ${hasActiveFilters ? 'ring-2 ring-blue-500/30' : ''
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline font-medium">Filters</span>
                            {hasActiveFilters && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            )}
                            <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-neutral-700/50 relative z-[100]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Project Filter */}
                                <CustomDropdown
                                    value={filters.project_id}
                                    onChange={(value) => handleFilterChange('project_id', value)}
                                    options={projectOptions}
                                    placeholder="All Projects"
                                    showColors={true}
                                    label="Project"
                                />

                                {/* Status Filter */}
                                <CustomDropdown
                                    value={filters.status}
                                    onChange={(value) => handleFilterChange('status', value)}
                                    options={statusOptions}
                                    placeholder="All Status"
                                    showColors={true}
                                    label="Status"
                                />

                                {/* Priority Filter */}
                                <CustomDropdown
                                    value={filters.priority}
                                    onChange={(value) => handleFilterChange('priority', value)}
                                    options={priorityOptions}
                                    placeholder="All Priority"
                                    showColors={true}
                                    label="Priority"
                                />

                                {/* Items per page */}
                                <CustomDropdown
                                    value={filters.limit.toString()}
                                    onChange={(value) => handleFilterChange('limit', parseInt(value))}
                                    options={limitsOptions}
                                    placeholder="Items per page"
                                    label="Items per page"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30 rounded-lg transition-all duration-200"
                                >
                                    Reset All Filters
                                </button>
                                {hasActiveFilters && (
                                    <div className="text-sm text-neutral-500 flex items-center">
                                        <span>Active filters applied</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tasks List */}
                <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/50 overflow-hidden shadow-xl relative z-10">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : organizationTask && organizationTask.tasks && organizationTask.tasks.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-900/60 border-b border-neutral-700/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Task</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Project</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Assignee</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-700/50">
                                        {organizationTask.tasks.map((task) => (
                                            <tr
                                                key={task.id}
                                                className="hover:bg-neutral-700/30 transition-colors duration-200 cursor-pointer"
                                                onClick={() => router.push(`/task?task_id=${task.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-neutral-100">{task.title}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full shadow-lg ring-1 ring-white/20"
                                                            style={{ backgroundColor: task.project_color }}
                                                        ></div>
                                                        <span className="text-sm text-neutral-300">{task.project}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`flex items-center gap-1 text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                                        {getPriorityIcon(task.priority)}
                                                        <span className="capitalize">{task.priority}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-neutral-500" />
                                                        <span className="text-sm text-neutral-300">{task.assignee || "Unassigned"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                                                        <Calendar className="w-4 h-4 text-neutral-500" />
                                                        <span>{formatDate(task.due_date ?? "")}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-neutral-700/50">
                                {organizationTask.tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-4 hover:bg-neutral-700/20 transition-colors duration-200 cursor-pointer"
                                        onClick={() => router.push(`/task?task_id=${task.id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-medium text-neutral-100 pr-2 line-clamp-2">{task.title}</h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)} flex-shrink-0`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div
                                                className="w-3 h-3 rounded-full shadow-lg ring-1 ring-white/20"
                                                style={{ backgroundColor: task.project_color }}
                                            ></div>
                                            <span className="text-sm text-neutral-300">{task.project}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className={`flex items-center gap-1 font-medium ${getPriorityColor(task.priority)}`}>
                                                {getPriorityIcon(task.priority)}
                                                <span className="capitalize">{task.priority}</span>
                                            </div>

                                            <div className="flex items-center gap-1 text-neutral-400">
                                                <User className="w-4 h-4" />
                                                <span>{task.assignee || "Unassigned"}</span>
                                            </div>

                                            {task.due_date && (
                                                <div className="flex items-center gap-1 text-neutral-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(task.due_date)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 md:py-24">
                            <div className="p-4 md:p-6 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 mb-6">
                                <ListTodo className="w-12 h-12 md:w-16 md:h-16 text-neutral-500" />
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-300 mb-2">
                                No Tasks Found
                            </h3>
                            <p className="text-sm md:text-base text-neutral-500 text-center max-w-md">
                                {hasActiveFilters
                                    ? "No tasks match your current filters. Try adjusting the filters or search terms."
                                    : "No tasks available. Create some tasks to get started."
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {organizationTask && organizationTask.total > 0 && (
                    <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm rounded-xl border border-neutral-700/50 mt-6 px-4 md:px-6 py-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-neutral-400">
                                Showing <span className="font-medium text-neutral-300">{filters.offset + 1}</span> to{" "}
                                <span className="font-medium text-neutral-300">{Math.min(filters.offset + filters.limit, organizationTask.total)}</span> of{" "}
                                <span className="font-medium text-neutral-300">{organizationTask.total}</span> tasks
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                                    disabled={filters.offset === 0}
                                    className="p-3 border border-neutral-600/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700/50 hover:border-neutral-500/50 transition-all duration-200 text-neutral-300 shadow-lg"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <span className="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700/40 rounded-xl border border-neutral-600/30 shadow-lg">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(filters.offset + filters.limit)}
                                    disabled={!organizationTask.has_more}
                                    className="p-3 border border-neutral-600/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700/50 hover:border-neutral-500/50 transition-all duration-200 text-neutral-300 shadow-lg"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}