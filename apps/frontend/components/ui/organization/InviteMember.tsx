"use client";

import { useState } from "react";
import { X } from "lucide-react";
import LoadingButton from "../loading/LoadingButton";
import { getAxiosErrorMessage } from "@/utils/errorMessage";
import { toast } from "react-hot-toast";
import { OrganizationInviteRequest } from "@/lib/types/organization";

export default function InviteMemberModal({ isOpen, onClose, onInvite }: {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (data: OrganizationInviteRequest) => Promise<void>;
}) {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async () => {
        setLoading(true);
        try {
            await onInvite({ email, message });
            setEmail("");
            setMessage("");
            onClose();
        } catch (e: any) {
            const errMsg = getAxiosErrorMessage(e);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            {/* Mobile: Full height on small screens, centered on larger screens */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden flex flex-col 
                           min-h-[50vh] sm:min-h-0 max-h-[90vh] sm:max-h-none">
                
                {/* Header - Enhanced touch targets for mobile */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800 shrink-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">Invite Member</h2>
                    <button 
                        onClick={onClose} 
                        className="p-3 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors touch-manipulation"
                        aria-label="Close modal"
                    >
                        <X size={20} className="sm:w-5 sm:h-5 w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable on mobile if needed */}
                <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 flex-1 overflow-y-auto">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter member email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base sm:text-sm"
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="message" className="block text-sm font-medium text-neutral-300">
                            Message (Optional)
                        </label>
                        <textarea
                            id="message"
                            placeholder="Enter a welcome message..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 sm:px-3 sm:py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base sm:text-sm"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Footer - Enhanced button layout for mobile */}
                <div className="p-4 sm:p-6 border-t border-neutral-800 shrink-0">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
                        <button
                            onClick={onClose}
                            className="order-2 sm:order-1 px-6 py-3 sm:px-4 sm:py-2 text-neutral-400 hover:text-white 
                                     hover:bg-neutral-800 rounded-lg transition-colors font-medium text-base sm:text-sm touch-manipulation"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <LoadingButton
                            type="submit"
                            className="order-1 sm:order-2 w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 
                                     disabled:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25 
                                     text-base sm:text-sm touch-manipulation"
                            loading={loading}
                            onClick={handleInvite}
                            disabled={!email.trim() || loading}
                        >
                            Send Invitation
                        </LoadingButton>
                    </div>
                </div>
            </div>
        </div>
    );
}