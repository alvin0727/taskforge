import React from "react";
import Link from "next/link";

interface NavLink {
  name: string;
  href: string;
  icon: React.ElementType;
  iconColor?: string;
}

interface SidebarNavLinksProps {
  navLinks: NavLink[];
  handleNavClick: () => void;
}

const SidebarNavLinks: React.FC<SidebarNavLinksProps> = ({ navLinks, handleNavClick }) => (
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
            <Icon size={18} className={`${link.iconColor || ""} group-hover:text-blue-400 transition-colors`} />
            {link.name}
          </Link>
        );
      })}
    </div>
  </nav>
);

export default SidebarNavLinks;
