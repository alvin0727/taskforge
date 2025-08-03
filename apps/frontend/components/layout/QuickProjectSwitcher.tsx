// // components/QuickProjectSwitcher.tsx
// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//     ChevronDown,
//     Search,
//     Kanban,
//     Pin,
//     Clock,
//     Target,
//     Users
// } from 'lucide-react';
// import { useProjectStore } from '@/stores/projectStore';
// import { useOrganizationStore } from '@/stores/organizationStore';
// import { SidebarProject } from '@/lib/types/project';

// interface QuickProjectSwitcherProps {
//     className?: string;
//     variant?: 'default' | 'compact' | 'minimal';
// }

// export default function QuickProjectSwitcher({
//     className = '',
//     variant = 'default'
// }: QuickProjectSwitcherProps) {
//     const router = useRouter();
//     const [isOpen, setIsOpen] = useState(false);
//     const [searchQuery, setSearchQuery] = useState('');
//     const dropdownRef = useRef<HTMLDivElement>(null);

//     // Store states
//     const activeProject = useProjectStore((state) => state.activeProject);
//     const projects = useProjectStore((state) => state.projects);
//     const pinnedProjects = useProjectStore((state) => state.pinnedProjects);
//     const setActiveProject = useProjectStore((state) => state.setActiveProject);
//     const getSortedProjects = useProjectStore((state) => state.getSortedProjects);
//     const activeOrg = useOrganizationStore((state) => state.activeOrg);

//     // Filtered and sorted projects
//     const filteredProjects = React.useMemo(() => {
//         const sorted = getSortedProjects();
//         if (!searchQuery.trim()) return sorted;

//         return sorted.filter(project =>
//             project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             project.description?.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//     }, [projects, searchQuery, pinnedProjects, getSortedProjects]);

//     // Handle project selection
//     const handleProjectSelect = (project: SidebarProject) => {
//         setActiveProject(project);
//         router.push(`/protected/board?project=${project.id}`);
//         setIsOpen(false);
//         setSearchQuery('');
//     };

//     // Close dropdown on click outside
//     useEffect(() => {
//         function handleClickOutside(event: MouseEvent) {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//                 setIsOpen(false);
//                 setSearchQuery('');
//             }
//         }

//         if (isOpen) {
//             document.addEventListener('mousedown', handleClickOutside);
//         }

//         return () => document.removeEventListener('mousedown', handleClickOutside);
//     }, [isOpen]);

//     // Handle keyboard navigation
//     useEffect(() => {
//         function handleKeyDown(event: KeyboardEvent) {
//             if (event.key === 'Escape') {
//                 setIsOpen(false);
//                 setSearchQuery('');
//             }
//         }

//         if (isOpen) {
//             document.addEventListener('keydown', handleKeyDown);
//         }

//         return () => document.removeEventListener('keydown', handleKeyDown);
//     }, [isOpen]);

//     // Render variants
//     const renderTrigger = () => {
//         const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400";

//         switch (variant) {
//             case 'compact':
//                 return (
//                     <button
//                         onClick={() => setIsOpen(!isOpen)}
//                         className={`${baseClasses} bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700`}
//                     >
//                         <div
//                             className="w-4 h-4 rounded flex-shrink-0"
//                             style={{ backgroundColor: activeProject?.color || '#64748b' }}
//                         />
//                         <span className="text-sm font-medium truncate max-w-32">
//                             {activeProject?.name || 'Select Project'}
//                         </span>
//                         <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//                     </button>
//                 );

//             case 'minimal':
//                 return (
//                     <button
//                         onClick={() => setIsOpen(!isOpen)}
//                         className={`${baseClasses} text-neutral-400 hover:text-neutral-300`}
//                     >
//                         <Target size={16} />
//                         <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//                     </button>
//                 );

