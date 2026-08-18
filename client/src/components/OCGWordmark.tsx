import React from "react";

interface OCGWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showDescriptor?: boolean;
}

export default function OCGWordmark({
  className = "",
  size = "md",
  showDescriptor = false,
}: OCGWordmarkProps) {
  const sizeClasses = {
    sm: "text-xl tracking-[-0.08em]",
    md: "text-2xl tracking-[-0.085em]",
    lg: "text-4xl tracking-[-0.09em]",
    xl: "text-6xl tracking-[-0.095em]",
    hero: "text-[clamp(4.5rem,13vw,9.5rem)] tracking-[-0.105em]",
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center">
        <span
          className={`font-black font-sans leading-[0.8] select-none text-transparent bg-clip-text bg-gradient-to-b from-[#111317] via-[#2A2E39] to-[#1D4ED8] ${sizeClasses[size]}`}
          style={{ letterSpacing: "-0.09em" }}
        >
          OCG
        </span>
      </div>
      {showDescriptor && (
        <span className="mt-1 text-[9px] uppercase tracking-[0.24em] font-semibold text-slate-400 leading-tight">
          Real Estate Investment + Acquisition
        </span>
      )}
    </div>
  );
}
