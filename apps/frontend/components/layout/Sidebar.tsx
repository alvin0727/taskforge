'use client';

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  FolderKanban,
  X,
  Home,
  Kanban,
  Users,
  Calendar,
  BarChart3,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Archive,
  Target,
} from "lucide-react";
import { useOrganizationStore } from "@/stores/organizationStore";
import organizationService from "@/services/organization/organizationService";
import projectService from "@/services/projects/projectService";
import userService from "@/services/users/userService";
import { useUserStore } from "@/stores/userStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useProjectStore } from "@/stores/projectStore";
import { Organization } from "@/lib/types/organization";
import { RequestCreateProject } from "@/lib/types/project";
import OrganizationDropdown from "../ui/sidebar/OrganizationDropdown";
import RecentProjectsList from "../ui/sidebar/RecentProjectsList";
import FavoritesList from "../ui/sidebar/FavoritesList";
import UserProfileMenu from "../ui/sidebar/UserProfileMenu";
import SidebarNavLinks from "../ui/sidebar/SidebarNavLinks";
import ProjectForm from "@/components/ui/project/ProjectForm";
import Footer from "./Footer";
import toast from "react-hot-toast";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: Home, iconColor: "text-blue-400" },
  { name: "Project", href: "/project", icon: FolderKanban, iconColor: "text-purple-400" },
  { name: "Board", href: "/organization/board", icon: Kanban, iconColor: "text-purple-400" },
  { name: "Team", href: "/team", icon: Users, iconColor: "text-pink-400" },
  { name: "Calendar", href: "/protected/calendar", icon: Calendar, iconColor: "text-red-400" },
  { name: "Activity", href: "/protected/activity", icon: BarChart3, iconColor: "text-cyan-400" },
];

const quickActions = [
  { name: "Create Task", icon: Plus, action: "create-task" },
  { name: "New Project", icon: Target, action: "create-project" },
];

const favorites = [
  { name: "Archived Projects", href: "/project/archived", icon: Archive, iconColor: "text-gray-400" },
];

export default function Sidebar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarHidden = useSidebarStore((state) => state.hidden);
  const setSidebarHidden = useSidebarStore((state) => state.setHidden);
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
  const recentProjects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormLoading, setProjectFormLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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
          setProjects(response.projects || []);

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

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await userService.logout();
      toast.success("Logged out successfully");
      router.replace("/user/login");
    } catch (error) {
      throw error;
    } finally {
      setLogoutLoading(false);
    }
  }

  const handleCreateProject = async (data: RequestCreateProject) => {
    setProjectFormLoading(true);
    try {
      const result = await projectService.createNewProject(data);
      setProjectFormLoading(false);
      return result.project; // Return the created project
    } catch (err) {
      setProjectFormLoading(false);
      throw err;
    }
  };

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
            {user?.name ? user.name[0] : "O"}
          </div>
          <span className="truncate max-w-32">{user?.name || "Organization"}</span>
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
            fixed top-14 md:top-0 left-0 h-[calc(100vh-3.5rem)] md:h-auto z-40 bg-neutral-900 border-r border-b border-neutral-800 flex flex-col
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0 md:flex md:flex-col md:self-stretch
            ${sidebarHidden ? "md:w-16" : "md:w-[18rem]"}
          `}
        style={{
          width: sidebarHidden ? "4rem" : "18rem",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Hide/Show Sidebar Button (desktop only) */}
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
            {!sidebarHidden && 'TaskForge'}
          </Link>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => setSidebarHidden(!sidebarHidden)}
              aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
              className="hidden md:inline-block text-neutral-400 hover:text-blue-400 transition-colors p-1 rounded"
            >
              {sidebarHidden ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              onClick={closeSidebar}
              aria-label="Close sidebar"
              className="md:hidden text-neutral-400 hover:text-blue-400 transition-colors p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Organization Section - Enhanced */}
        {/* Only hide in desktop, mobile always show */}
        {(menuOpen || !sidebarHidden) && (
          <OrganizationDropdown
            organizations={organizations}
            activeOrg={activeOrg}
            orgDropdownOpen={orgDropdownOpen}
            orgDropdownRef={orgDropdownRef}
            toggleOrgDropdown={toggleOrgDropdown}
            handleOrgSelect={handleOrgSelect}
            handleNavClick={handleNavClick}
          />
        )}

        {/* Search Bar */}
        {(menuOpen || !sidebarHidden) && (
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
        )}

        {/* Quick Actions */}
        {(menuOpen || !sidebarHidden) && (
          <div className="p-4 border-b border-neutral-800">
            <div className="flex gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 justify-center"
                  onClick={action.action === "create-project" ? () => setShowProjectForm(true) : handleNavClick}
                >
                  <action.icon size={16} />
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {(menuOpen || !sidebarHidden) && (
            <>
              {/* Main Navigation */}
              <SidebarNavLinks
                navLinks={navLinks}
                handleNavClick={handleNavClick}
              />

              {/* Recent Projects Section */}
              <RecentProjectsList
                recentProjects={recentProjects}
                projectsExpanded={projectsExpanded}
                setProjectsExpanded={setProjectsExpanded}
                router={router}
                handleNavClick={handleNavClick}
              />

              {/* Favorites Section */}
              <FavoritesList
                favorites={favorites}
                favoritesExpanded={favoritesExpanded}
                setFavoritesExpanded={setFavoritesExpanded}
                handleNavClick={handleNavClick}
              />
            </>
          )}
          {sidebarHidden && !menuOpen && (
            <div className="hidden md:block w-full h-full flex-col justify-end">
              <Footer />
            </div>
          )}
        </div>

        {/* User Profile Section */}
        {(menuOpen || !sidebarHidden) && (
          <UserProfileMenu
            user={user}
            initial={initial}
            avatarMenu={avatarMenu}
            avatarRef={avatarRef}
            toggleAvatarMenu={toggleAvatarMenu}
            handleNavClick={handleNavClick}
            onLogout={handleLogout}
            logoutLoading={logoutLoading} 
          />
        )}
      </aside>

      {/* Add padding for mobile to account for top bar */}
      <div className="md:hidden h-14"></div>

      {showProjectForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          loading={projectFormLoading}
          onClose={() => setShowProjectForm(false)}
        />
      )}
    </>
  );
}