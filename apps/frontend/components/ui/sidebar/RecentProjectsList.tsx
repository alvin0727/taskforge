import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarProject } from "@/lib/types/project";

interface RecentProjectsListProps {
  recentProjects: SidebarProject[];
  projectsExpanded: boolean;
  setProjectsExpanded: (expanded: boolean) => void;
  router: any;
  handleNavClick: () => void;
}

export default function RecentProjectsList({
  recentProjects,
  projectsExpanded,
  setProjectsExpanded,
  router,
  handleNavClick,
}: RecentProjectsListProps) {
  return (
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
                className="flex items-center gap-3 w-full text-left py-2 px-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 text-neutral-300 hover:text-blue-400 hover:bg-neutral-800/50"
                onClick={() => {
                  router.push(`/board?project=${project.id}`);
                  handleNavClick();
                }}
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
  );
}
