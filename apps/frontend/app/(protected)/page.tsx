"use client";

import { useRouter } from "next/navigation";
import { HiOutlineClipboardList } from "react-icons/hi";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-blue-950 to-neutral-800">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center px-6 py-16 rounded-3xl bg-neutral-900/90 shadow-2xl border border-neutral-800">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-800/60 p-4 shadow-lg">
              <HiOutlineClipboardList className="text-blue-400" size={48} />
            </span>
            <span className="text-4xl font-extrabold text-white tracking-tight">
              TaskForge
            </span>
          </div>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-blue-100 max-w-2xl">
            Organize. Collaborate. Succeed.
          </h2>
          <p className="text-center text-lg text-neutral-400 max-w-xl">
            TaskForge is your all-in-one productivity platform. Manage projects,
            assign tasks, collaborate with your team, and visualize your workflow
            in a beautiful, intuitive interface.
          </p>
          <button
            className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition text-lg"
            onClick={() => router.push("/board/6889bb18f74d4181a0eac0a0")}
          >
            🚀 Let's Try
          </button>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center shadow">
            <span className="text-blue-400 text-2xl mb-2">📋</span>
            <span className="font-semibold text-white mb-1">
              Easy Task Management
            </span>
            <span className="text-neutral-400 text-sm">
              Create, assign, and track tasks effortlessly. Stay organized with
              lists, priorities, and deadlines.
            </span>
          </div>
          <div className="bg-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center shadow">
            <span className="text-blue-400 text-2xl mb-2">🤝</span>
            <span className="font-semibold text-white mb-1">
              Team Collaboration
            </span>
            <span className="text-neutral-400 text-sm">
              Collaborate in real-time, share files, comment, and keep everyone
              aligned in one workspace.
            </span>
          </div>
          <div className="bg-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center shadow">
            <span className="text-blue-400 text-2xl mb-2">📈</span>
            <span className="font-semibold text-white mb-1">
              Progress Tracking
            </span>
            <span className="text-neutral-400 text-sm">
              Visualize your workflow with boards, analytics, and progress charts
              to monitor your team's success.
            </span>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center shadow">
            <span className="text-blue-400 text-2xl mb-2">🔔</span>
            <span className="font-semibold text-white mb-1">
              Smart Notifications
            </span>
            <span className="text-neutral-400 text-sm">
              Get notified instantly about important updates, deadlines, and
              mentions.
            </span>
          </div>
          <div className="bg-neutral-800 rounded-2xl p-6 flex flex-col items-center text-center shadow">
            <span className="text-blue-400 text-2xl mb-2">🔒</span>
            <span className="font-semibold text-white mb-1">
              Secure & Reliable
            </span>
            <span className="text-neutral-400 text-sm">
              Your data is protected with enterprise-grade security and daily
              backups.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}