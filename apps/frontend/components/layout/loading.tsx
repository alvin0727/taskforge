import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full flex items-center justify-center h-full bg-white dark:bg-neutral-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 dark:text-white animate-spin" />
        <span className="text-blue-600 dark:text-white font-semibold text-lg">Loading...</span>
      </div>
    </div>
  );
}