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
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
    hero: "text-[clamp(4rem,11vw,8rem)]",
  };

  const subClasses = {
    sm: "text-[8px] tracking-[0.28em]",
    md: "text-[9px] tracking-[0.32em]",
    lg: "text-[11px] tracking-[0.34em]",
    xl: "text-[13px] tracking-[0.36em]",
    hero: "text-[14px] sm:text-[16px] tracking-[0.40em]",
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center">
        <span
          className={`font-black font-sans leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-[#181B20] via-[#222731] to-[#1D4ED8] ${sizeClasses[size]}`}
          style={{ letterSpacing: "-0.075em", fontWeight: 950 }}
        >
          OCG
        </span>
      </div>
      <div className="flex items-center mt-1">
        <span className={`uppercase font-bold text-slate-400 select-none leading-none ${subClasses[size]}`}>
          THE OC GROUP
        </span>
      </div>
      {showDescriptor && (
        <span className="mt-1.5 text-[10px] uppercase tracking-[0.24em] font-semibold text-blue-400 leading-tight">
          Real Estate Investment + Acquisition
        </span>
      )}
    </div>
  );
}
