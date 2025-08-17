'use client'

import { useEffect, useState } from "react";
import organizationService from "@/services/organization/organizationService";
import { GetOrganizationActivitiesResponse } from "@/lib/types/organization";
import { useOrganizationStore } from "@/stores/organizationStore";
import Loading from "@/components/layout/LoadingPage";
import { useProjectStore } from "@/stores/projectStore";
import { Filter, ChevronDown, Clock, ChevronLeft, ChevronRight, Activity, Calendar, X, Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ActivityFilters {
    project_id: string;
    user_id: string;
    date_from: string;
    date_to: string;
    search: string;
    limit: number;
    offset: number;
}

// Custom Dropdown Component with Fixed Z-Index
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
                        className="fixed inset-0 z-[100000]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-[100001] w-full mt-2 py-2 bg-neutral-900/98 backdrop-blur-lg border border-neutral-600/60 rounded-xl shadow-2xl max-h-60 overflow-auto">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-700/60 transition-all duration-200 ${value === option.value
                                    ? 'bg-blue-900/40 text-blue-200 border-l-2 border-blue-400'
                                    : 'text-neutral-300 hover:text-neutral-100'
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

// Custom DatePicker Component with Fixed Z-Index
const CustomDatePicker = ({
    value,
    onChange,
    placeholder = "Select date",
    label = ""
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return placeholder;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDateChange = (date: Date | null) => {
        if (date) {
            // Format as date only (YYYY-MM-DD)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            onChange(dateString);
        }
        setIsOpen(false);
    };

    const clearDate = () => {
        onChange("");
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 border border-neutral-600/40 rounded-xl hover:border-neutral-500/60 hover:from-neutral-800/60 hover:to-neutral-700/40 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-300 text-left group shadow-lg backdrop-blur-sm"
            >
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className={`text-sm ${value ? 'text-neutral-100' : 'text-neutral-400'}`}>
                        {formatDisplayDate(value)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {value && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                clearDate();
                            }}
                            className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                            tabIndex={0}
                            role="button"
                            aria-label="Clear date"
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.stopPropagation();
                                    clearDate();
                                }
                            }}
                        >
                            <X className="w-4 h-4" />
                        </span>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Desktop Dropdown */}
            {!isMobile && isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100000]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-[100001] mt-2 bg-neutral-900/98 backdrop-blur-lg border border-neutral-600/60 rounded-xl shadow-2xl">
                        <div className="p-2">
                            <DatePicker
                                selected={value ? new Date(value) : null}
                                onChange={handleDateChange}
                                inline
                                calendarClassName="dark-datepicker"
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Modal */}
            {isMobile && isOpen && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/60">
                    <div className="bg-neutral-900 rounded-xl shadow-2xl p-4 w-[90vw] max-w-xs">
                        <div className="mb-4 text-sm text-neutral-300 font-semibold text-center">
                            {label || "Select Date"}
                        </div>
                        <DatePicker
                            selected={value ? new Date(value) : null}
                            onChange={handleDateChange}
                            inline
                            calendarClassName="dark-datepicker"
                            dateFormat="yyyy-MM-dd"
                        />
                        <div className="flex gap-2 mt-4 justify-center">
                            {value && (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearDate();
                                    }}
                                    className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                                    tabIndex={0}
                                    role="button"
                                    aria-label="Clear date"
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.stopPropagation();
                                            clearDate();
                                        }
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function OrganizationActivityPage() {
    const [organizationActivity, setOrganizationActivity] = useState<GetOrganizationActivitiesResponse | null>(null);
    const activeOrg = useOrganizationStore((state) => state.activeOrg);
    const orgMembers = useOrganizationStore((state) => state.members);
    const setMembers = useOrganizationStore((state) => state.setMembers);
    const recentProjects = useProjectStore((state) => state.projects);
    const [loading, setLoading] = useState<boolean>(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState<ActivityFilters>({
        project_id: "",
        user_id: "",
        date_from: "",
        date_to: "",
        search: "",
        limit: 20,
        offset: 0
    });

    // Fetch Organization members for user filter
    useEffect(() => {
        async function fetchMembers() {
            if (!activeOrg?.slug) return;
            try {
                const memberRes = await organizationService.getOrganizationMembers(activeOrg.slug);
                setMembers(memberRes.members || []);
            } catch (error) {
                console.error("Error fetching organization members:", error);
            }
        }
        if (orgMembers.length === 0) {
            fetchMembers();
        }
    }, [activeOrg, setMembers, orgMembers.length]);

    function cleanObject(obj: Record<string, any>) {
        const cleaned: Record<string, any> = {};
        Object.entries(obj).forEach(([key, value]) => {
            if (value !== "" && value !== undefined && value !== null) {
                cleaned[key] = value;
            }
        });
        return cleaned;
    }

    const fetchOrganizationActivity = async (newFilters: ActivityFilters = filters) => {
        if (!activeOrg) return;

        setLoading(true);
        try {
            const cleanedFilters = cleanObject(newFilters);
            const response = await organizationService.getOrganizationActivities(activeOrg.id, cleanedFilters);
            setOrganizationActivity(response);
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!activeOrg) return;
        fetchOrganizationActivity();
    }, [activeOrg?.id]);

    const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
        const newFilters = { ...filters, [key]: value, offset: 0 };
        setFilters(newFilters);
        fetchOrganizationActivity(newFilters);
    };

    const handlePageChange = (newOffset: number) => {
        const newFilters = { ...filters, offset: newOffset };
        setFilters(newFilters);
        fetchOrganizationActivity(newFilters);
    };

    const resetFilters = () => {
        const resetFilters = {
            project_id: "",
            user_id: "",
            date_from: "",
            date_to: "",
            search: "",
            limit: 20,
            offset: 0
        };
        setFilters(resetFilters);
        fetchOrganizationActivity(resetFilters);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleString();
    };

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return "";
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return formatDate(dateString);
    };

    const currentPage = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = organizationActivity ? Math.ceil(organizationActivity.total / filters.limit) : 0;

    // Project options for dropdown
    const projectOptions = [
        { value: "", label: "All Projects", color: "#6B7280" },
        ...(recentProjects?.map(project => ({
            value: project.id,
            label: project.name,
            color: project.color || "#3B82F6"
        })) || [])
    ];

    // User options for dropdown
    const userOptions = [
        { value: "", label: "All Users", color: "#6B7280" },
        ...(orgMembers?.map(member => ({
            value: member.id,
            label: member.name,
            color: "#3B82F6"
        })) || [])
    ];

    const limitsOptions = [
        { value: "10", label: "10 items", color: "#6B7280" },
        { value: "15", label: "15 items", color: "#6B7280" },
        { value: "20", label: "20 items", color: "#6B7280" }
    ];

    if (loading && !organizationActivity) {
        return <Loading />;
    }

    const hasActiveFilters = filters.project_id || filters.user_id || filters.date_from || filters.date_to || filters.search;

    return (
        <div className="min-h-screen text-neutral-100 pt-20 md:pt-16 lg:pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                {/* Header */}
                <div className="mb-8 md:mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-neutral-800/60 to-neutral-700/40 rounded-xl border border-neutral-700/50 shadow-lg">
                            <Activity className="w-6 h-6 md:w-7 md:h-7 text-neutral-300" />
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-300 bg-clip-text text-transparent">
                            Organization Activity
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                        Track all activities and changes happening in your organization in real-time.
                    </p>
                    {activeOrg && (
                        <p className="text-xs md:text-sm text-neutral-500 mt-1">{activeOrg.name}</p>
                    )}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/50 p-4 md:p-6 mb-6 shadow-xl relative z-[10]">
                    {/* Search and Filter Row */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md w-full">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-neutral-400" />
                            </div>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Search activities by descriptions..."
                                className="w-full pl-12 pr-4 py-3 bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 border border-neutral-600/40 rounded-xl hover:border-neutral-500/60 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-300 text-neutral-100 placeholder-neutral-400 shadow-lg backdrop-blur-sm"
                            />
                        </div>

                        {/* Filter Toggle Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neutral-700/60 to-neutral-600/40 hover:from-neutral-600/60 hover:to-neutral-500/40 border border-neutral-600/40 hover:border-neutral-500/60 rounded-xl transition-all duration-300 text-neutral-300 shadow-lg backdrop-blur-sm whitespace-nowrap ${hasActiveFilters ? 'ring-2 ring-blue-500/30' : ''
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="font-medium">Filters</span>
                            {hasActiveFilters && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            )}
                            <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Filter Options */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-neutral-700/50">
                            {/* Filter Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                {/* Project Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Project</label>
                                    <CustomDropdown
                                        value={filters.project_id}
                                        onChange={(value) => handleFilterChange('project_id', value)}
                                        options={projectOptions}
                                        placeholder="All Projects"
                                        showColors={true}
                                    />
                                </div>

                                {/* User Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">User</label>
                                    <CustomDropdown
                                        value={filters.user_id}
                                        onChange={(value) => handleFilterChange('user_id', value)}
                                        options={userOptions}
                                        placeholder="All Users"
                                        showColors={false}
                                    />
                                </div>

                                {/* From Date */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">From Date</label>
                                    <CustomDatePicker
                                        value={filters.date_from}
                                        onChange={(value) => handleFilterChange('date_from', value)}
                                        placeholder="From date"
                                    />
                                </div>

                                {/* To Date */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">To Date</label>
                                    <CustomDatePicker
                                        value={filters.date_to}
                                        onChange={(value) => handleFilterChange('date_to', value)}
                                        placeholder="To date"
                                    />
                                </div>

                                {/* Items per page */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Items per page</label>
                                    <CustomDropdown
                                        value={filters.limit.toString()}
                                        onChange={(value) => handleFilterChange('limit', parseInt(value))}
                                        options={limitsOptions}
                                        placeholder="Items per page"
                                    />
                                </div>
                            </div>

                            {/* Reset Button */}
                            <div className="flex gap-3">
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

                {/* Activity Feed */}
                <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm rounded-xl md:rounded-2xl border border-neutral-700/50 overflow-hidden shadow-xl relative z-[1]">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : organizationActivity && organizationActivity.activities && organizationActivity.activities.length > 0 ? (
                        <div className="divide-y divide-neutral-700/50">
                            {organizationActivity.activities.map((activity, index) => (
                                <div
                                    key={activity.id}
                                    className="p-4 md:p-6 hover:bg-neutral-700/20 transition-colors duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {activity.avatar.length <= 2 ? (
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg border border-blue-500/30">
                                                    {activity.avatar}
                                                </div>
                                            ) : (
                                                <img
                                                    src={activity.avatar}
                                                    alt={activity.user}
                                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-lg border border-neutral-600/30"
                                                />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-neutral-100">{activity.user}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{formatTimeAgo(activity.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="text-sm text-neutral-300 mb-2">
                                                {activity.item}
                                            </div>

                                            <div className="text-xs text-neutral-500">
                                                {formatDate(activity.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 md:py-24">
                            <div className="p-4 md:p-6 bg-neutral-800/30 rounded-2xl border border-neutral-700/30 mb-6">
                                <Activity className="w-12 h-12 md:w-16 md:h-16 text-neutral-500" />
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-300 mb-2">
                                No Activities Found
                            </h3>
                            <p className="text-sm md:text-base text-neutral-500 text-center max-w-md">
                                {hasActiveFilters
                                    ? "No activities match your current filters. Try adjusting the filters."
                                    : "No activities available yet. Start working on tasks and projects to see activity here."
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {organizationActivity && organizationActivity.total > 0 && (
                    <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 backdrop-blur-sm rounded-xl border border-neutral-700/50 mt-6 px-4 md:px-6 py-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-neutral-400">
                                Showing <span className="font-medium text-neutral-300">{filters.offset + 1}</span> to{" "}
                                <span className="font-medium text-neutral-300">{Math.min(filters.offset + filters.limit, organizationActivity.total)}</span> of{" "}
                                <span className="font-medium text-neutral-300">{organizationActivity.total}</span> activities
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
                                    disabled={!organizationActivity.has_more}
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