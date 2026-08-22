import React from 'react';
import { motion } from 'framer-motion';

const landmarks = [
  { name: 'Keeper of the Plains', detail: 'Arkansas River', icon: 'keeper' },
  { name: 'Exploration Place', detail: 'River District', icon: 'exploration' },
  { name: 'Historic Delano', detail: 'West Douglas', icon: 'delano' },
  { name: 'Union Station', detail: 'Downtown Wichita', icon: 'station' },
  { name: 'Century II', detail: 'Downtown Riverfront', icon: 'century' },
];

function LandmarkMark({ type }: { type: string }) {
  if (type === 'keeper') {
    return (
      <svg viewBox="0 0 120 90" className="h-16 w-24" aria-hidden="true">
        <path d="M60 78V35M47 34l13-20 13 20M51 25l9-12 9 12M43 39l17-8 17 8M36 80h48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M44 47c8-5 24-5 32 0" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
      </svg>
    );
  }
  if (type === 'exploration') {
    return (
      <svg viewBox="0 0 120 90" className="h-16 w-24" aria-hidden="true">
        <path d="M12 72h96M24 70c8-31 27-45 57-47-5 9-8 18-8 28 13 1 22 7 28 19H24Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M39 61c12-11 25-16 39-16" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
      </svg>
    );
  }
  if (type === 'delano') {
    return (
      <svg viewBox="0 0 120 90" className="h-16 w-24" aria-hidden="true">
        <path d="M48 76h24V29H48V76ZM43 29h34M52 23h16M60 14v9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="60" cy="43" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M60 43l4-3M35 76h50" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
      </svg>
    );
  }
  if (type === 'station') {
    return (
      <svg viewBox="0 0 120 90" className="h-16 w-24" aria-hidden="true">
        <path d="M19 74h82M28 74V39h64v35M39 39V27h42v12M34 50h12v14H34V50Zm20 0h12v14H54V50Zm20 0h12v14H74V50Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M22 39h76" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 90" className="h-16 w-24" aria-hidden="true">
      <path d="M20 73h80M28 73V42c7-14 18-21 32-21s25 7 32 21v31M39 73V46h42v27" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M34 39h52M45 28c5-4 10-6 15-6s10 2 15 6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
    </svg>
  );
}

export function WichitaLandmarkRibbon() {
  return (
    <section className="relative overflow-hidden border-y border-slate-800 bg-[#08101c] py-10">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_50%,rgba(59,130,246,.16),transparent_26%),radial-gradient(circle_at_80%_50%,rgba(245,158,11,.08),transparent_24%)]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-400">Built in Wichita. Built for Wichita.</div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Local intelligence should feel local.</h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">From the riverfront to Delano, downtown to established residential corridors, OCG evaluates property in the context of the city—not as a generic national data point.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {landmarks.map((landmark, index) => (
            <motion.div
              key={landmark.name}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-slate-500 transition-colors hover:border-blue-500/50 hover:text-blue-300"
            >
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <LandmarkMark type={landmark.icon} />
              <div className="mt-2 text-xs font-extrabold uppercase tracking-wider text-white">{landmark.name}</div>
              <div className="mt-1 text-[11px] text-slate-500">{landmark.detail}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default WichitaLandmarkRibbon;
