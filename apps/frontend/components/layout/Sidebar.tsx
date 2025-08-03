'use client';

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  Kanban,
  CheckSquare,
  GitBranch,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Archive,
  Star,
  Clock,
  Target,
  Building2
} from "lucide-react";
import { useOrganizationStore } from "@/stores/organizationStore";
import organizationService from "@/services/organization/organizationService";
import projectService from "@/services/projects/projectService";
import { useUserStore } from "@/stores/userStore";
import { Organization } from "@/lib/types/organization";
import { SidebarProject } from "@/lib/types/project";


const navLinks = [
  { name: "Dashboard", href: "/protected/dashboard", icon: Home, iconColor: "text-blue-400" },
  { name: "Board", href: "/protected/board", icon: Kanban, iconColor: "text-purple-400" },
  { name: "Tasks", href: "/protected/task", icon: CheckSquare, iconColor: "text-green-400" },
  { name: "Workflows", href: "/protected/workflow", icon: GitBranch, iconColor: "text-orange-400" },
  { name: "Team", href: "/protected/team", icon: Users, iconColor: "text-pink-400" },
  { name: "Calendar", href: "/protected/calendar", icon: Calendar, iconColor: "text-red-400" },
  { name: "Analytics", href: "/protected/analytics", icon: BarChart3, iconColor: "text-cyan-400" },
];

const quickActions = [
  { name: "Create Task", icon: Plus, action: "create-task" },
  { name: "New Project", icon: Target, action: "create-project" },
];

const favorites = [
  { name: "Sprint Planning", href: "/protected/sprint", icon: Clock, iconColor: "text-yellow-400" },
  { name: "Archived Projects", href: "/protected/archive", icon: Archive, iconColor: "text-gray-400" },
  { name: "Starred Items", href: "/protected/starred", icon: Star, iconColor: "text-amber-400" },
];

