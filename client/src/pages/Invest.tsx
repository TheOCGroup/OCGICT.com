import { useState } from "react";
import { ArrowRight, Bot, Building2, RefreshCw, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "wouter";

const STRATEGIES = [
  {
    id: "flip",
    name: "Fix + Flip",
    subtitle: "Acquire → Renovate → Sell → Build Capital",
    goal: "Create liquid capital and build execution experience through a defined renovation-and-resale cycle.",
    lifecycle: ["Acquire", "Renovate", "Sell", "Build Capital"],
    capital: "OCG generally explores lender capital for acquisition and renovation when the deal, borrower, and lender support it. Investor liquidity may be more valuable as reserves, contingency capacity, and project-completion strength.",
    financing: "Bridge, hard-money, private-lending, and equity requirements vary materially by lender and borrower. G can explain the framework; OCG verifies the actual structure before a transaction proceeds.",
  },
  {
    id: "brrrr",
    name: "BRRRR",
    subtitle: "Buy → Renovate → Rent → Refinance → Repeat",
    goal: "Create a stabilized rental asset and evaluate whether refinancing can recycle enough equity to support the next acquisition.",
    lifecycle: ["Buy", "Renovate", "Rent", "Refinance", "Repeat"],
    capital: "The refinance exit should be modeled before acquisition. OCG looks at total basis, likely stabilized value, rent, reserves, and financing constraints rather than assuming every renovation can recycle all initial capital.",
    financing: "DSCR and refinance terms depend on the lender, property, rent, borrower, seasoning, and market conditions. The website does not invent lender-specific requirements.",
  },
  {
    id: "hold",
    name: "Buy + Hold",
    subtitle: "Acquire → Improve → Operate → Build Equity",
    goal: "Own a property for durable cash-flow and equity creation without requiring the aggressive execution cycle of a flip.",
    lifecycle: ["Acquire", "Improve", "Operate", "Build Equity"],
    capital: "OCG weighs the amount of cash tied up in the property against reserves, financing flexibility, maintenance, vacancy, and future acquisition capacity.",
    financing: "Conventional, portfolio, private, and DSCR structures may all be relevant depending on the investor and asset. Actual lender requirements are verified at the time of underwriting.",
  },
  {
    id: "undecided",
    name: "Not Sure Yet",
    subtitle: "Start with your goal, not a label",
    goal: "Some investors need to build capital first. Others are ready to hold. The right first move depends on liquidity, experience, timeline, involvement, and risk tolerance.",
    lifecycle: ["Understand", "Compare", "Model", "Decide"],
    capital: "Do not assume the cash you have should all be deployed. OCG starts by understanding what the capital needs to accomplish and what must remain available after closing.",
    financing: "G can help surface the relevant questions, then OCG can evaluate real opportunities and financing options in a strategy conversation.",
  },
];

export default function Invest() {
  const [selected, setSelected] = useState("flip");
  const strategy = STRATEGIES.find((item) => item.id === selected) ?? STRATEGIES[0];

  return (
    <main className="min-h-screen bg-[#F7F7F4] text-[#0B0F17]">
      <section className="border-b border-slate-200 px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              <TrendingUp size={14} /> OCG Investor Strategy
            </div>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">The strategy should fit the investor—not the other way around.</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              OCG helps serious investors compare the trade-offs between creating liquid capital, building long-term cash flow, preserving reserves, financing renovation, and deciding how involved they actually want to be.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2" aria-label="Investment strategy selector">
            {STRATEGIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                className={`shrink-0 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${selected === item.id ? "bg-[#0B0F17] text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300"}`}
                aria-pressed={selected === item.id}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="bg-[#0B1220] p-8 text-white sm:p-10">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">Selected strategy</div>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">{strategy.name}</h2>
                <p className="mt-3 text-sm font-semibold text-slate-300">{strategy.subtitle}</p>
                <p className="mt-7 text-base leading-7 text-slate-300">{strategy.goal}</p>

                <div className="mt-8 flex flex-wrap gap-2">
                  {strategy.lifecycle.map((stage, index) => (
                    <div key={stage} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-slate-200">
                      <span className="text-blue-300">0{index + 1}</span>{stage}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 sm:p-10">
                <div className="grid gap-6 md:grid-cols-2">
                  <article className="rounded-[26px] border border-slate-200 bg-[#F7F7F4] p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><ShieldCheck size={19} /></div>
                    <h3 className="mt-5 text-lg font-black">How OCG thinks about capital</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{strategy.capital}</p>
                  </article>
                  <article className="rounded-[26px] border border-slate-200 bg-[#F7F7F4] p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800"><RefreshCw size={19} /></div>
                    <h3 className="mt-5 text-lg font-black">Financing considerations</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{strategy.financing}</p>
                  </article>
                </div>

                <div className="mt-7 rounded-[26px] border border-blue-100 bg-blue-50/60 p-6">
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} className="mt-0.5 shrink-0 text-blue-700" />
                    <div>
                      <h3 className="font-black">Use a real property, not a canned return assumption.</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">OCG evaluates the actual property, evidence, renovation scope, market, financing, and exit. Representative website examples are educational—they are not promised returns or lender terms.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Early-stage investors</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">You do not need to know that you want a portfolio yet.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">A first flip may be the right learning and capital-building move. A rental may be better. Or the answer may be to wait for a stronger opportunity. The objective is not to force a strategy; it is to make the next decision intelligently.</p>
            </div>
            <div className="rounded-[30px] bg-[#0B0F17] p-7 text-white">
              <Bot size={22} className="text-blue-300" />
              <h3 className="mt-5 text-2xl font-black tracking-tight">Not sure where you fit?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">Tell G what you are trying to accomplish. He can compare the strategies in plain language and help organize the questions for an OCG conversation.</p>
              <a href="/#g" className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-300">Ask G <ArrowRight size={14} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700"><Building2 size={14} /> OCG Strategy Session</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Ready to move from education to actual opportunities?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Bring your goals, experience, timeline, and capital context. OCG can discuss the strategies further before recommending any specific acquisition or financing structure.</p>
          </div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-blue-500">Book strategy session <ArrowRight size={14} /></Link>
        </div>
      </section>
    </main>
  );
}
