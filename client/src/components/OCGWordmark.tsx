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
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl",
    hero: "text-[clamp(4.5rem,12vw,9rem)]",
  };

  const subClasses = {
    sm: "text-[9px] tracking-[0.38em]",
    md: "text-[11px] tracking-[0.40em]",
    lg: "text-[14px] tracking-[0.42em]",
    xl: "text-[18px] tracking-[0.45em]",
    hero: "text-[16px] sm:text-[20px] tracking-[0.45em]",
  };

  const dividerClasses = {
    sm: "h-[1.5px] my-1",
    md: "h-[2px] my-1.5",
    lg: "h-[2.5px] my-2",
    xl: "h-[3px] my-2.5",
    hero: "h-[3.5px] sm:h-[4.5px] my-3 sm:my-4",
  };

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      {/* 1. Architectural Heavy OCG Block Lettering */}
      <div className="flex items-center">
        <span
          className={`font-black font-sans leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] ${sizeClasses[size]}`}
          style={{ 
            letterSpacing: "-0.065em", 
            fontWeight: 950,
            textShadow: "0 2px 20px rgba(37,99,235,0.35)"
          }}
        >
          OCG
        </span>
      </div>

      {/* 2. Signature Blue-to-Green Accent Divider Rule */}
      <div 
        className={`w-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#06B6D4] to-[#10B981] ${dividerClasses[size]}`}
        style={{
          boxShadow: "0 0 12px rgba(6,182,212,0.4)"
        }}
      />

      {/* 3. Widely Tracked White THE OC GROUP Subtitle */}
      <div className="flex items-center justify-between w-full">
        <span className={`uppercase font-bold text-white leading-none ${subClasses[size]}`}>
          THE OC GROUP
        </span>
      </div>

      {/* 4. Optional Real Estate Descriptor */}
      {showDescriptor && (
        <span className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-blue-400 leading-tight">
          Real Estate Investment + Acquisition
        </span>
      )}
    </div>
  );
}
