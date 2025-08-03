import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface FavoriteItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconColor?: string;
}

interface FavoritesListProps {
  favorites: FavoriteItem[];
  favoritesExpanded: boolean;
  setFavoritesExpanded: (expanded: boolean) => void;
  handleNavClick: () => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  favoritesExpanded,
  setFavoritesExpanded,
  handleNavClick,
}) => (
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
              <Icon size={16} className={`${item.iconColor || ""} group-hover:text-blue-400 transition-colors`} />
              {item.name}
            </Link>
          );
        })}
      </div>
    )}
  </div>
);

export default FavoritesList;
