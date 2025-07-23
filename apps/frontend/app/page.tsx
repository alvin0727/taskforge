"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        onClick={() => router.push("/workflow/68810088d06f13e27c84d656")}
      >
        Go to Workflow
      </button>
    </div>
  );
}
