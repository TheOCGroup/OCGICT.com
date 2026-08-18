/* ============================================================
   LENDER NETWORK PAGE — Dark Luxury "Investment Grade" Design
   Vetted lender cards: Lending ICT, Wildcat, EquityMax, Easy Street, LendingOne
   Lender partner application form
   ============================================================ */
import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, ExternalLink, CheckCircle, X, Send, Shield, DollarSign, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

const lenders = [
  {
    id: "lending-ict",
    name: "Lending ICT",
    type: "Local Private Lender",
    typeTag: "Private",
    bestFor: ["Fix & Flip", "BRRRR", "Bridge Loans"],
    desc: "Wichita-based private lender with deep knowledge of local market conditions. Lending ICT understands the Wichita investment landscape and can move quickly on well-structured deals. Their local presence means faster decisions and more flexible terms for the right opportunities.",
    highlights: [
      "Local Wichita market expertise",
      "Fast close timelines",
      "Relationship-based lending",
      "Flexible terms for strong deals",
    ],
    rates: "Competitive private rates",
    ltv: "Up to 70% ARV",
    minLoan: "$40,000",
    maxLoan: "$500,000",
    featured: true,
  },
  {
    id: "wildcat-lending",
    name: "Wildcat Lending",
    type: "Hard Money Lender",
    typeTag: "Hard Money",
    bestFor: ["Fix & Flip", "Short-Term Bridge"],
    desc: "Kansas-focused hard money lender with competitive rates and a streamlined approval process for experienced investors. Wildcat Lending specializes in residential investment properties and understands the fix & flip model.",
    highlights: [
      "Kansas market focus",
      "Streamlined approval process",
      "Experienced investor programs",
      "Competitive hard money rates",
    ],
    rates: "10–12% typical",
    ltv: "Up to 70% ARV",
    minLoan: "$50,000",
    maxLoan: "$750,000",
    featured: false,
  },
  {
    id: "equitymax",
    name: "EquityMax",
    type: "Hard Money Lender",
    typeTag: "Hard Money",
    bestFor: ["Rehab Loans", "Fix & Flip", "No Income Verification"],
    desc: "National hard money lender specializing in residential rehab loans. EquityMax is known for no income verification requirements, making them accessible for investors who don't qualify for conventional financing. Strong track record in the Midwest market.",
    highlights: [
      "No income verification required",
      "National lending footprint",
      "Residential rehab specialist",
      "Midwest market experience",
    ],
    rates: "11–13% typical",
    ltv: "Up to 65% ARV",
    minLoan: "$30,000",
    maxLoan: "$1,000,000",
    featured: false,
  },
  {
    id: "easy-street",
    name: "Easy Street Capital",
    type: "Hard Money + DSCR",
    typeTag: "Hard Money / DSCR",
    bestFor: ["BRRRR", "Rental", "Fix & Flip", "Portfolio Loans"],
    desc: "Flexible hard money and DSCR products designed for investors scaling their portfolios. Easy Street Capital bridges the gap between acquisition financing and long-term hold financing — ideal for BRRRR investors who need both products from a single relationship.",
    highlights: [
      "Hard money + DSCR under one roof",
      "BRRRR-optimized product suite",
      "Portfolio loan options",
      "Investor-friendly underwriting",
    ],
    rates: "Varies by product",
    ltv: "Up to 75% ARV (Hard Money) / 80% LTV (DSCR)",
    minLoan: "$75,000",
    maxLoan: "$2,000,000",
    featured: true,
  },
  {
    id: "lendingone",
    name: "LendingOne",
    type: "Institutional Bridge + DSCR",
    typeTag: "Bridge / DSCR",
    bestFor: ["Fix & Flip", "BRRRR", "Rental Portfolio", "New Construction"],
    desc: "One of the largest non-bank lenders for residential investment properties. LendingOne offers institutional-grade bridge loans and DSCR products with competitive rates, fast closings, and a technology-driven process that makes scaling a portfolio more efficient.",
    highlights: [
      "Institutional-grade products",
      "Technology-driven process",
      "Fast close capability",
      "Competitive rates at scale",
    ],
    rates: "Competitive institutional rates",
    ltv: "Up to 75% ARV (Bridge) / 80% LTV (DSCR)",
    minLoan: "$100,000",
    maxLoan: "$5,000,000",
    featured: false,
  },
];

