"use client";

import UserService from "@/services/users/userService";
import toast from "react-hot-toast";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { HiLockClosed, HiShieldCheck } from "react-icons/hi2";
import { HiMail } from "react-icons/hi";
import LoadingButton from "@/components/ui/loading/LoadingButton";
import { useUserStore } from "@/stores/userStore";
import { getAxiosErrorMessage } from "@/utils/errorMessage";
import userService from "@/services/users/userService";
import { useSearchParams } from "next/navigation";

function LoginInner() {
    const router = useRouter();

    const searchParams = useSearchParams();
    const [step, setStep] = useState<"login" | "otp">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(60);
    const [resending, setResending] = useState(false);
    const [loading, setLoading] = useState(false);
    const invitationToken = searchParams.get("token");

    const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    useEffect(() => {
        let isMounted = true;
        async function checkAuthenticated() {
            try {
                const profile = await userService.getProfile();

                if (profile && isMounted) {
                    if (invitationToken) {
                        router.push(`/?invitationToken=${invitationToken}`);
                    } else {
                        router.push("/dashboard");
                    }
                }
            } catch (error) {
                // Optional: log error for debugging, but don't show to user
                // console.warn("Not authenticated:", error);
            }
        }
        checkAuthenticated();
        return () => { isMounted = false; };
    }, [router]);

    useEffect(() => {
        const message = searchParams.get("message");
        if (message) {
            toast.success(message);
        }
    }, [searchParams]);

    useEffect(() => {
        const msg = sessionStorage.getItem("authError");
        if (msg) {
            toast.error(msg, { duration: 3000 });
            sessionStorage.removeItem("authError");
        }
    }, []);

    useEffect(() => {
        if (step === "otp" && timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [step, timer]);

    const handleLogin = async (event: React.FormEvent) => {
        if (loading) return; // Prevent multiple submissions
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            await UserService.login({ email, password });
            toast.success("Login successful");
            setStep("otp");
            setTimer(60);
            setOtp(["", "", "", ""]);
        } catch (error) {
            const message = getAxiosErrorMessage(error);
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (idx: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[idx] = value;
        setOtp(newOtp);

        // Auto focus next
        if (value && idx < 3) {
            otpRefs[idx + 1].current?.focus();
        }
        // Auto focus prev on backspace
        if (!value && idx > 0) {
            otpRefs[idx - 1].current?.focus();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        if (loading) return; // Prevent multiple submissions
        setLoading(true);
        e.preventDefault();
        const code = otp.join("");
        if (code.length < 4) {
            setError("Please enter the 4-digit OTP code.");
            return;
        }
        setError("");
        try {
            const response = await UserService.verifyOTP({ email, otp: code });
            if (response && response.user) {
                useUserStore.setState({ user: response.user });
            }
            if (invitationToken) {
                router.push(`/?invitationToken=${invitationToken}`);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            const message = getAxiosErrorMessage(err);
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        // Call your resend OTP service here
        setTimeout(() => {
            toast.success("OTP resent!");
            setTimer(60);
            setResending(false);
            setOtp(["", "", "", ""]);
            otpRefs[0].current?.focus();
        }, 1000);
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

            <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-neutral-900 border border-neutral-800 relative z-10 m-2">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-lg mb-4">
                        {step === "login" ? <HiLockClosed size={32} /> : <HiShieldCheck size={32} />}
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

                    <h2 className="text-2xl font-bold text-white mb-1">
                        {step === "login" ? "Welcome Back" : "Verify Your Identity"}
                    </h2>
                    <p className="text-neutral-400 text-sm text-center">
                        {step === "login"
                            ? "Sign in to continue to your workspace"
                            : "Enter the 4-digit code sent to your email"}
                    </p>
                </div>

                {step === "login" && (
                    <>
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block mb-2 text-neutral-200 font-medium text-sm">Email Address</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                                        <HiMail size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 text-neutral-200 font-medium text-sm">Password</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                                        <HiLockClosed size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                        placeholder="Enter your password"
                                    />
                                </div>
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
                                Sign In
                            </LoadingButton>
                        </form>

                        <div className="mt-6 pt-6 border-t border-neutral-800">
                            <p className="text-center text-sm text-neutral-400">
                                Don't have an account?{' '}
                                <a href="/user/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Create Account
                                </a>
                            </p>
                        </div>
                    </>
                )}

                {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div>
                            <label className="block mb-4 text-neutral-200 font-medium text-center">
                                Verification Code
                            </label>
                            <div className="flex justify-center gap-3">
                                {otp.map((val, idx) => (
                                    <input
                                        key={idx}
                                        ref={otpRefs[idx]}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={val}
                                        onChange={e => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                                                otpRefs[idx - 1].current?.focus();
                                            }
                                        }}
                                        className="w-14 h-14 text-center text-xl font-semibold rounded-lg border border-neutral-700 bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={timer > 0 || resending}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-400"
                            >
                                {resending ? "Sending..." : timer > 0 ? `Resend code in ${timer}s` : "Resend code"}
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <LoadingButton
                            type="submit"
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
                            loading={loading}
                        >
                            Verify Code
                        </LoadingButton>

                        <button
                            type="button"
                            onClick={() => setStep("login")}
                            className="w-full py-2 text-neutral-400 hover:text-neutral-300 font-medium transition-colors"
                        >
                            ← Back to login
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function Login() {
       return (
        <Suspense fallback={null}>
            <LoginInner />
        </Suspense>
    );
}