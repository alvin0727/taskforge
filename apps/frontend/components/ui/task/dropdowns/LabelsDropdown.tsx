'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag, X } from 'lucide-react';
import {
    availableLabels,
    processTaskLabels,
    getLabelColor,
    getLabelDotColor
} from '../TaskUtilsFunction';

interface Props {
    currentLabels: string[];
    onLabelsChange: (labelName: string) => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
    maxVisibleLabels?: number;
    dropdownDirection?: 'down' | 'up';
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
}

export default function LabelsDropdown({
    currentLabels,
    onLabelsChange,
    disabled = false,
    size = 'medium',
    maxVisibleLabels = 3,
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

    const processedLabels = processTaskLabels(currentLabels);
    const textSize = size === 'small' ? 'text-[9px]' : 'text-[10px]';
    const iconSize = size === 'small' ? 14 : 16;

    return (
        <div className="relative flex flex-wrap gap-1" ref={ref}>
            {processedLabels.length === 0 ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    className={`flex items-center gap-1 ${textSize} px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-medium hover:bg-neutral-700 transition-colors`}
                    disabled={disabled}
                >
                    <Tag size={iconSize} className="mr-1" />
                    Labels
                </button>
            ) : (
                <>
                    {processedLabels.slice(0, maxVisibleLabels).map((labelName, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                            className={`${textSize} px-1 py-0.5 rounded flex items-center gap-1 hover:opacity-80 transition-opacity ${getLabelColor(labelName)}`}
                            disabled={disabled}
                        >
                            <div className={`w-1 h-1 rounded-full ${getLabelDotColor(labelName)}`}></div>
                            {labelName}
                        </button>
                    ))}
                    {processedLabels.length > maxVisibleLabels && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                            className={`${textSize} px-1 py-0.5 bg-neutral-700 text-neutral-300 rounded hover:opacity-80 transition-opacity`}
                            disabled={disabled}
                        >
                            +{processedLabels.length - maxVisibleLabels}
                        </button>
                    )}
                </>
            )}

            {isOpen && (
                <div className={`absolute left-0 ${dropdownDirection === 'up' ? 'bottom-7' : 'top-7'} z-50 w-64 bg-neutral-800/95 backdrop-blur-xl rounded-lg shadow-xl border border-neutral-700/50`}>
                    <div className="p-2">
                        <div className="flex items-center justify-between px-2 py-2 mb-2">
                            <span className="text-xs font-medium text-neutral-400">Labels</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                            >
                                <X size={12} className="text-neutral-400" />
                            </button>
                        </div>
                        {availableLabels.map((label) => (
                            <button
                                key={label.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLabelsChange(label.name);
                                }}
                                className="w-full flex items-center px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                                disabled={disabled}
                            >
                                <div className={`w-3 h-3 rounded-full mr-2 ${getLabelDotColor(label.name)}`}></div>
                                <span className="flex-1 text-left">{label.name}</span>
                                {processedLabels.includes(label.name) && (
                                    <span className="text-xs text-green-400">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}