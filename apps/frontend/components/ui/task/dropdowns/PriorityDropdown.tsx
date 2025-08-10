'use client';

import { useState, useRef, useEffect } from 'react';
import { TaskPriority } from '@/lib/types/task';
import { getPriorityIcon, priorityOptions } from '../TaskUtilsFunction';

interface Props {
    currentPriority?: TaskPriority | null;
    onPriorityChange: (priority: string) => void;
    disabled?: boolean;
    showIcon?: boolean;
    size?: 'small' | 'medium';
    dropdownDirection?: 'down' | 'up';
}

export default function PriorityDropdown({
    currentPriority,
    onPriorityChange,
    disabled = false,
    showIcon = true,
    size = 'medium',
    dropdownDirection = 'down',
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrioritySelect = (priority: string) => {
        onPriorityChange(priority);
        setIsOpen(false);
    };

    const textSize = size === 'small' ? 'text-xs' : 'text-sm';

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-1 hover:text-neutral-100 transition-colors ${size === 'small' ? 'hover:bg-neutral-700/30 px-2 py-1 rounded' : 'hover:bg-neutral-700/50 p-1 rounded'
                    }`}
                disabled={disabled}
            >
                {showIcon && getPriorityIcon(currentPriority)}
            </button>

            {isOpen && (
                <div className={`absolute ${dropdownDirection === 'up' ? 'bottom-8' : 'top-8'} left-0 w-48 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                    <div className="p-1">
                        <div className={`px-3 py-2 ${textSize} font-medium text-neutral-400 border-b border-neutral-700/50`}>
                            Set priority to...
                        </div>
                        {priorityOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrioritySelect(option.value);
                                }}
                                className={`w-full flex items-center px-3 py-2 ${textSize} text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors`}
                                disabled={disabled}
                            >
                                <div className="flex items-center gap-2">
                                    {option.icon}
                                    <span>{option.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
