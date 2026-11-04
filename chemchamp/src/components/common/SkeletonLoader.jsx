import React from "react";

export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-1/3 h-4 bg-slate-800 rounded-lg" />
        <div className="w-16 h-5 bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 bg-slate-800/60 rounded" />
        <div className="w-4/5 h-3 bg-slate-800/60 rounded" />
      </div>
      <div className="pt-2 flex items-center gap-2">
        <div className="w-20 h-6 bg-slate-800 rounded-lg" />
        <div className="w-24 h-6 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="w-2/5 h-3.5 bg-slate-800 rounded" />
              <div className="w-3/5 h-2.5 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="w-16 h-8 bg-slate-800 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHero({ className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 animate-pulse ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="w-1/4 h-4 bg-slate-800 rounded" />
          <div className="w-1/3 h-3 bg-slate-800/60 rounded" />
        </div>
      </div>
      <div className="w-full h-8 bg-slate-800/40 rounded-xl" />
    </div>
  );
}

/**
 * AppInitialSkeleton - Full-Page Realistic App Shell Skeleton
 * Displays immediately at initial app boot without ugly "লোড হচ্ছে..." text.
 */
export function AppInitialSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col animate-pulse selection:bg-emerald-500/20">
      {/* Top Navbar Skeleton */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-900 px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800/90" />
          <div className="w-24 h-4 bg-slate-800/80 rounded-md hidden sm:block" />
        </div>

        {/* Center Nav Pills */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="w-16 h-7 bg-slate-800/80 rounded-xl" />
          <div className="w-20 h-7 bg-slate-800/50 rounded-xl" />
          <div className="w-20 h-7 bg-slate-800/50 rounded-xl" />
          <div className="w-20 h-7 bg-slate-800/50 rounded-xl" />
          <div className="w-20 h-7 bg-slate-800/50 rounded-xl" />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-7 bg-slate-900 border border-slate-800/80 rounded-xl hidden sm:block" />
          <div className="w-14 h-7 bg-slate-900 border border-slate-800/80 rounded-xl" />
          <div className="w-8 h-8 rounded-xl bg-slate-800/90" />
        </div>
      </header>

      {/* Main Page Body Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Header Hero Strip Skeleton */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/90" />
              <div className="space-y-2">
                <div className="w-36 h-4 bg-slate-800/90 rounded" />
                <div className="w-24 h-3 bg-slate-800/50 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-7 bg-slate-800/70 rounded-xl" />
              <div className="w-20 h-7 bg-slate-800/70 rounded-xl" />
            </div>
          </div>
          {/* Progress line placeholder */}
          <div className="w-full h-16 bg-slate-950/60 border border-slate-800/50 rounded-xl" />
        </div>

        {/* 2-Column Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Column */}
          <div className="lg:col-span-8 space-y-5">
            <div className="h-10 bg-slate-900/60 border border-slate-800/80 rounded-xl" />
            <div className="h-28 bg-slate-900/70 border border-slate-800/80 rounded-2xl" />
            <div className="h-44 bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-slate-900/60 border border-slate-800/80 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Right Companion Column */}
          <div className="lg:col-span-4 space-y-5">
            <div className="h-40 bg-slate-900/70 border border-slate-800/80 rounded-2xl" />
            <div className="h-24 bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
            <div className="h-28 bg-slate-900/60 border border-slate-800/80 rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
