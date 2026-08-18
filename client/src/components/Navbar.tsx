import { Link, useLocation } from "wouter";
import { Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090b0f]/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-3" aria-label="OCG home">
          <span className="ocg-wordmark text-[2rem] font-black tracking-[-0.09em] leading-none">OCG</span>
          <span className="hidden sm:block text-[9px] uppercase tracking-[0.22em] text-white/45 leading-tight">
            Real Estate Investment<br />+ Acquisition
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-7" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                location === link.href ? "text-white" : "text-white/55 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-3">
          <a href="#g" className="btn-ghost-gold text-xs py-2 px-4">
            <MessageCircle size={14} /> Talk to G
          </a>
          <Link href="/contact" className="btn-gold text-xs py-2 px-4">Book Strategy Session</Link>
        </div>

        <button
          className="xl:hidden text-white/80 hover:text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="xl:hidden border-t border-white/8 bg-[#090b0f]">
          <div className="container py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-2 py-3 text-sm text-white/70 hover:text-white">
                {link.label}
              </Link>
            ))}
            <div className="mt-5 grid gap-3 border-t border-white/10 pt-5">
              <a href="#g" className="btn-ghost-gold justify-center"><MessageCircle size={14} /> Talk to G</a>
              <Link href="/contact" className="btn-gold justify-center">Book Strategy Session</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
