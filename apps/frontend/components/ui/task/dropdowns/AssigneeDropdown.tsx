'use client';

import { useState, useRef, useEffect } from 'react';
import { getAssigneeAvatar } from '../../team/TeamUtils';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: string;
}

interface Props {
    currentAssigneeId?: string | null;
    teamMembers: TeamMember[];
    onAssigneeChange: (assigneeId: string) => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
    showName?: boolean;
    dropdownDirection?: 'down' | 'up';
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function AssigneeDropdown({
    currentAssigneeId,
    teamMembers,
    onAssigneeChange,
    disabled = false,
    size = 'medium',
    showName = false,
    dropdownDirection = 'down',
    isOpen: controlledIsOpen,
    setIsOpen: setControlledIsOpen,
}: Props) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
    const setIsOpen = setControlledIsOpen || setUncontrolledIsOpen;
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsOpen]);

    const handleAssigneeSelect = (assigneeId: string) => {
        onAssigneeChange(assigneeId);
        setIsOpen(false);
    };

    const getAssigneeName = (assigneeId?: string) => {
        if (!assigneeId) return 'Unassigned';
        const member = teamMembers.find(m => m.id === assigneeId);
        return member ? member.name : assigneeId;
    };

    const textSize = size === 'small' ? 'text-xs' : 'text-sm';

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${size === 'small' ? 'hover:bg-neutral-700/30 px-2 py-1 rounded' : ''
                    }`}
                disabled={disabled}
            >
                {getAssigneeAvatar(currentAssigneeId ?? "", teamMembers)}
                {showName && (
                    <span className={`text-neutral-300 ${textSize}`}>
                        {getAssigneeName(currentAssigneeId ?? "")}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute ${dropdownDirection === 'up' ? 'bottom-8' : 'top-8'} right-0 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                    <div className="p-1">
                        <div className={`px-3 py-2 ${textSize} font-medium text-neutral-400 border-b border-neutral-700/50`}>
                            Assign to...
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAssigneeSelect("");
                            }}
                            className={`w-full flex items-center px-3 py-2 ${textSize} text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors`}
                            disabled={disabled}
                        >
                            {getAssigneeAvatar("", teamMembers)}
                            <span className="ml-2">No assignee</span>
                        </button>
                        {teamMembers.length > 0 ? (
                            teamMembers.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssigneeSelect(member.id);
                                    }}
                                    className={`w-full flex items-center px-3 py-2 ${textSize} text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors`}
                                    disabled={disabled}
                                >
                                    {getAssigneeAvatar(member.id, teamMembers)}
                                    <span className="ml-2">{member.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className={`px-3 py-2 ${textSize} text-neutral-500`}>
                                No team members available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}