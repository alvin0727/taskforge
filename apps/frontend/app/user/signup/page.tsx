
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white dark:bg-neutral-900">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-600 text-white rounded-full p-4 shadow-lg mb-2">
                        <HiUserPlus size={36} />
                    </div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Sign Up</h2>
                    <p className="text-neutral-500 dark:text-neutral-300 text-sm text-center">
                        Create your TaskForge account
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block mb-1 text-neutral-800 dark:text-neutral-200 font-medium">Email</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                <HiOutlineMail size={20} />
                            </span>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition autofill:!bg-neutral-50 dark:autofill:!bg-neutral-800 autofill:!text-neutral-900 dark:autofill:!text-white"
                                placeholder="you@email.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="name" className="block mb-1 text-neutral-800 dark:text-neutral-200 font-medium">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                <HiUser size={20} />
                            </span>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition autofill:!bg-neutral-50 dark:autofill:!bg-neutral-800 autofill:!text-neutral-900 dark:autofill:!text-white"
                                placeholder="Username"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block mb-1 text-neutral-800 dark:text-neutral-200 font-medium">Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                <HiLockClosed size={20} />
                            </span>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition autofill:!bg-neutral-50 dark:autofill:!bg-neutral-800 autofill:!text-neutral-900 dark:autofill:!text-white"
                                placeholder="Password"
                            />
                        </div>
                    </div>
                    {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
                    <LoadingButton
                        type="submit"
                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow"
                        loading={loading}
                    >
                        Sign Up
                    </LoadingButton>
                </form>
                <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-300">
                    Already have an account?{' '}
                    <Link href="/user/login" className="text-blue-600 dark:text-blue-400 underline">Login</Link>
                </p>
            </div>
        </div>
    );
}
