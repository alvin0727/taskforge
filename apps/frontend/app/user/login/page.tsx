"use client";

import UserService from "@/services/users/userService";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HiLockClosed, HiShieldCheck } from "react-icons/hi2";
import { HiMail } from "react-icons/hi";
import LoadingButton from "@/components/ui/loading/LoadingButton";
import { useUserStore } from "@/stores/userStore";
import { getAxiosErrorMessage } from "@/utils/errorMessage";
import userService from "@/services/users/userService";


export default function Login() {
    const router = useRouter();
    const [step, setStep] = useState<"login" | "otp">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(60);
    const [resending, setResending] = useState(false);
    const [loading, setLoading] = useState(false);

    const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

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
            await UserService.login(email, password);
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
            const response = await UserService.verifyOTP(email, code);
            if (response && response.user) {
                useUserStore.setState({ user: response.user });
            }
            router.push("/");
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white dark:bg-neutral-900">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-600 text-white rounded-full p-4 shadow-lg mb-2">
                        {step === "login" ? <HiLockClosed size={36} /> : <HiShieldCheck size={36} />}
                    </div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                        {step === "login" ? "Login" : "OTP Verification"}
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-300 text-sm">
                        {step === "login"
                            ? "Sign in to your TaskForge account"
                            : "Enter the 4-digit OTP code sent to your email"}
                    </p>
                </div>
                {step === "login" && (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block mb-1 text-neutral-800 dark:text-neutral-200 font-medium">Email</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                    <HiMail size={20} />
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition autofill:!bg-neutral-50 dark:autofill:!bg-neutral-800 autofill:!text-neutral-900 dark:autofill:!text-white"
                                    placeholder="you@email.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 text-neutral-800 dark:text-neutral-200 font-medium">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                    <HiLockClosed size={20} />
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition autofill:!bg-neutral-50 dark:autofill:!bg-neutral-800 autofill:!text-neutral-900 dark:autofill:!text-white"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                        {error && <div className="text-red-500 mb-2">{error}</div>}
                        <LoadingButton
                            type="submit"
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow"
                            loading={loading}
                        >
                            Login
                        </LoadingButton>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div>
                            <label className="block mb-3 text-neutral-800 dark:text-neutral-200 font-medium text-center">
                                OTP Code
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
                                        className="w-14 h-14 text-center text-2xl rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={timer > 0 || resending}
                                className={`text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Resend OTP {timer > 0 && `in ${timer}s`}
                            </button>
                        </div>
                        {error && <div className="text-red-500 mb-2 text-center">{error}</div>}
                        <LoadingButton
                            type="submit"
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow"
                            loading={loading}
                        >
                            Verify OTP
                        </LoadingButton>
                    </form>
                )}
            </div>
        </div>
    );
}