import { Link } from "wouter";
import OCGWordmark from "./OCGWordmark";
import { ArrowUpRight, MapPin, Shield, Bot, Calendar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#05070B] text-slate-400 py-16 lg:py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand & Corporate Structure Column */}
          <div className="space-y-4">
            <OCGWordmark size="md" showDescriptor={true} />
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              OCG is a real estate investment and acquisition company combining investment strategy, renovation architecture, financing intelligence, and automated operational systems.
            </p>
            <div className="text-[11px] text-slate-400 font-mono pt-2 space-y-1">
              <div>Legal: Ocasio Collective, LLC d/b/a The OC Group</div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin size={12} className="text-blue-400" /> Wichita, Kansas & South-Central Kansas
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/invest" className="text-slate-400 hover:text-white transition-colors">
                  Invest with OCG
                </Link>
              </li>
              <li>
                <Link href="/sell" className="text-slate-400 hover:text-white transition-colors">
                  Sell a Property (Review)
                </Link>
              </li>
              <li>
                <Link href="/how-ocg-works" className="text-slate-400 hover:text-white transition-colors">
                  How OCG Works
                </Link>
              </li>
              <li>
                <Link href="/strategies" className="text-slate-400 hover:text-white transition-colors">
                  Investment Strategies
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  About & Founder Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Systems & Intelligence */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Technology Core
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="font-semibold text-slate-300">G:</span> Investment Intelligence
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="font-semibold text-slate-300">HUNTER:</span> Deal Finder
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="font-semibold text-slate-300">VICTOR:</span> Underwriting & Scoping
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="font-semibold text-slate-300">PIPER:</span> Pipeline Engine
              </li>
            </ul>
          </div>

          {/* Connect & Strategy Call */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Start Conversation
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Schedule a one-on-one strategy session to explore capital deployment or property disposition.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:border-blue-500/40 hover:bg-slate-800 transition-all"
              >
                <Calendar size={13} className="text-blue-400" /> Book Session
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimers & Copyright */}
        <div className="mt-14 border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Ocasio Collective, LLC. All rights reserved. OCG is an operating real estate brand.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield size={12} className="text-blue-400" /> Private Investment & Acquisition Framework
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
