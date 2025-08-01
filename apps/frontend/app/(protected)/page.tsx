"use client";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { HiOutlineClipboardList, HiOutlineUserCircle } from "react-icons/hi";

export default function Home() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-300 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 px-4">
      <div className="max-w-xl w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <HiOutlineClipboardList className="text-blue-600 dark:text-blue-400" size={48} />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white text-center">
            Welcome to <span className="text-blue-600 dark:text-blue-400">TaskForge</span>
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 text-center">
            Organize your tasks, collaborate with your team, and boost your productivity.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-neutral-800 px-4 py-2 rounded-lg">
          <HiOutlineUserCircle className="text-blue-600 dark:text-blue-400" size={28} />
          <div>
            <div className="font-semibold text-neutral-800 dark:text-white">{user?.name || "User"}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-300">{user?.email}</div>
          </div>
        </div>
        <button
          className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition text-lg"
          onClick={() => router.push("/board/6889bb18f74d4181a0eac0a0")}
        >
          🚀 Go to My Board
        </button>
      </div>
      <footer className="mt-10 text-neutral-400 text-sm text-center">
        &copy; {new Date().getFullYear()} TaskForge. All rights reserved.
      </footer>
    </div>
  );
}