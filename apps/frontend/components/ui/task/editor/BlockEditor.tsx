'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, GripVertical, Type, Hash, Quote, Code, List, ListOrdered, Trash2 } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {
    CSS,
} from '@dnd-kit/utilities';

interface Block {
    id: string;
    type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'code' | 'bulletList' | 'numberedList';
    content: string;
    position: number;
}

interface BlockMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: Block['type']) => void;
    position: { x: number; y: number };
    triggerBlockId?: string;
}

const BlockMenu: React.FC<BlockMenuProps> = ({ isOpen, onClose, onSelectType, position, triggerBlockId }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const menuItems = [
        { type: 'paragraph' as const, icon: Type, label: 'Text', description: 'Just start writing with plain text.' },
        { type: 'heading1' as const, icon: Hash, label: 'Heading 1', description: 'Big section heading.' },
        { type: 'heading2' as const, icon: Hash, label: 'Heading 2', description: 'Medium section heading.' },
        { type: 'heading3' as const, icon: Hash, label: 'Heading 3', description: 'Small section heading.' },
        { type: 'quote' as const, icon: Quote, label: 'Quote', description: 'Capture a quote.' },
        { type: 'code' as const, icon: Code, label: 'Code', description: 'Capture a code snippet.' },
        { type: 'bulletList' as const, icon: List, label: 'Bulleted list', description: 'Create a simple bulleted list.' },
        { type: 'numberedList' as const, icon: ListOrdered, label: 'Numbered list', description: 'Create a list with numbering.' },
    ];

    const handleSelect = (type: Block['type']) => {
        onSelectType(type);
        onClose();

        // Auto-focus pada block setelah type change
        if (triggerBlockId) {
            setTimeout(() => {
                const element = document.getElementById(`block-${triggerBlockId}`);
                if (element) {
                    element.focus();
                    // Set cursor to end of content
                    const range = document.createRange();
                    const selection = window.getSelection();
                    if (selection) {
                        range.selectNodeContents(element);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }, 10);
        }
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 w-80 max-h-80 overflow-y-auto"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translateY(-10px)'
            }}
        >
            <div className="p-2">
                <div className="text-xs text-neutral-400 px-3 py-2 font-medium">BASIC BLOCKS</div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.type}
                            onClick={() => handleSelect(item.type)}
                            className="w-full flex items-start gap-3 px-3 py-2 hover:bg-neutral-700 rounded-md transition-colors text-left"
                        >
                            <Icon className="w-4 h-4 mt-0.5 text-neutral-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-neutral-100">{item.label}</div>
                                <div className="text-xs text-neutral-400 truncate">{item.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface SortableBlockProps {
    block: Block;
    isActive: boolean;
    isOnlyBlock: boolean;
    onContentChange: (id: string, content: string) => void;
    onKeyDown: (e: React.KeyboardEvent, blockId: string) => void;
    onFocus: (blockId: string) => void;
    onPlusClick: (blockId: string, event: React.MouseEvent) => void;
    onDeleteClick: (blockId: string) => void;
    numberedListCount: number;
}

const SortableBlock: React.FC<SortableBlockProps> = ({
    block,
    isActive,
    isOnlyBlock,
    onContentChange,
    onKeyDown,
    onFocus,
    onPlusClick,
    onDeleteClick,
    numberedListCount
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const blockRef = useRef<HTMLDivElement>(null);
    const editableRef = useRef<HTMLElement>(null);
    const [localContent, setLocalContent] = useState(block.content);
    const [isContentInitialized, setIsContentInitialized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getBlockComponent = (type: Block['type']) => {
        switch (type) {
            case 'heading1':
                return 'h1';
            case 'heading2':
                return 'h2';
            case 'heading3':
                return 'h3';
            case 'quote':
                return 'blockquote';
            case 'code':
                return 'pre';
            default:
                return 'div';
        }
    };

    const getBlockStyles = (type: Block['type']) => {
        const baseStyles = "w-full bg-transparent border-none outline-none resize-none overflow-hidden text-neutral-300";

        switch (type) {
            case 'heading1':
                return `${baseStyles} text-3xl font-bold text-neutral-100`;
            case 'heading2':
                return `${baseStyles} text-2xl font-bold text-neutral-100`;
            case 'heading3':
                return `${baseStyles} text-xl font-bold text-neutral-100`;
            case 'quote':
                return `${baseStyles} border-l-4 border-neutral-600 pl-4 italic`;
            case 'code':
                return `${baseStyles} font-mono text-sm bg-neutral-800/50 p-3 rounded text-neutral-200`;
            case 'bulletList':
                return `${baseStyles} pl-6 relative`;
            case 'numberedList':
                return `${baseStyles} pl-6 relative`;
            default:
                return baseStyles;
        }
    };

    const getPlaceholder = (type: Block['type']) => {
        switch (type) {
            case 'heading1':
                return 'Heading 1';
            case 'heading2':
                return 'Heading 2';
            case 'heading3':
                return 'Heading 3';
            case 'quote':
                return 'Empty quote';
            case 'code':
                return 'Enter code...';
            case 'bulletList':
                return 'List';
            case 'numberedList':
                return 'List';
            default:
                return "Type '/' for commands";
        }
    };

    const getPlaceholderStyles = (type: Block['type']) => {
        // Base placeholder styles
        const baseStyle = "absolute inset-0 pointer-events-none text-neutral-500";

        switch (type) {
            case 'heading1':
                return `${baseStyle} text-3xl font-bold`;
            case 'heading2':
                return `${baseStyle} text-2xl font-bold`;
            case 'heading3':
                return `${baseStyle} text-xl font-bold`;
            case 'quote':
                return `${baseStyle} italic`;
            case 'code':
                return `${baseStyle} font-mono text-sm`;
            default:
                return baseStyle;
        }
    };

    // Initialize content when block content changes from outside (like from store)
    useEffect(() => {
        if (block.content !== localContent) {
            setLocalContent(block.content);

            // Update the editable element if it exists and is not currently focused
            if (editableRef.current && document.activeElement !== editableRef.current) {
                editableRef.current.textContent = block.content;
            }
        }
    }, [block.content, localContent]);

    // Set initial content when component mounts
    useEffect(() => {
        if (editableRef.current && !isContentInitialized) {
            editableRef.current.textContent = block.content;
            setLocalContent(block.content);
            setIsContentInitialized(true);
        }
    }, [block.content, isContentInitialized]);

    const handleInput = useCallback((e: React.FormEvent<HTMLElement>) => {
        const newContent = (e.target as HTMLElement).textContent || '';
        setLocalContent(newContent);
        onContentChange(block.id, newContent);
    }, [block.id, onContentChange]);

    const handleFocus = useCallback(() => {
        onFocus(block.id);
    }, [block.id, onFocus]);

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOnlyBlock) {
            onDeleteClick(block.id);
        }
    }, [block.id, onDeleteClick, isOnlyBlock]);

    const Component = getBlockComponent(block.type) as any;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative transition-shadow duration-150 `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start gap-2 py-2 m-4">
                {/* Left Controls */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-14 pt-1">
                    <button
                        onClick={(e) => onPlusClick(block.id, e)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300 transition-colors"
                        title="Add block"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        {...attributes}
                        {...listeners}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-neutral-300 cursor-grab active:cursor-grabbing transition-colors"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                </div>

                {/* Block Content Container */}
                <div className={`flex-1 min-w-0 relative rounded-sm ${isActive ? 'bg-neutral-700/40' : ''}`}>
                    <div ref={blockRef} className="relative">
                        {block.type === 'bulletList' && localContent && (
                            <div className="absolute left-2 top-3 w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                        )}
                        {block.type === 'numberedList' && localContent && (
                            <div className="absolute left-1 top-2 text-sm text-neutral-500 font-medium">
                                {numberedListCount}.
                            </div>
                        )}

                        <Component
                            ref={editableRef}
                            id={`block-${block.id}`}
                            className={getBlockStyles(block.type)}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            onFocus={handleFocus}
                            onKeyDown={(e: React.KeyboardEvent) => onKeyDown(e, block.id)}
                            style={{
                                minHeight: block.type === 'code' ? '60px' : '32px',
                                direction: 'ltr',
                                textAlign: 'left',
                                paddingRight: '36px', // Space for delete button
                            }}
                        />

                        {/* Placeholder overlay dengan styling yang sesuai */}
                        {!localContent && (
                            <div
                                className={getPlaceholderStyles(block.type)}
                                style={{
                                    paddingLeft: block.type === 'quote' ? '1rem' :
                                        block.type === 'bulletList' || block.type === 'numberedList' ? '1.5rem' : '0',
                                    paddingTop: block.type === 'code' ? '0.75rem' : '0',
                                    paddingRight: '36px', // Space for delete button
                                }}
                            >
                                {getPlaceholder(block.type)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Controls - Delete Button */}
                <div className="flex items-center pt-1">
                    <button
                        onClick={handleDeleteClick}
                        className={`w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 ${isOnlyBlock
                            ? 'opacity-20 cursor-not-allowed text-neutral-600'
                            : isHovered || isActive
                                ? 'opacity-100 hover:bg-red-900/20 text-red-400 hover:text-red-300'
                                : 'opacity-0 group-hover:opacity-60 text-neutral-400 hover:text-red-400 hover:bg-red-900/20'
                            }`}
                        title={isOnlyBlock ? "Cannot delete the last block" : "Delete block"}
                        disabled={isOnlyBlock}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BlockEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
    content = '',
    onChange,
    placeholder = "Start writing..."
}) => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [activeBlockId, setActiveBlockId] = useState<string>('');
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [menuTriggerBlockId, setMenuTriggerBlockId] = useState<string>('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize blocks from content - IMPROVED VERSION
    useEffect(() => {
        if (!isInitialized) {
            let initialBlocks: Block[] = [];

            if (content && content.trim()) {
                try {
                    const parsedBlocks = JSON.parse(content);
                    if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
                        // Validate and ensure proper structure
                        initialBlocks = parsedBlocks.map((block, index) => ({
                            id: block.id || `block-${Date.now()}-${index}`,
                            type: block.type || 'paragraph',
                            content: block.content || '',
                            position: typeof block.position === 'number' ? block.position : index
                        }));

                        // Sort by position to maintain order
                        initialBlocks.sort((a, b) => a.position - b.position);
                    }
                } catch (e) {
                    // Content is not valid JSON, treat as plain text
                    console.warn('Content is not valid JSON, converting to paragraph block:', e);
                    initialBlocks = [{
                        id: `block-${Date.now()}`,
                        type: 'paragraph',
                        content: content,
                        position: 0
                    }];
                }
            }

            // Create initial empty block if no content or no valid blocks
            if (initialBlocks.length === 0) {
                initialBlocks = [{
                    id: `block-${Date.now()}`,
                    type: 'paragraph',
                    content: '',
                    position: 0
                }];
            }

            console.log('Initializing blocks:', initialBlocks); // Debug log
            setBlocks(initialBlocks);

            if (initialBlocks.length > 0) {
                // Set active block to the first block with content, or the first block
                const firstContentBlock = initialBlocks.find(b => b.content.trim()) || initialBlocks[0];
                setActiveBlockId(firstContentBlock.id);
            }

            setIsInitialized(true);
        }
    }, [content, isInitialized]);

    // Watch for content changes from outside (like from task store)
    useEffect(() => {
        if (isInitialized && content) {
            try {
                const parsedBlocks = JSON.parse(content);
                if (Array.isArray(parsedBlocks)) {
                    const validatedBlocks = parsedBlocks.map((block, index) => ({
                        id: block.id || `block-${Date.now()}-${index}`,
                        type: block.type || 'paragraph',
                        content: block.content || '',
                        position: typeof block.position === 'number' ? block.position : index
                    }));

                    // Only update if the content is actually different
                    const currentBlocksStr = JSON.stringify(blocks);
                    const newBlocksStr = JSON.stringify(validatedBlocks);

                    if (currentBlocksStr !== newBlocksStr) {
                        console.log('Content changed from outside, updating blocks:', validatedBlocks);
                        setBlocks(validatedBlocks.sort((a, b) => a.position - b.position));
                    }
                }
            } catch (e) {
                // Invalid JSON, ignore
            }
        }
    }, [content, isInitialized]); // Remove blocks from dependency to avoid infinite loop

    // Emit changes to parent (debounced)
    const emitChangeRef = useRef<NodeJS.Timeout | null>(null);
    const emitChange = useCallback((updatedBlocks: Block[]) => {
        if (!onChange) return;

        // Clear existing timeout
        if (emitChangeRef.current) {
            clearTimeout(emitChangeRef.current);
        }

        // Debounce the onChange call
        emitChangeRef.current = setTimeout(() => {
            const serializedContent = JSON.stringify(updatedBlocks);
            console.log('Emitting change:', serializedContent); // Debug log
            onChange(serializedContent);
        }, 100);
    }, [onChange]);

    const addBlock = useCallback((afterId?: string, type: Block['type'] = 'paragraph') => {
        const newBlock: Block = {
            id: `block-${Date.now()}`,
            type,
            content: '',
            position: afterId ? blocks.find(b => b.id === afterId)!.position + 1 : blocks.length
        };

        setBlocks(prev => {
            let newBlocks = [...prev];
            if (afterId) {
                const index = newBlocks.findIndex(b => b.id === afterId);
                newBlocks.splice(index + 1, 0, newBlock);
                // Update positions
                newBlocks = newBlocks.map((block, idx) => ({ ...block, position: idx }));
            } else {
                newBlocks = [...newBlocks, { ...newBlock, position: newBlocks.length }];
            }
            emitChange(newBlocks);
            return newBlocks;
        });

        setActiveBlockId(newBlock.id);

        // Focus the new block
        setTimeout(() => {
            const element = document.getElementById(`block-${newBlock.id}`);
            element?.focus();
        }, 10);
    }, [blocks, emitChange]);

    const updateBlock = useCallback((id: string, content: string) => {
        setBlocks(prev => {
            const newBlocks = prev.map(block =>
                block.id === id ? { ...block, content } : block
            );
            emitChange(newBlocks);
            return newBlocks;
        });
    }, [emitChange]);

    const changeBlockType = useCallback((id: string, type: Block['type']) => {
        setBlocks(prev => {
            const newBlocks = prev.map(block =>
                block.id === id ? { ...block, type } : block
            );
            emitChange(newBlocks);
            return newBlocks;
        });
    }, [emitChange]);

    const deleteBlock = useCallback((id: string) => {
        if (blocks.length <= 1) return; // Prevent deleting the last block

        const blockIndex = blocks.findIndex(b => b.id === id);
        setBlocks(prev => {
            const newBlocks = prev.filter(block => block.id !== id);
            // Update positions
            const updatedBlocks = newBlocks.map((block, idx) => ({ ...block, position: idx }));
            emitChange(updatedBlocks);
            return updatedBlocks;
        });

        // Focus previous block or next block
        if (blockIndex > 0) {
            const prevBlock = blocks[blockIndex - 1];
            setActiveBlockId(prevBlock.id);
            setTimeout(() => {
                const element = document.getElementById(`block-${prevBlock.id}`);
                element?.focus();
            }, 10);
        } else if (blockIndex === 0 && blocks.length > 1) {
            const nextBlock = blocks[1];
            setActiveBlockId(nextBlock.id);
            setTimeout(() => {
                const element = document.getElementById(`block-${nextBlock.id}`);
                element?.focus();
            }, 10);
        }
    }, [blocks, emitChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlock(blockId);
        } else if (e.key === 'Backspace') {
            const block = blocks.find(b => b.id === blockId);
            if (block && block.content === '' && blocks.length > 1) {
                e.preventDefault();
                deleteBlock(blockId);
            }
        } else if (e.key === '/') {
            const block = blocks.find(b => b.id === blockId);
            if (block && block.content === '') {
                e.preventDefault();
                const element = e.target as HTMLElement;
                const rect = element.getBoundingClientRect();
                setMenuPosition({ x: rect.left, y: rect.bottom });
                setMenuTriggerBlockId(blockId); // Set trigger block ID
                setShowBlockMenu(true);
            }
        }
    }, [blocks, addBlock, deleteBlock]);

    const handlePlusClick = useCallback((blockId: string, event: React.MouseEvent) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setMenuPosition({ x: rect.right + 10, y: rect.top });
        setActiveBlockId(blockId);
        setMenuTriggerBlockId(blockId); // Set trigger block ID
        setShowBlockMenu(true);
    }, []);

    const handleDeleteClick = useCallback((blockId: string) => {
        if (blocks.length > 1) {
            deleteBlock(blockId);
        }
    }, [blocks.length, deleteBlock]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setBlocks((blocks) => {
                const oldIndex = blocks.findIndex(block => block.id === active.id);
                const newIndex = blocks.findIndex(block => block.id === over?.id);

                const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
                    ...block,
                    position: index
                }));

                emitChange(newBlocks);
                return newBlocks;
            });
        }

        setActiveId(null);
    }, [emitChange]);

    const getNumberedListCount = useCallback((block: Block): number => {
        return blocks
            .filter(b => b.type === 'numberedList' && b.position <= block.position)
            .length;
    }, [blocks]);

    const handleBlockMenuClose = useCallback(() => {
        setShowBlockMenu(false);
        setMenuTriggerBlockId(''); // Reset trigger block ID
    }, []);

    const handleBlockTypeSelect = useCallback((type: Block['type']) => {
        if (menuTriggerBlockId) {
            changeBlockType(menuTriggerBlockId, type);
        }
    }, [changeBlockType, menuTriggerBlockId]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (emitChangeRef.current) {
                clearTimeout(emitChangeRef.current);
            }
        };
    }, []);

    if (!isInitialized) {
        return (
            <div className="animate-pulse bg-neutral-800/30 rounded h-20 flex items-center justify-center">
                <span className="text-neutral-400 text-sm">Loading editor...</span>
            </div>
        );
    }

    return (
        <div className="max-w-none relative">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-2">
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        {blocks
                            .sort((a, b) => a.position - b.position)
                            .map((block) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    isActive={activeBlockId === block.id}
                                    isOnlyBlock={blocks.length === 1}
                                    onContentChange={updateBlock}
                                    onKeyDown={handleKeyDown}
                                    onFocus={setActiveBlockId}
                                    onPlusClick={handlePlusClick}
                                    onDeleteClick={handleDeleteClick}
                                    numberedListCount={getNumberedListCount(block)}
                                />
                            ))}
                    </SortableContext>
                </div>
            </DndContext>

            <BlockMenu
                isOpen={showBlockMenu}
                onClose={handleBlockMenuClose}
                onSelectType={handleBlockTypeSelect}
                position={menuPosition}
                triggerBlockId={menuTriggerBlockId}
            />

            {/* Add block button at the end */}
            <div className="mt-6">
                <button
                    onClick={() => addBlock()}
                    className="flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors py-2"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">{placeholder}</span>
                </button>
            </div>
        </div>
    );
};

export default BlockEditor;