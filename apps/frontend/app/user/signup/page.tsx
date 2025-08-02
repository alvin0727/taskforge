"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HiUserPlus, HiUser, HiLockClosed, HiBuildingOffice2, HiUserGroup } from "react-icons/hi2";
import { HiOutlineMail } from "react-icons/hi";
import LoadingButton from "@/components/ui/loading/LoadingButton";
import userService from "@/services/users/userService";
import organizationService from "@/services/organization/organizationService";
import toast from "react-hot-toast";
import { getAxiosErrorMessage } from "@/utils/errorMessage";
import { InvitationInfo } from "@/lib/types/organization";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invitationToken = searchParams.get('token');
    
    // Determine signup type based on URL params
    const [signupType, setSignupType] = useState(() => {
        if (invitationToken) return 'invitation';
        return 'personal'; // Default to personal
    });
    
    const [form, setForm] = useState({
        email: "",
        name: "",
        password: "",
        organizationName: "",
        organizationDescription: "",
    });
    
    const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        async function checkAuthenticated() {
            try {
                const profile = await userService.getProfile();
                if (profile && isMounted) {
                    router.replace("/");
                }
            } catch (error) {
                // Not authenticated, continue with signup
            }
        }
        
        // If there's an invitation token, validate it
        async function validateInvitation() {
            if (invitationToken && isMounted) {
                try {
                    // Call API to get invitation details
                    const invitationDetails = await organizationService.getInvitationDetails(invitationToken);
                    setInvitationInfo(invitationDetails);
                    setForm(prev => ({ ...prev, email: invitationDetails.email }));
                } catch (error) {
                    toast.error("Invalid or expired invitation link");
                    setSignupType('personal');
                }
            }
        }
        
        checkAuthenticated();
        validateInvitation();
        
        return () => { isMounted = false; };
    }, [router, invitationToken]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSignupTypeChange = (type: string) => {
        if (invitationToken && type !== 'invitation') {
            toast.error("You must complete the invitation signup");
            return;
        }
        setSignupType(type);
        setError("");
    };

    const validateForm = () => {
        if (!form.email || !form.name || !form.password) {
            setError("All fields are required.");
            return false;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
            setError("Invalid email format.");
            return false;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return false;
        }
        if (signupType === 'team' && !form.organizationName.trim()) {
            setError("Organization name is required for team signup.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            let result;
            
            switch (signupType) {
                case 'personal':
                    result = await userService.signupPersonal({
                        email: form.email,
                        name: form.name,
                        password: form.password
                    });
                    break;
                    
                case 'team':
                    result = await userService.signupTeam({
                        email: form.email,
                        name: form.name,
                        password: form.password,
                        organization_name: form.organizationName,
                        organization_description: form.organizationDescription
                    });
                    break;
                    
                case 'invitation':
                    result = await userService.signupWithInvitation({
                        email: form.email,
                        name: form.name,
                        password: form.password,
                        invitation_token: invitationToken ?? ""
                    });
                    break;
            }
            
            // Redirect to verification pending page or login
            router.push("/user/login?message=Please check your email for verification");
            
        } catch (err) {
            const errorMsg = getAxiosErrorMessage(err);
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getHeaderContent = () => {
        switch (signupType) {
            case 'invitation':
                return {
                    icon: <HiUserGroup size={32} />,
                    title: `Join ${invitationInfo?.organization_name || 'Organization'}`,
                    subtitle: `You've been invited to join this organization. Complete your registration to get started.`
                };
            case 'team':
                return {
                    icon: <HiBuildingOffice2 size={32} />,
                    title: "Create Team Organization",
                    subtitle: "Set up your team workspace and invite members to collaborate"
                };
            default:
                return {
                    icon: <HiUserPlus size={32} />,
                    title: "Create Personal Workspace",
                    subtitle: "Start with your own workspace and invite team members later"
                };
        }
    };

    const headerContent = getHeaderContent();

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-neutral-950"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]"></div>

            {/* TaskForge Logo Pattern */}
            <div className="absolute top-10 left-10 opacity-10">
                <svg width="48" height="48" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="28" height="28" rx="6" fill="#2563EB" />
                    <rect x="6" y="7" width="4" height="14" rx="2" fill="white" />
                    <rect x="12" y="7" width="4" height="10" rx="2" fill="white" />
                    <rect x="18" y="7" width="4" height="6" rx="2" fill="white" />
                </svg>
            </div>

            <div className="w-full max-w-lg p-8 rounded-2xl shadow-2xl bg-neutral-900 border border-neutral-800 relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-lg mb-4">
                        {headerContent.icon}
                    </div>

                    {/* TaskForge Brand */}
                    <div className="flex items-center gap-2 mb-2">
                        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="28" height="28" rx="6" fill="#2563EB" />
                            <rect x="6" y="7" width="4" height="14" rx="2" fill="white" />
                            <rect x="12" y="7" width="4" height="10" rx="2" fill="white" />
                            <rect x="18" y="7" width="4" height="6" rx="2" fill="white" />
                        </svg>
                        <span className="text-xl font-bold text-blue-400">TaskForge</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">{headerContent.title}</h2>
                    <p className="text-neutral-400 text-sm text-center">
                        {headerContent.subtitle}
                    </p>
                </div>

                {/* Signup Type Selector - Only show if not invitation */}
                {!invitationToken && (
                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleSignupTypeChange('personal')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    signupType === 'personal'
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                        : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                                }`}
                            >
                                <HiUser className="mb-2" size={20} />
                                <div className="text-sm font-medium">Personal</div>
                                <div className="text-xs opacity-80">Individual workspace</div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleSignupTypeChange('team')}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                    signupType === 'team'
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                        : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                                }`}
                            >
                                <HiBuildingOffice2 className="mb-2" size={20} />
                                <div className="text-sm font-medium">Team</div>
                                <div className="text-xs opacity-80">Create organization</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Invitation Info */}
                {invitationInfo && (
                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500 text-white rounded-full p-2">
                                <HiUserGroup size={16} />
                            </div>
                            <div>
                                <div className="text-green-400 font-medium text-sm">Invitation to join</div>
                                <div className="text-white font-semibold">{invitationInfo.organization_name}</div>
                                <div className="text-neutral-400 text-xs">Role: {invitationInfo.role}</div>
                            </div>
                        </div>
                        {invitationInfo.message && (
                            <div className="mt-3 pt-3 border-t border-green-500/20">
                                <div className="text-xs text-neutral-300">
                                    <strong>Message:</strong> {invitationInfo.message}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block mb-2 text-neutral-200 font-medium text-sm">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                                <HiOutlineMail size={18} />
                            </span>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={form.email}
                                onChange={handleChange}
                                disabled={!!invitationInfo} // Disable if invitation
                                required
                                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all ${
                                    invitationInfo ? 'border-neutral-600 opacity-75' : 'border-neutral-700'
                                }`}
                                placeholder="you@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block mb-2 text-neutral-200 font-medium text-sm">Full Name</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                                <HiUser size={18} />
                            </span>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2 text-neutral-200 font-medium text-sm">Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                                <HiLockClosed size={18} />
                            </span>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                placeholder="Create a strong password"
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            Password must be at least 6 characters long
                        </p>
                    </div>

                    {/* Team Organization Fields */}
                    {signupType === 'team' && (
                        <>
                            <div>
                                <label htmlFor="organizationName" className="block mb-2 text-neutral-200 font-medium text-sm">Organization Name</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                                        <HiBuildingOffice2 size={18} />
                                    </span>
                                    <input
                                        type="text"
                                        name="organizationName"
                                        id="organizationName"
                                        value={form.organizationName}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="Your Company Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="organizationDescription" className="block mb-2 text-neutral-200 font-medium text-sm">Description (Optional)</label>
                                <textarea
                                    name="organizationDescription"
                                    id="organizationDescription"
                                    value={form.organizationDescription}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                                    placeholder="Brief description of your organization..."
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <LoadingButton
                        type="submit"
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
                        loading={loading}
                    >
                        {signupType === 'invitation' ? `Join ${invitationInfo?.organization_name || 'Organization'}` : 'Create Account'}
                    </LoadingButton>
                </form>

                <div className="mt-6 pt-6 border-t border-neutral-800">
                    <p className="text-center text-sm text-neutral-400">
                        Already have an account?{' '}
                        <Link href="/user/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* Feature Info */}
                <div className="mt-6 p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-white font-medium text-sm mb-1">
                                {signupType === 'team' ? 'Team collaboration ready' : 'Start managing projects instantly'}
                            </h4>
                            <p className="text-neutral-400 text-xs">
                                {signupType === 'team' 
                                    ? 'Invite team members, assign roles, and collaborate on projects from day one.'
                                    : 'Get access to boards, tasks, workflows, and team collaboration tools.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}