//             default:
//                 return (
//                     <button
//                         onClick={() => setIsOpen(!isOpen)}
//                         className={`${baseClasses} bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 min-w-60`}
//                     >
//                         <div className="flex items-center gap-3 flex-1">
//                             <div
//                                 className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
//                                 style={{ backgroundColor: activeProject?.color || '#64748b' }}
//                             >
//                                 {activeProject?.name ? activeProject.name[0] : 'P'}
//                             </div>
//                             <div className="flex-1 text-left">
//                                 <div className="text-sm font-medium text-neutral-300">
//                                     {activeProject?.name || 'Select Project'}
//                                 </div>
//                                 <div className="text-xs text-neutral-500">
//                                     {activeProject ? `${activeProject.stats || 0} tasks` : 'No project selected'}
//                                 </div>
//                             </div>
//                         </div>
//                         <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//                     </button>
//                 );
//         }
//     };

//     return (
//         <div className={`relative ${className}`} ref={dropdownRef}>
//             {renderTrigger()}

//             {isOpen && (
//                 <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 min-w-80">
//                     {/* Header */}
//                     <div className="p-3 border-b border-neutral-800">
//                         <div className="flex items-center gap-2 text-neutral-400 text-sm mb-3">
//                             <Target size={16} />
//                             <span>Switch Project</span>
//                             <span className="text-neutral-600">•</span>
//                             <span>{activeOrg?.name}</span>
//                         </div>

//                         {/* Search */}
//                         <div className="relative">
//                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
//                             <input
//                                 type="text"
//                                 placeholder="Search projects..."
//                                 value={searchQuery}
//                                 onChange={(e) => setSearchQuery(e.target.value)}
//                                 className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                                 autoFocus
//                             />
//                         </div>
//                     </div>

//                     {/* Projects List */}
//                     <div className="max-h-80 overflow-y-auto">
//                         {filteredProjects.length === 0 ? (
//                             <div className="p-4 text-center text-neutral-500 text-sm">
//                                 {searchQuery ? 'No projects found' : 'No projects available'}
//                             </div>
//                         ) : (
//                             <div className="p-2">
//                                 {filteredProjects.map((project) => (
//                                     <button
//                                         key={project.id}
//                                         onClick={() => handleProjectSelect(project)}
//                                         className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-neutral-800 focus:outline-none focus:bg-neutral-800 ${activeProject?.id === project.id ? 'bg-blue-600/20 text-blue-400' : ''
//                                             }`}
//                                     >
//                                         <div
//                                             className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
//                                             style={{ backgroundColor: project.color || '#64748b' }}
//                                         >
//                                             {project.name[0]}
//                                         </div>

//                                         <div className="flex-1 min-w-0">
//                                             <div className="flex items-center gap-2">
//                                                 <span className="font-medium truncate">{project.name}</span>
//                                                 {pinnedProjects.has(project.id) && (
//                                                     <Pin size={12} className="text-yellow-400 flex-shrink-0" />
//                                                 )}
//                                                 {activeProject?.id === project.id && (
//                                                     <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
//                                                 )}
//                                             </div>
//                                             {project.description && (
//                                                 <div className="text-xs text-neutral-500 truncate mt-1">
//                                                     {project.description}
//                                                 </div>
//                                             )}
//                                         </div>

//                                         <div className="flex flex-col items-end gap-1 text-xs text-neutral-500">
//                                             <div className="flex items-center gap-1">
//                                                 <Kanban size={12} />
//                                                 <span>{project.stats || 0}</span>
//                                             </div>
//                                             {project.lastAccessed && (
//                                                 <div className="flex items-center gap-1">
//                                                     <Clock size={12} />
//                                                     <span>{new Date(project.lastAccessed).toLocaleDateString()}</span>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </button>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     {/* Footer */}
//                     <div className="border-t border-neutral-800 p-2">
//                         <button
//                             onClick={() => {
//                                 setIsOpen(false);
//                                 router.push('/protected/projects/new');
//                             }}
//                             className="flex items-center gap-2 w-full text-left px-3 py-2 text-neutral-400 hover:bg-neutral-800 hover:text-blue-400 text-sm rounded-lg transition-colors"
//                         >
//                             <Target size={14} />
//                             Create New Project
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }