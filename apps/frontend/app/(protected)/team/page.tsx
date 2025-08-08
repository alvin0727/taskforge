"use client";

import { useEffect, useState } from "react";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useProjectStore } from "@/stores/projectStore";
import { ProjectMember } from "@/lib/types/project";
import { OrganizationMember } from "@/lib/types/organization";
import projectService from "@/services/projects/projectService";
import Loading from "@/components/layout/Loading";
import {
    Users,
    Mail,
    Crown,
    Clock,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Plus,
    X,
    UserPlus,
    MoreVertical,
    ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

function isUrl(str?: string) {
    return !!str && (str.startsWith("http://") || str.startsWith("https://"));
}

interface PaginationState {
    [key: string]: {
        currentPage: number;
    };
}

interface LoadingState {
    organization: boolean;
    projects: { [projectId: string]: boolean };
    addingMember: { [projectId: string]: boolean };
}

interface AddMemberModalState {
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
}

const ITEMS_PER_PAGE = 10;

export default function TeamPage() {
    // Organization
    const orgMembers = useOrganizationStore((state) => state.members);
    const activeOrg = useOrganizationStore((state) => state.activeOrg);

    // Project
    const projects = useProjectStore((state) => state.projects);
    const projectMembersMap = useProjectStore((state) => state.projectMembers);
    const setProjectMembers = useProjectStore((state) => state.setProjectMembers);

    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        organization: { currentPage: 1 }
    });
    const [loading, setLoading] = useState<LoadingState>({
        organization: false,
        projects: {},
        addingMember: {}
    });
    const [addMemberModal, setAddMemberModal] = useState<AddMemberModalState>({
        isOpen: false,
        projectId: null,
        projectName: ""
    });
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    // Check screen size and set appropriate view mode
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            // Use card view for screens smaller than 1024px (including iPad Mini)
            if (width < 1024) {
                setViewMode('card');
            } else {
                setViewMode('table');
            }
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Initialize pagination for projects
    useEffect(() => {
        const newPagination = { ...pagination };
        projects.forEach(project => {
            if (!newPagination[project.id]) {
                newPagination[project.id] = { currentPage: 1 };
            }
        });
        setPagination(newPagination);
    }, [projects]);

    // Load project members for all projects
    useEffect(() => {
        if (!activeOrg) return;

        projects.forEach(async (project) => {
            // Check if data already exists in store
            const existingMembers = projectMembersMap[project.id];
            if (existingMembers && existingMembers.length > 0) {
                return; // Skip fetching if data already exists
            }

            // Check if already loading this project
            if (loading.projects[project.id]) {
                return; // Skip if already loading
            }

            // Set loading state for this project only
            setLoading(prev => ({
                ...prev,
                projects: { ...prev.projects, [project.id]: true }
            }));

            try {
                const data = await projectService.getProjectMembers(activeOrg.id, project.slug);
                setProjectMembers(project.id, data.members);
            } catch (error) {
                console.error(`Failed to fetch members for project ${project.slug}:`, error);
            } finally {
                setLoading(prev => ({
                    ...prev,
                    projects: { ...prev.projects, [project.id]: false }
                }));
            }
        });
    }, [projects, activeOrg, setProjectMembers, projectMembersMap, loading.projects]);

    // Filter members based on search term
    const filterMembers = (members: (OrganizationMember | ProjectMember)[]) => {
        if (!searchTerm) return members;
        return members.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.role && member.role.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const filteredOrgMembers = filterMembers(orgMembers);

    // Get available members to add to project (org members not already in project)
    const getAvailableMembers = (projectId: string) => {
        const projectMembers = projectMembersMap[projectId] || [];
        const projectMemberEmails = new Set(projectMembers.map(member => member.email));
        return orgMembers.filter(member => !projectMemberEmails.has(member.email));
    };

    const handleAddMembersToProject = async () => {
        if (!addMemberModal.projectId || selectedMembers.length === 0 || !activeOrg) return;

        const project = projects.find(p => p.id === addMemberModal.projectId);
        if (!project) return;

        setLoading(prev => ({
            ...prev,
            addingMember: { ...prev.addingMember, [addMemberModal.projectId!]: true }
        }));

        try {
            // Call API to add members
            const result = await projectService.addMembersToProject(
                activeOrg.id,
                project.slug,
                selectedMembers
            );

            // Update store with new members directly (no need to refetch)
            if (result.added.length > 0) {
                const currentMembers = projectMembersMap[addMemberModal.projectId!] || [];
                const updatedMembers = [...currentMembers, ...result.added];
                setProjectMembers(addMemberModal.projectId!, updatedMembers);
            }

            // Show success/warning messages based on results
            if (result.summary.successfully_added > 0) {
                toast.success(
                    `Successfully added ${result.summary.successfully_added} member(s) to ${project.name}`
                );
            }

            if (result.summary.failed_to_add > 0) {
                const failedReasons = result.failed.map(f => f.reason).join(', ');
                toast.error(`Failed to add ${result.summary.failed_to_add} member(s): ${failedReasons}`);
            }

            // Reset modal state
            setAddMemberModal({ isOpen: false, projectId: null, projectName: "" });
            setSelectedMembers([]);

        } catch (error) {
            console.error("Failed to add members to project:", error);
            toast.error("Failed to add members to project");
        } finally {
            setLoading(prev => ({
                ...prev,
                addingMember: { ...prev.addingMember, [addMemberModal.projectId!]: false }
            }));
        }
    };

    // Open add member modal
    const openAddMemberModal = (projectId: string, projectName: string) => {
        setAddMemberModal({
            isOpen: true,
            projectId,
            projectName
        });
        setSelectedMembers([]);
    };

    // Close add member modal
    const closeAddMemberModal = () => {
        setAddMemberModal({ isOpen: false, projectId: null, projectName: "" });
        setSelectedMembers([]);
    };

    // Toggle member selection
    const toggleMemberSelection = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    // Pagination helper functions
    const updatePagination = (key: string, currentPage: number) => {
        setPagination(prev => ({
            ...prev,
            [key]: { currentPage }
        }));
    };

    const getPaginatedData = (data: any[], key: string) => {
        const currentPage = pagination[key]?.currentPage || 1;
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return {
            data: data.slice(startIndex, endIndex),
            totalPages: Math.ceil(data.length / ITEMS_PER_PAGE),
            currentPage,
            totalItems: data.length
        };
    };

    const getRoleColor = (role?: string) => {
        if (!role) return 'text-neutral-400 bg-neutral-400/10';
        switch (role.toLowerCase()) {
            case 'admin':
            case 'owner':
                return 'text-red-400 bg-red-400/10';
            case 'manager':
            case 'lead':
                return 'text-blue-400 bg-blue-400/10';
            case 'member':
                return 'text-green-400 bg-green-400/10';
            default:
                return 'text-purple-400 bg-purple-400/10';
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) return 'text-neutral-400 bg-neutral-400/10';
        switch (status.toLowerCase()) {
            case 'active':
                return 'text-green-400 bg-green-400/10';
            case 'inactive':
                return 'text-red-400 bg-red-400/10';
            case 'pending':
                return 'text-yellow-400 bg-yellow-400/10';
            default:
                return 'text-neutral-400 bg-neutral-400/10';
        }
    };

    const PaginationControls = ({
        totalPages,
        currentPage,
        onPageChange,
        totalItems
    }: {
        totalPages: number;
        currentPage: number;
        onPageChange: (page: number) => void;
        totalItems: number;
    }) => {
        const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

        if (totalPages <= 1) return null;

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-4 border-t border-neutral-800">
                <div className="text-sm text-neutral-400 text-center sm:text-left">
                    Showing {startItem}-{endItem} of {totalItems}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1 text-sm text-white bg-neutral-800 rounded mx-2">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    // Enhanced Member Card for iPad and mobile
    const MemberCard = ({ member }: { member: OrganizationMember | ProjectMember }) => (
        <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4 hover:bg-neutral-800/50 transition-colors">
            {/* Header with avatar and name */}
            <div className="flex items-start gap-3 mb-3">
                {isUrl(member.avatar) ? (
                    <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {member.avatar ? member.avatar : member.name[0].toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="text-white font-medium mb-1">{member.name}</div>
                    <div className="text-sm text-neutral-400 flex items-center gap-1 mb-2">
                        <Mail size={12} />
                        <span className="truncate">{member.email}</span>
                    </div>
                    
                    {/* Tags in a more compact layout */}
                    <div className="flex flex-wrap gap-1.5">
                        {member.role && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                                {member.role}
                            </span>
                        )}
                        {member.status && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(member.status)}`}>
                                {member.status}
                            </span>
                        )}
                        {member.joined_at && (
                            <span className="flex items-center gap-1 text-neutral-400 text-xs px-2 py-0.5 bg-neutral-700/50 rounded">
                                <Clock size={10} />
                                {new Date(member.joined_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: '2-digit' 
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const MemberTable = ({
        members,
        paginationKey,
        isLoading = false
    }: {
        members: (OrganizationMember | ProjectMember)[],
        paginationKey: string,
        isLoading?: boolean
    }) => {
        const paginatedData = getPaginatedData(members, paginationKey);

        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loading />
                </div>
            );
        }

        if (members.length === 0) {
            return (
                <div className="text-center py-12">
                    <Users className="mx-auto text-neutral-600 mb-4" size={48} />
                    <p className="text-neutral-400">No members found.</p>
                </div>
            );
        }

        return (
            <>
                {viewMode === 'card' ? (
                    // Card layout for iPad Mini and smaller screens
                    <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {paginatedData.data.map((member: OrganizationMember | ProjectMember) => (
                                <MemberCard key={member.id} member={member} />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Table layout for larger screens
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-800">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Member</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Email</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Role</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.data.map((member: OrganizationMember | ProjectMember) => (
                                    <tr key={member.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/25 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {isUrl(member.avatar) ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                                        {member.avatar ? member.avatar : member.name[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-white font-medium">{member.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-neutral-300">
                                                <Mail size={14} className="text-neutral-400" />
                                                <span className="text-sm">{member.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {member.role ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                                                    {member.role}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {member.status ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                                                    {member.status}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {member.joined_at ? (
                                                <div className="flex items-center gap-1 text-neutral-400 text-sm">
                                                    <Clock size={12} />
                                                    <span>{new Date(member.joined_at).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-500">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PaginationControls
                    totalPages={paginatedData.totalPages}
                    currentPage={paginatedData.currentPage}
                    onPageChange={(page) => updatePagination(paginationKey, page)}
                    totalItems={paginatedData.totalItems}
                />
            </>
        );
    };

    // Add Member Modal Component
    const AddMemberModal = () => {
        if (!addMemberModal.isOpen || !addMemberModal.projectId) return null;

        const availableMembers = getAvailableMembers(addMemberModal.projectId);
        const isLoading = loading.addingMember[addMemberModal.projectId] || false;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 lg:p-6 border-b border-neutral-800 flex-shrink-0">
                        <h2 className="text-lg lg:text-xl font-semibold text-white truncate pr-4">
                            Add Members to {addMemberModal.projectName}
                        </h2>
                        <button
                            onClick={closeAddMemberModal}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
                        {availableMembers.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="mx-auto text-neutral-600 mb-4" size={48} />
                                <p className="text-neutral-400">All organization members are already in this project.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-neutral-400">
                                        Select members to add ({selectedMembers.length} selected)
                                    </p>
                                </div>

                                <div className="space-y-2 mb-6">
                                    {availableMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            onClick={() => toggleMemberSelection(member.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(member.id)
                                                ? 'bg-blue-600/20 border border-blue-600/50'
                                                : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => toggleMemberSelection(member.id)}
                                                className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 flex-shrink-0"
                                            />

                                            {isUrl(member.avatar) ? (
                                                <img
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                    {member.avatar ? member.avatar : member.name[0].toUpperCase()}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{member.name}</div>
                                                <div className="text-sm text-neutral-400 truncate">{member.email}</div>
                                            </div>

                                            {member.role && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(member.role)} flex-shrink-0`}>
                                                    {member.role}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {availableMembers.length > 0 && (
                        <div className="p-4 lg:p-6 border-t border-neutral-800 flex-shrink-0">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                                <button
                                    onClick={closeAddMemberModal}
                                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMembersToProject}
                                    disabled={selectedMembers.length === 0 || isLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors order-1 sm:order-2"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <UserPlus size={16} />
                                    )}
                                    Add Members ({selectedMembers.length})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Show loading when organization is loading OR no active organization
    if (loading.organization || !activeOrg) {
        return (
            <Loading />
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 pt-16 lg:pt-0">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Team Members</h1>
                    <p className="text-sm lg:text-base text-neutral-400">
                        Manage and view members in <span className="text-blue-400 font-medium">{activeOrg.name}</span>
                    </p>
                </div>

                {/* Search and controls */}
                <div className="mb-4 lg:mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <button className="p-2.5 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                {/* Organization Members */}
                <div className="mb-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-neutral-800">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                                    <Users className="text-blue-400" size={20} />
                                </div>
                                <h2 className="text-lg lg:text-xl font-semibold text-white truncate">Organization Members</h2>
                                <span className="text-xs lg:text-sm text-neutral-400 bg-neutral-800 px-2 py-1 rounded flex-shrink-0">
                                    {filteredOrgMembers.length}
                                </span>
                            </div>
                            {loading.organization && (
                                <div className="flex-shrink-0">
                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <MemberTable
                            members={filteredOrgMembers}
                            paginationKey="organization"
                            isLoading={loading.organization}
                        />
                    </div>
                </div>

                {/* Project Members */}
                <div className="space-y-6">
                    {projects.length === 0 ? (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <div className="text-center py-8">
                                <Users className="mx-auto text-neutral-600 mb-4" size={48} />
                                <p className="text-neutral-400">No projects found.</p>
                            </div>
                        </div>
                    ) : (
                        projects.map((project) => {
                            const members = projectMembersMap[project.id] || [];
                            const filteredMembers = filterMembers(members);
                            const isProjectLoading = loading.projects[project.id] || false;
                            const availableToAdd = getAvailableMembers(project.id);

                            return (
                                <div key={project.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-neutral-800">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className={`w-3 h-3 rounded-full flex-shrink-0 ${project.color || 'bg-blue-500'}`}
                                            ></div>
                                            <h2 className="text-lg lg:text-xl font-semibold text-white truncate">{project.name}</h2>
                                            <span className="text-xs lg:text-sm text-neutral-400 bg-neutral-800 px-2 py-1 rounded flex-shrink-0">
                                                {filteredMembers.length}
                                            </span>
                                            {isProjectLoading && (
                                                <div className="flex-shrink-0">
                                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>

                                        {availableToAdd.length > 0 && (
                                            <button
                                                onClick={() => openAddMemberModal(project.id, project.name)}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex-shrink-0"
                                            >
                                                <Plus size={16} />
                                                <span className="hidden sm:inline">Add Members</span>
                                                <span className="sm:hidden">Add</span>
                                            </button>
                                        )}
                                    </div>

                                    <MemberTable
                                        members={filteredMembers}
                                        paginationKey={project.id}
                                        isLoading={isProjectLoading}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Add Member Modal */}
            <AddMemberModal />
        </div>
    );
}