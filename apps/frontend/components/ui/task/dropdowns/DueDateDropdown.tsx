'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import DatePicker from "react-datepicker";
import { formatDate, getDueDatePresets } from '../TaskUtilsFunction';

interface Props {
    currentDueDate?: string | null;
    onDueDateChange: (dueDate: string) => void;
    onRemoveDueDate?: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
    showDate?: boolean;
    dropdownDirection?: 'down' | 'up';
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function DueDateDropdown({
    currentDueDate,
    onDueDateChange,
    onRemoveDueDate,
    disabled = false,
    size = 'medium',
    showDate = true,
    dropdownDirection = 'down',
    isOpen: controlledIsOpen,
    setIsOpen: setControlledIsOpen,
}: Props) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
    const setIsOpen = setControlledIsOpen || setUncontrolledIsOpen;
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCustomPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsOpen]);

    const handleDueDateSelect = (dueDate: string) => {
        onDueDateChange(dueDate);
        setIsOpen(false);
        setShowCustomPicker(false);
    };

    const handleRemove = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (onRemoveDueDate) {
            onRemoveDueDate();
            setIsOpen(false);
            setShowCustomPicker(false);
        }
    };

    const iconSize = size === 'small' ? 12 : 14;
    const textSize = size === 'small' ? 'text-xs' : 'text-sm';
    const dueDatePresets = getDueDatePresets();

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-1 hover:text-neutral-100 transition-colors ${size === 'small' ? 'hover:bg-neutral-700/30 px-2 py-1 rounded' : ''
                    }`}
                disabled={disabled}
            >
                <Calendar size={iconSize} />
                {showDate && currentDueDate && (
                    <span className={textSize}>{formatDate(currentDueDate)}</span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute ${dropdownDirection === 'up' ? 'bottom-8' : 'top-8'} left-0 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-20`}>
                    <div className="p-1">
                        {dueDatePresets.map(({ label, value }) => (
                            <button
                                key={label}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDueDateSelect(value);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 ${textSize} text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors`}
                                disabled={disabled}
                            >
                                <span>{label}</span>
                                <span className="text-xs text-neutral-500">
                                    {new Date(value).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </button>
                        ))}
                        <div className="border-t border-neutral-700/50 mt-1 pt-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCustomPicker(true);
                                }}
                                className={`w-full flex items-center px-3 py-2 ${textSize} text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors`}
                                disabled={disabled}
                            >
                                <Calendar size={iconSize} className="mr-2" />
                                <span>Custom...</span>
                            </button>
                            {currentDueDate && onRemoveDueDate && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(e);
                                    }}
                                    className={`w-full flex items-center px-3 py-2 ${textSize} text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors`}
                                    disabled={disabled}
                                >
                                    <X size={iconSize} className="mr-2" />
                                    <span>Remove Due Date</span>
                                </button>
                            )}
                        </div>
                        {showCustomPicker && (
                            <div className="mt-2 px-2 pb-2" onClick={e => e.stopPropagation()}>
                                <DatePicker
                                    selected={currentDueDate ? new Date(currentDueDate) : null}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            handleDueDateSelect(date.toISOString());
                                        }
                                    }}
                                    inline
                                    calendarClassName="dark-datepicker"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCustomPicker(false);
                                    }}
                                    className="mt-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}