const typeColors: Record<string, string> = {
  "Private": "bg-[#3B3BFF]/15 text-[#3B3BFF] border-[#3B3BFF]/25",
  "Hard Money": "bg-blue-500/10 text-blue-300 border-blue-500/20",
  "Hard Money / DSCR": "bg-purple-500/10 text-purple-300 border-purple-500/20",
  "Bridge / DSCR": "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};

const lenderBenefits = [
  { icon: Shield, title: "Pre-Vetted Partners", desc: "Every lender in our network has been evaluated for reliability, speed, and fair dealing." },
  { icon: DollarSign, title: "Structured Deals", desc: "We present deals that are already analyzed and structured — making lender review faster and more efficient." },
  { icon: Clock, title: "Fast Close Support", desc: "We prepare complete deal packages that support lenders' underwriting and enable faster closings." },
  { icon: Zap, title: "Warm Introductions", desc: "No cold outreach. We make warm introductions that come with context, deal analysis, and credibility." },
];

export default function LenderNetwork() {
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Lender partner application submitted! We'll be in touch within 48 hours.");
    setShowPartnerForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section className="pt-32 pb-16 bg-[#111111]">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="section-eyebrow">Capital Partners</span>
              <h1
                className="text-4xl md:text-5xl font-bold text-white leading-tight mt-3 mb-4"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Our Vetted Lender Network
              </h1>
              <p className="text-white/55 text-base leading-relaxed">
                Access to the right capital is as important as finding the right deal. Our lender network includes vetted private lenders, hard money lenders, and DSCR lenders who understand investment deal structures and can move quickly.
              </p>
            </div>
            <button
              onClick={() => setShowPartnerForm(true)}
              className="btn-ghost-gold flex-shrink-0"
            >
              Become a Lending Partner
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW WE WORK WITH LENDERS ── */}
      <section className="py-16 bg-[#0d0d0d]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {lenderBenefits.map((b) => (
              <div key={b.title} className="card-luxury p-6 text-center">
                <div className="w-10 h-10 rounded-sm bg-[#3B3BFF]/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon size={18} className="text-[#3B3BFF]" />
                </div>
                <h4 className="text-white font-semibold text-base mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {b.title}
                </h4>
                <p className="text-white/45 text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Lender Cards */}
          <div className="flex flex-col gap-5">
            {lenders.map((lender) => (
              <div
                key={lender.id}
                className={`card-luxury p-8 relative overflow-hidden ${lender.featured ? "border-[#3B3BFF]/25" : ""}`}
              >
                {lender.featured && (
                  <div className="absolute top-0 right-0 bg-[#3B3BFF] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-bl-sm">
                    Featured Partner
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Identity */}
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-white/60 font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                          {lender.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                          {lender.name}
                        </h3>
                        <span className={`tag-pill border text-[10px] mt-1.5 ${typeColors[lender.typeTag] || "bg-white/10 text-white/50 border-white/10"}`}>
                          {lender.typeTag}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed mb-5">{lender.desc}</p>
                    <div>
                      <div className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-2">Best For</div>
                      <div className="flex flex-wrap gap-1.5">
                        {lender.bestFor.map((use) => (
                          <span key={use} className="bg-white/5 text-white/50 text-xs px-2.5 py-1 rounded-sm">
                            {use}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Highlights */}
                  <div>
                    <div className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-4">Key Highlights</div>
                    <div className="flex flex-col gap-2.5">
                      {lender.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-2.5">
                          <CheckCircle size={13} className="text-[#3B3BFF] flex-shrink-0" />
                          <span className="text-white/60 text-sm">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Terms + CTA */}
                  <div>
                    <div className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-4">Typical Terms</div>
                    <div className="flex flex-col gap-3 mb-6">
                      {[
                        { label: "Rates", value: lender.rates },
                        { label: "Max LTV", value: lender.ltv },
                        { label: "Min Loan", value: lender.minLoan },
                        { label: "Max Loan", value: lender.maxLoan },
                      ].map((term) => (
                        <div key={term.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-white/35 text-xs">{term.label}</span>
                          <span className="text-white/70 text-xs font-medium">{term.value}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/contact" className="btn-gold text-xs py-2.5 w-full justify-center">
                      Get Introduction <ArrowRight size={14} />
                    </Link>
                    <p className="text-white/25 text-[10px] text-center mt-3 leading-relaxed">
                      We'll make a warm introduction with your deal package.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LENDER DISCLAIMER ── */}
      <section className="py-10 bg-[#111111]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-white/25 text-xs leading-relaxed">
              <strong className="text-white/40">Disclaimer:</strong> The OC Group provides introductions to lending partners as a service to our clients. We do not act as a mortgage broker or lender. All lending terms, rates, and conditions are set by the individual lenders and are subject to change. Lending terms listed above are estimates only. All real estate investments involve risk. Please conduct your own due diligence before entering any financial arrangement.
            </p>
          </div>
        </div>
      </section>

      {/* ── BECOME A LENDER PARTNER CTA ── */}
      <section className="py-20 bg-[#0d0d0d]">
        <div className="container">
          <div className="card-luxury p-10 md:p-14 text-center max-w-3xl mx-auto">
            <span className="section-eyebrow">For Lenders</span>
            <h2 className="section-title text-3xl md:text-4xl mt-3 mb-5">
              Interested in Joining Our Network?
            </h2>
            <p className="section-subtitle max-w-xl mx-auto mb-8">
              We work with lenders who want access to pre-analyzed, well-structured deals in the Wichita market. If you're a private lender, hard money lender, or DSCR lender looking for quality deal flow, let's talk.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => setShowPartnerForm(true)} className="btn-gold">
                Apply as a Lending Partner <ArrowRight size={16} />
              </button>
              <Link href="/contact" className="btn-ghost-gold">
                Schedule a Call
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── LENDER PARTNER FORM MODAL ── */}
      {showPartnerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-sm w-full max-w-lg p-8 relative my-8">
            <button
              onClick={() => setShowPartnerForm(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6">
              <div className="text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-1">Lender Partner Application</div>
              <h3 className="text-white font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Join Our Lending Network
              </h3>
              <p className="text-white/40 text-sm mt-1">Tell us about your lending program and we'll evaluate the fit.</p>
            </div>
            <form onSubmit={handlePartnerSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Name *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Company *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="Lending Co." />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Email *</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="lender@company.com" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Phone *</label>
                <input required type="tel" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="720.620.9929" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Lender Type *</label>
                <select required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B3BFF]/50 transition-colors">
                  <option value="">Select type</option>
                  <option value="private">Private Lender</option>
                  <option value="hard-money">Hard Money Lender</option>
                  <option value="dscr">DSCR Lender</option>
                  <option value="bridge">Bridge Lender</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Min Loan Amount</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="$50,000" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Max Loan Amount</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="$1,000,000" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Lending Programs / Notes</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors resize-none" placeholder="Describe your lending programs, geographic focus, and any other relevant details..." />
              </div>
              <button type="submit" className="btn-gold justify-center mt-2">
                Submit Application <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
