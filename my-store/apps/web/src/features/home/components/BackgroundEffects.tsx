"use client";

export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5" />
      <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-indigo-500/10 blur-[100px] dark:indigo-600/5" />
    </div>
  );
}
