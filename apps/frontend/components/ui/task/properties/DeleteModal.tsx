import React from "react";
import { X, Trash2 } from "lucide-react";

interface DeleteModalProps {
    open: boolean;
    title: string;
    description: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    hideCancel?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
    open,
    title,
    description,
    isLoading = false,
    onConfirm,
    onCancel,
    confirmText = "Delete",
    cancelText = "Cancel",
    hideCancel = false,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 z-10">
                <button
                    className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 transition-colors"
                    onClick={onCancel}
                    disabled={isLoading}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="mb-3">
                        <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
                    </div>
                    <h2 className="text-lg font-semibold text-neutral-100 mb-2">{title}</h2>
                    <p className="text-neutral-400 mb-6">{description}</p>
                    <div className="flex gap-3 justify-center w-full">
                        {!hideCancel && (
                            <button
                                className="flex-1 h-10 rounded-md border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors font-medium"
                                onClick={onCancel}
                                disabled={isLoading}
                                type="button"
                            >
                                {cancelText || "Cancel"}
                            </button>
                        )}
                        <button
                            className="flex-1 h-10 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-60"
                            onClick={onConfirm}
                            disabled={isLoading}
                            type="button"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Deleting...
                                </span>
                            ) : (
                                confirmText || "Delete"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
