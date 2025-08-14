"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";
import LoadingButton from "@/components/ui/loading/LoadingButton";
import userService from "@/services/users/userService";
import { getAxiosErrorMessage } from "@/utils/errorMessage";

function VerifyEmailPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Verification token is missing.");
                return;
            }
            try {
                await userService.verifyEmail(token);
                setStatus("success");
                setMessage("Your email has been verified! You can now log in.");
            } catch (error) {
                setStatus("error");
                setMessage(
                    getAxiosErrorMessage(error) ||
                    "Verification failed. Please try again or request a new verification email."
                );
            }
        };
        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
            <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex flex-col items-center mb-8">
                    {status === "pending" && (
                        <LoadingButton loading={true} className="mb-4" />
                    )}
                    {status === "success" && (
                        <HiCheckCircle size={48} className="text-green-500 mb-4" />
                    )}
                    {status === "error" && (
                        <HiXCircle size={48} className="text-red-500 mb-4" />
                    )}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {status === "success" ? "Email Verified" : "Verify Your Email"}
                    </h2>
                    <p className="text-neutral-400 text-center mb-4">{message}</p>
                    {status === "success" && (
                        <button
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
                            onClick={() => router.push("/user/login")}
                        >
                            Go to Login
                        </button>
                    )}
                    {status === "error" && (
                        <button
                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
                            onClick={() => router.push("/user/signup")}
                        >
                            Back to Signup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={null}>
            <VerifyEmailPageInner />
        </Suspense>
    );
}