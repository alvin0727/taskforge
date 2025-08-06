import { UserCircle } from 'lucide-react';

// Mock team members - you can replace with actual data
export const teamMembers = [
  { id: "1", name: "alvin.gea", avatar: "AG" },
  { id: "2", name: "aufa", avatar: "AU" },
  { id: "3", name: "drpaulang", avatar: "DP" },
  { id: "4", name: "eunike", avatar: "EU" },
  { id: "5", name: "fidaa", avatar: "FI" },
  { id: "6", name: "jennifer.florentina", avatar: "JF" },
];

export const getAssigneeAvatar = (assigneeId?: string) => {
  if (!assigneeId) {
    return (
      <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
        <UserCircle size={12} className="text-neutral-400" />
      </div>
    );
  }

  const member = teamMembers.find(m => m.id === assigneeId);
  if (!member) {
    return (
      <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
        <UserCircle size={12} className="text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-medium text-white">
      {member.avatar}
    </div>
  );
};