export default function Sidebar() {
  const defaultProfile = {
    avatar_url: "",
    bio: "",
    phone: "",
    timezone: "",
    location: "",
    website: "",
    language: "",
    theme: ""
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenu, setAvatarMenu] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const user = useUserStore((state) => state.user);
  const organizations = useOrganizationStore((state) => state.organizations);
  const activeOrg = useOrganizationStore((state) => state.activeOrg);
  const setActiveOrg = useOrganizationStore((state) => state.setActiveOrg);
  const [recentProjects, setRecentProjects] = useState<SidebarProject[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch organizations
        const res = await organizationService.getMyOrganizations();
        useOrganizationStore.getState().setOrganizations(res.organizations, res.total);

        // Check activeOrg
        const activeOrgId = user?.active_organization_id;
        let activeOrg = null;
        if (activeOrgId) {
          activeOrg = res.organizations.find((org: Organization) => org.id === activeOrgId);
        }
        if (!activeOrg && res.organizations.length > 0) {
          activeOrg = res.organizations[0];
        }
        if (activeOrg) {
          useOrganizationStore.getState().setActiveOrg(activeOrg);

          // Fetch recent projects after activeOrg has been set
          const response = await projectService.getSideBarProject(activeOrg.id);
          const mapped = (response.projects || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            stats: { todo_tasks: p.task_count ?? 0 }
          }));
          setRecentProjects(mapped);
        } else {
          setRecentProjects([]);
        }
      } catch (err) {
        console.error("Failed to fetch organizations or recent projects", err);
      }
    }
    fetchData();
  }, [user]);


  const handleOrgSelect = async (org: Organization) => {
    try {
      await organizationService.switchOrganization(org.id);
      setActiveOrg(org);
      useUserStore.getState().updateUserFields({
        active_organization_id: org.id
      });
      setOrgDropdownOpen(false);
    } catch (error) {
      console.error("Failed to switch organization", error);
    }
  };

  // Improved initial generation with fallback
  const initial = React.useMemo(() => {
    if (!user || !user.name) return "U";
    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [user?.name]);

  // Close functions
  const closeAvatarMenu = useCallback(() => setAvatarMenu(false), []);
  const closeSidebar = useCallback(() => setMenuOpen(false), []);
  const closeOrgDropdown = useCallback(() => setOrgDropdownOpen(false), []);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        closeAvatarMenu();
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        closeOrgDropdown();
      }
    }

    if (avatarMenu || orgDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarMenu, orgDropdownOpen, closeAvatarMenu, closeOrgDropdown]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        closeSidebar();
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, closeSidebar]);

  // Close menus when pressing Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (orgDropdownOpen) {
          closeOrgDropdown();
        } else if (avatarMenu) {
          closeAvatarMenu();
        } else if (menuOpen) {
          closeSidebar();
        }
      }
    }

    if (menuOpen || avatarMenu || orgDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, avatarMenu, orgDropdownOpen, closeSidebar, closeAvatarMenu, closeOrgDropdown]);

  // Handle menu toggles
  const toggleAvatarMenu = useCallback(() => setAvatarMenu(prev => !prev), []);
  const toggleSidebar = useCallback(() => setMenuOpen(prev => !prev), []);
  const toggleOrgDropdown = useCallback(() => setOrgDropdownOpen(prev => !prev), []);

  // Handle navigation link click
  const handleNavClick = useCallback(() => {
    closeSidebar();
    closeAvatarMenu();
    closeOrgDropdown();
  }, [closeSidebar, closeAvatarMenu, closeOrgDropdown]);

  return (
    <>
      {/* Top bar with hamburger and notifications for mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-neutral-900 border-b border-neutral-800 h-14 flex items-center justify-between px-4">
        <button
          className="bg-neutral-800 border border-neutral-700 rounded p-2 text-neutral-300 hover:bg-neutral-700 hover:text-blue-400 transition-colors"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          aria-expanded={menuOpen}
        >
          <Menu size={20} />
        </button>

        {/* Mobile org indicator */}
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
            {activeOrg?.name ? activeOrg.name[0] : "O"}
          </div>
          <span className="truncate max-w-32">{activeOrg?.name || "Organization"}</span>
        </div>
      </div>

      {/* Overlay for mobile when sidebar open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
            fixed top-14 md:top-0 left-0 h-[calc(100vh-3.5rem)] md:h-auto w-72 z-40 bg-neutral-900 border-r border-neutral-800 flex flex-col
            transition-transform duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0 md:flex md:flex-col md:w-72 md:self-stretch
          `}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors"
            onClick={handleNavClick}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="6" fill="#2563EB" />
              <rect x="6" y="7" width="4" height="14" rx="2" fill="white" />
              <rect x="12" y="7" width="4" height="10" rx="2" fill="white" />
              <rect x="18" y="7" width="4" height="6" rx="2" fill="white" />
            </svg>
            TaskForge
          </Link>

          <button
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="md:hidden text-neutral-400 hover:text-blue-400 transition-colors p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Organization Section - Enhanced */}
        <div className="p-4 border-b border-neutral-800">
          <div className="mb-3">
            <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium flex items-center gap-2">
              <Building2 size={12} />
              Organization
            </span>
          </div>
          <div className="relative" ref={orgDropdownRef}>
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border border-neutral-700 transition-all duration-200"
              onClick={toggleOrgDropdown}
              aria-haspopup="listbox"
              aria-expanded={orgDropdownOpen}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {activeOrg?.name ? activeOrg.name[0] : "O"}
              </div>
              <div className="flex-1 text-left">
                <div className="text-neutral-300 font-medium text-sm">
                  {activeOrg?.name || "Select Organization"}
                </div>
                <div className="text-neutral-500 text-xs">
                  {organizations.length} organization{organizations.length !== 1 ? 's' : ''} available
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-neutral-400 transition-transform duration-200 ${orgDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-neutral-300 hover:bg-neutral-800 hover:text-blue-400 transition-colors ${org.id === activeOrg?.id ? 'bg-neutral-800 text-blue-400' : ''
                        }`}
                      onClick={() => handleOrgSelect(org)}
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {org.name ? org.name[0] : "O"}
                      </div>
                      <span className="flex-1 text-left font-medium">{org.name}</span>
                      {org.id === activeOrg?.id && (
                        <CheckSquare size={16} className="text-green-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Organization Management */}
                <div className="border-t border-neutral-700 bg-neutral-800/50">
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2 text-neutral-400 hover:bg-neutral-700 hover:text-blue-400 text-sm transition-colors"
                    onClick={handleNavClick}
                  >
                    <Plus size={14} />
                    Create Organization
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2 text-neutral-400 hover:bg-neutral-700 hover:text-blue-400 text-sm transition-colors"
                    onClick={handleNavClick}
                  >
                    <Settings size={14} />
                    Manage Organizations
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              placeholder="Search tasks, projects..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <button
                key={action.name}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 justify-center"
                onClick={handleNavClick}
              >
                <action.icon size={16} />
                {action.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Navigation */}
          <nav className="p-4" role="navigation">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 text-neutral-300 hover:text-blue-400 hover:bg-neutral-800/50 font-medium py-2.5 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 group"
                    onClick={handleNavClick}
                  >
                    <Icon size={18} className={`${link.iconColor} group-hover:text-blue-400 transition-colors`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Recent Projects Section */}
          <div className="px-4 py-2">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center justify-between w-full text-left text-neutral-400 hover:text-neutral-300 text-sm font-medium py-2 transition-colors"
            >
              <span>Recent Projects</span>
              {projectsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {projectsExpanded && (
              <div className="space-y-1 mt-2">
                {recentProjects.length === 0 ? (
                  <div className="text-xs text-neutral-500 px-3 py-2">No recent projects</div>
                ) : (
                  recentProjects.map((project) => (
                    <button
                      key={project.id || project.name}
                      className="flex items-center gap-3 w-full text-left text-neutral-300 hover:text-blue-400 hover:bg-neutral-800/50 py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                      onClick={handleNavClick}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color || '#64748b' }}
                      ></div>
                      <span className="flex-1 text-sm">{project.name}</span>
                      <span className="text-xs text-neutral-500">
                        {project.task_count ?? 0}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Favorites Section */}
          <div className="px-4 py-2">
            <button
              onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              className="flex items-center justify-between w-full text-left text-neutral-400 hover:text-neutral-300 text-sm font-medium py-2 transition-colors"
            >
              <span>Favorites</span>
              {favoritesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {favoritesExpanded && (
              <div className="space-y-1 mt-2">
                {favorites.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 text-neutral-300 hover:text-blue-400 hover:bg-neutral-800/50 py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm group"
                      onClick={handleNavClick}
                    >
                      <Icon size={16} className={`${item.iconColor} group-hover:text-blue-400 transition-colors`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-2 h-18">
          <div className="relative">
            <button
              ref={avatarRef}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-neutral-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={toggleAvatarMenu}
              aria-label="User menu"
              aria-expanded={avatarMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {initial}
              </div>
              <div className="flex-1 text-left">
                <div className="text-neutral-300 font-medium text-sm">
                  {user?.name || "User"}
                </div>
                <div className="text-neutral-500 text-xs">
                  {user?.email || "user@example.com"}
                </div>
              </div>
              <ChevronDown size={16} className="text-neutral-400" />
            </button>

            {avatarMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-2 animate-fade-in-up">
                <Link
                  href="/protected/profile"
                  className="flex items-center gap-3 w-full text-left px-4 py-2 text-neutral-300 hover:bg-neutral-700 hover:text-blue-400 transition-colors focus:outline-none focus:bg-neutral-700"
                  onClick={handleNavClick}
                >
                  <Settings size={16} className="text-gray-400" />
                  Profile Settings
                </Link>
                <hr className="my-2 border-neutral-700" />
                <button
                  className="flex items-center gap-3 w-full text-left px-4 py-2 text-red-400 hover:bg-neutral-700 hover:text-red-300 transition-colors focus:outline-none focus:bg-neutral-700"
                  onClick={closeAvatarMenu}
                >
                  <X size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Add padding for mobile to account for top bar */}
      <div className="md:hidden h-14"></div>
    </>
  );
}