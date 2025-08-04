import React, { useRef } from "react";
import { Building2, ChevronDown, CheckSquare, Plus, Settings } from "lucide-react";
import { Organization } from "@/lib/types/organization";

interface OrganizationDropdownProps {
  organizations: Organization[];
  activeOrg: Organization | null;
  orgDropdownOpen: boolean;
  orgDropdownRef: React.RefObject<HTMLDivElement | null>;
  toggleOrgDropdown: () => void;
  handleOrgSelect: (org: Organization) => void;
  handleNavClick: () => void;
}

export default function OrganizationDropdown({
  organizations,
  activeOrg,
  orgDropdownOpen,
  orgDropdownRef,
  toggleOrgDropdown,
  handleOrgSelect,
  handleNavClick,
}: OrganizationDropdownProps) {
  return (
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

        <div
          style={{
            maxHeight: orgDropdownOpen ? 500 : 0,
            opacity: orgDropdownOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
          className="absolute left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20"
        >
          {orgDropdownOpen && (
            <>
              <div className="max-h-60 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-neutral-300 hover:bg-neutral-800 hover:text-blue-400 transition-colors ${org.id === activeOrg?.id ? 'bg-neutral-800 text-blue-400' : ''}`}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
