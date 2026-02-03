"use client";

import { Loader2 } from "lucide-react";

interface AuthLoadingScreenProps {
  message: string;
}

export function AuthLoadingScreen({ message }: AuthLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
        <p className="text-white/80 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
