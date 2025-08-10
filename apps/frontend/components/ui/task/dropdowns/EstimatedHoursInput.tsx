'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
    currentHours?: number | null;
    onHoursChange: (hours: number | null) => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
    showHours?: boolean;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function EstimatedHoursInput({
    currentHours,
    onHoursChange,
    disabled = false,
    size = 'medium',
    showHours = true,
    isOpen: controlledIsOpen,
    setIsOpen: setControlledIsOpen,
}: Props) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
    const setIsOpen = setControlledIsOpen || setUncontrolledIsOpen;
    const [value, setValue] = useState(currentHours?.toString() || '');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handleBlur();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setValue(currentHours?.toString() || '');
    }, [currentHours]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleBlur = () => {
        const numericValue = value ? parseFloat(value) : null;
        if (numericValue !== currentHours) {
            onHoursChange(numericValue);
        }
        setIsOpen(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const numericValue = value ? parseFloat(value) : null;
            if (numericValue !== currentHours) {
                onHoursChange(numericValue);
            }
            setIsOpen(false);
        } else if (e.key === 'Escape') {
            setValue(currentHours?.toString() || '');
            setIsOpen(false);
        }
    };

    const iconSize = size === 'small' ? 12 : 14;
    const textSize = size === 'small' ? 'text-xs' : 'text-sm';

    return (
        <div className="relative" ref={ref}>
            {isOpen ? (
                <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    step="0.5"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyPress}
                    placeholder="Hours"
                    className={`w-14 px-1 py-0.5 bg-neutral-700/50 text-neutral-100 ${textSize} rounded focus:outline-none focus:border-blue-500/50 border border-neutral-600/50`}
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'inline-block' }}
                />
            ) : (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    className={`flex items-center gap-1 hover:text-neutral-100 transition-colors ${size === 'small' ? 'hover:bg-neutral-700/30 px-2 py-1 rounded' : ''
                        }`}
                    disabled={disabled}
                >
                    <Clock size={iconSize} />
                    {showHours && currentHours && (
                        <span className={textSize}>{currentHours}h</span>
                    )}
                </button>
            )}
        </div>
    );
}