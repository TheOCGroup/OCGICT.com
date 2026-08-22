import { Link, useLocation } from "wouter";
import { Menu, X, Bot, Calendar } from "lucide-react";
import { useState } from "react";
import OCGWordmark from "./OCGWordmark";

const navLinks = [
  { label: "Invest", href: "/invest" },
  { label: "Sell Your Property", href: "/sell" },
  { label: "How OCG Works", href: "/how-ocg-works" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openG = () => window.dispatchEvent(new Event("ocg:open-g"));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#060b13]/84 backdrop-blur-2xl transition-all">
      <div className="container flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3.5 group" aria-label="OCG home"><OCGWordmark size="md" showDescriptor={true} /></Link>

        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href} className={`relative py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${isActive ? "text-amber-300" : "text-slate-300 hover:text-white"}`}>
                {link.label}
                {isActive && <span className="absolute -bottom-2 left-0 right-0 h-px bg-amber-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button onClick={openG} className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/8 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-200 transition-all hover:border-amber-300/50 hover:bg-amber-400/12">
            <Bot size={15} /> Talk to G
          </button>
          <Link href="/contact" className="flex items-center gap-2 rounded-xl border border-amber-300/35 bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-950/30 transition-all hover:-translate-y-0.5">
            <Calendar size={14} /> Contact Us
          </Link>
        </div>

        <button className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#060b13]/98 shadow-2xl backdrop-blur-2xl">
          <div className="container py-6 flex flex-col gap-2">
            {navLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`px-3 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${location === link.href ? "bg-amber-400/10 text-amber-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>{link.label}</Link>)}
            <div className="mt-4 grid gap-2.5 border-t border-white/10 pt-5">
              <button onClick={() => { setMobileOpen(false); openG(); }} className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/8 py-3 text-xs font-bold uppercase tracking-wider text-amber-200"><Bot size={15} /> Talk to G</button>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950"><Calendar size={14} /> Contact Us</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
