"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HiUserPlus, HiUser, HiLockClosed } from "react-icons/hi2";
import { HiOutlineMail } from "react-icons/hi";
import LoadingButton from "@/components/ui/loading/LoadingButton";
import userService from "@/services/users/userService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        name: "",
        password: "",
    });
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
                // Optional: log error for debugging, but don't show to user
                // console.warn("Not authenticated:", error);
            }
        }
        checkAuthenticated();
        return () => { isMounted = false; };
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.email || !form.name || !form.password) {
            setError("All fields are required.");
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
            setError("Invalid email format.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        setLoading(true);
        try {
            await userService.signup(form.email, form.name, form.password);
            toast.success("Registration successful! Please login.");
            setForm({ email: "", name: "", password: "" });
            router.push("/user/login");
        } catch (err) {
            setError("An error occurred. Please try again.");
            toast.error("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

            <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-neutral-900 border border-neutral-800 relative z-10">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-lg mb-4">
                        <HiUserPlus size={32} />
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

                    <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
                    <p className="text-neutral-400 text-sm text-center">
                        Join TaskForge and start managing your projects
                    </p>
                </div>

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
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
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
                        Create Account
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

                {/* Additional Info */}
                <div className="mt-6 p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-white font-medium text-sm mb-1">Start managing projects instantly</h4>
                            <p className="text-neutral-400 text-xs">
                                Get access to boards, tasks, workflows, and team collaboration tools.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}