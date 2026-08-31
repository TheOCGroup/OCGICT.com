import { Link } from "wouter";
import OCGWordmark from "./OCGWordmark";
import { MapPin, Shield, Sparkles, Calendar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#05070B] py-16 text-slate-400 lg:py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <OCGWordmark size="md" showDescriptor={true} />
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              OCG is a Wichita real estate investment and acquisition company combining disciplined underwriting, renovation strategy, financing intelligence, and execution planning.
            </p>
            <div className="space-y-1 pt-2 font-mono text-[11px] text-slate-400">
              <div>Legal: Ocasio Collective, LLC d/b/a The OC Group</div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin size={12} className="text-blue-400" /> Wichita, Kansas & South-Central Kansas
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/invest" className="text-slate-400 transition-colors hover:text-white">Invest with OCG</Link></li>
              <li><Link href="/sell" className="text-slate-400 transition-colors hover:text-white">Sell a Property</Link></li>
              <li><Link href="/how-ocg-works" className="text-slate-400 transition-colors hover:text-white">How OCG Works</Link></li>
              <li><Link href="/strategies" className="text-slate-400 transition-colors hover:text-white">Investment Strategies</Link></li>
              <li><Link href="/about" className="text-slate-400 transition-colors hover:text-white">About & Founder Story</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">OCG Intelligence</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sparkles size={14} className="text-blue-400" /> G · Real Estate Intelligence
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Ask about a Wichita property, an investment strategy, the seller review process, or how OCG approaches a deal.
              </p>
              <a href="#g" className="mt-3 inline-flex text-[11px] font-bold uppercase tracking-wider text-blue-300 transition-colors hover:text-white">Talk to G</a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">Start Conversation</div>
            <p className="text-xs leading-relaxed text-slate-400">
              Schedule a one-on-one strategy session to discuss an investment opportunity, acquisition plan, or property disposition.
            </p>
            <div className="pt-2">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-blue-500/40 hover:bg-slate-800">
                <Calendar size={13} className="text-blue-400" /> Book Session
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-8 text-[11px] text-slate-400 md:flex-row">
          <div>© {new Date().getFullYear()} Ocasio Collective, LLC. All rights reserved. OCG is an operating real estate brand.</div>
          <span className="flex items-center gap-1 text-slate-400"><Shield size={12} className="text-blue-400" /> Private Investment & Acquisition Framework</span>
        </div>
      </div>
    </footer>
  );
}
