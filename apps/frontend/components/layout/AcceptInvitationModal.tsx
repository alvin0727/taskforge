import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getAxiosErrorMessage } from "@/utils/errorMessage";
import organizationService from "@/services/organization/organizationService";

interface AcceptInvitationModalProps {
  open: boolean;
  onClose: () => void;
  invitationToken: string;
  invitationInfo?: {
    organization_name?: string;
    inviter_name?: string;
    role?: string;
    message?: string;
    email?: string;
  };
}

export default function AcceptInvitationModal({
  open,
  onClose,
  invitationToken,
  invitationInfo
}: AcceptInvitationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    try {
      // await organizationService.acceptInvitation(invitationToken);
      toast.success("Invitation accepted! You have joined the organization.");
      const url = new URL(window.location.href);
      url.searchParams.delete("invitationToken");
      window.history.replaceState({}, "", url.toString());
      onClose();
    } catch (err) {
      setError(getAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    toast("Invitation ignored.");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full mx-auto p-8 z-10">
        <button
          className="absolute top-4 right-4 text-neutral-400 hover:text-blue-400"
          onClick={onClose}
        >
          <FiX size={24} />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="6" fill="#2563EB" />
            <rect x="6" y="7" width="4" height="14" rx="2" fill="white" />
            <rect x="12" y="7" width="4" height="10" rx="2" fill="white" />
            <rect x="18" y="7" width="4" height="6" rx="2" fill="white" />
          </svg>
          <span className="text-xl font-bold text-blue-400">TaskForge</span>
        </div>
        <div className="text-xl font-bold text-blue-400 mb-2">Accept Organization Invitation</div>
        <div className="mb-4 text-neutral-300">
          {invitationInfo?.organization_name ? (
            <>
              <span>You are invited to join <b>{invitationInfo.organization_name}</b></span>
              {invitationInfo.inviter_name && (
                <span> by <b>{invitationInfo.inviter_name}</b></span>
              )}
              {invitationInfo.role && (
                <span> as <b>{invitationInfo.role}</b></span>
              )}
              <br />
              {invitationInfo.message && (
                <span className="block mt-2 text-sm text-green-700 bg-green-50 rounded p-2">"{invitationInfo.message}"</span>
              )}
            </>
          ) : (
            <span>Do you want to accept this organization invitation?</span>
          )}
        </div>
        {error && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
        )}
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Accepting..." : "Accept"}
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold border border-neutral-700 transition-all"
            onClick={handleDecline}
            disabled={loading}
          >
            Decline
          </button>
        </div>
      </div>
    </Dialog>
  );
}
