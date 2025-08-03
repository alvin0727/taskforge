import React from "react";
import Link from "next/link";
import { Settings, X, ChevronDown } from "lucide-react";

interface UserProfileMenuProps {
  user: { name?: string; email?: string } | null;
  initial: string;
  avatarMenu: boolean;
  avatarRef: React.RefObject<HTMLButtonElement | null>;
  toggleAvatarMenu: () => void;
  closeAvatarMenu: () => void;
  handleNavClick: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  initial,
  avatarMenu,
  avatarRef,
  toggleAvatarMenu,
  closeAvatarMenu,
  handleNavClick,
}) => (
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
);

export default UserProfileMenu;
