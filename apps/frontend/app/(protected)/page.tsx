"use client";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";

export default function Home() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  console.log("User:", user);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        onClick={() => router.push("/board/6889bb18f74d4181a0eac0a0")}
      >
        Go to Board
      </button>
    </div>
  );
}
