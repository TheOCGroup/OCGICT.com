import { Link, useLocation } from "wouter";
import { Menu, X, Bot, Calendar, ArrowRight } from "lucide-react";
import { useState } from "react";
import OCGWordmark from "./OCGWordmark";

const navLinks = [
  { label: "Invest", href: "/invest" },
  { label: "Sell", href: "/sell" },
  { label: "How OCG Works", href: "/how-ocg-works" },
  { label: "Strategies", href: "/strategies" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-[#070A0F]/85 backdrop-blur-xl transition-all">
      <div className="container flex h-20 items-center justify-between gap-6">
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-3.5 group" aria-label="OCG home">
          <OCGWordmark size="md" showDescriptor={true} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-bold uppercase tracking-[0.12em] transition-all relative py-1 ${
                  isActive ? "text-blue-400 font-extrabold" : "text-slate-300 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Primary Header CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="#g"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-blue-500/40 hover:bg-slate-900 hover:text-white transition-all"
          >
            <Bot size={15} className="text-blue-400" />
            Talk to G
          </a>
          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
          >
            <Calendar size={14} />
            Book Strategy Session
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#070A0F] shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="container py-6 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                  location === link.href
                    ? "bg-blue-600/15 text-blue-400"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 grid gap-2.5 border-t border-slate-800 pt-5">
              <a
                href="#g"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-bold uppercase tracking-wider text-slate-200"
              >
                <Bot size={15} className="text-blue-400" />
                Talk to G
              </a>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-950"
              >
                <Calendar size={14} />
                Book Strategy Session
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
