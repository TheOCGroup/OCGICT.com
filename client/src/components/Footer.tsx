import { Link } from "wouter";
import OCGWordmark from "./OCGWordmark";
import { Calendar, MapPin, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#05070B] py-16 text-slate-400 lg:py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <OCGWordmark size="md" showDescriptor={true} />
            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              OCG is a Wichita real estate investment and acquisition company combining disciplined strategy, property intelligence, renovation thinking, financing coordination, and human execution.
            </p>
            <div className="space-y-1 pt-2 font-mono text-[11px] text-slate-400">
              <div>Ocasio Collective, LLC d/b/a The OC Group</div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin size={12} className="text-blue-400" /> Wichita, Kansas & South-Central Kansas
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">OCG</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/invest" className="transition-colors hover:text-white">Invest with OCG</Link></li>
              <li><Link href="/sell" className="transition-colors hover:text-white">Sell a Property</Link></li>
              <li><Link href="/how-ocg-works" className="transition-colors hover:text-white">How OCG Works</Link></li>
              <li><Link href="/strategies" className="transition-colors hover:text-white">Investment Strategies</Link></li>
              <li><Link href="/about" className="transition-colors hover:text-white">About OCG</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">OCG Ecosystem</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/ocg-lab" className="text-slate-400 transition-colors hover:text-white">
                  OCG LAB · Technology
                </Link>
              </li>
              <li>
                <Link href="/lab-report" className="text-slate-400 transition-colors hover:text-white">
                  The Lab Report · AI Intelligence
                </Link>
              </li>
              <li className="pt-1 text-[11px] leading-relaxed text-slate-500">
                Technology is secondary to OCG's real-estate mission, but it is part of how we operate differently.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">Start a Conversation</div>
            <p className="text-xs leading-relaxed text-slate-400">
              Investor, seller, lender, capital partner, or simply not sure where to start—choose the conversation that fits you.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-blue-500/40 hover:bg-slate-800"
              >
                <Calendar size={13} className="text-blue-400" /> Start Here
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-8 text-[11px] text-slate-400 md:flex-row">
          <div>© {new Date().getFullYear()} Ocasio Collective, LLC. All rights reserved. OCG is an operating real-estate brand.</div>
          <div className="flex items-center gap-1 text-slate-400">
            <Shield size={12} className="text-blue-400" /> Preliminary information is subject to verification and professional review where appropriate.
          </div>
        </div>
      </div>
    </footer>
  );
}
