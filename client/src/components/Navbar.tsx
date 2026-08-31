import { Link, useLocation } from "wouter";
import { Menu, X, Bot, Calendar } from "lucide-react";
import { useState } from "react";
import OCGWordmark from "./OCGWordmark";

const navLinks = [
  { label: "Invest", href: "/invest" },
  { label: "Sell", href: "/sell" },
  { label: "How OCG Works", href: "/how-ocg-works" },
  { label: "Strategies", href: "/services" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openG = () => window.dispatchEvent(new Event("ocg:open-g"));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#060b13]/88 shadow-[0_12px_40px_rgba(0,0,0,.16)] backdrop-blur-2xl">
      <div className="container flex h-[76px] items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3.5" aria-label="OCG home">
          <OCGWordmark size="md" showDescriptor={true} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                  isActive ? "text-blue-200" : "text-slate-300 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            onClick={openG}
            className="flex items-center gap-2 rounded-xl border border-blue-300/20 bg-blue-400/[0.06] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-blue-100 transition-all hover:-translate-y-0.5 hover:border-blue-300/40 hover:bg-blue-400/[0.1]"
          >
            <Bot size={15} /> Talk to G
          </button>
          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
          >
            <Calendar size={14} /> Strategy Session
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:text-white lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#060b13]/98 shadow-2xl backdrop-blur-2xl lg:hidden">
          <div className="container flex flex-col gap-1.5 py-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                  location === link.href ? "bg-blue-400/[0.08] text-blue-200" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2.5 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openG();
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 bg-blue-400/[0.06] py-3 text-xs font-bold uppercase tracking-wider text-blue-100"
              >
                <Bot size={15} /> Talk to G
              </button>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-black uppercase tracking-wider text-slate-950"
              >
                <Calendar size={14} /> Strategy Session
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
