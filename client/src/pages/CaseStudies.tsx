/* ============================================================
   CASE STUDIES PAGE — Dark Luxury "Investment Grade" Design
   Detailed deal breakdowns with metrics, process, outcomes
   ============================================================ */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, TrendingUp, Building2, Handshake, CheckCircle, DollarSign, Clock, BarChart3 } from "lucide-react";

const INTERIOR_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663555856344/hx6jrLuwt69Vu5ochy8VJ2/oc-renovation-interior-mEnqEZDnoKecPWiKPZD3sM.webp";
const AERIAL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663555856344/hx6jrLuwt69Vu5ochy8VJ2/oc-wichita-aerial-oRDqFnoq8F3kZh7HDHrs3G.webp";
const MEETING_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663555856344/hx6jrLuwt69Vu5ochy8VJ2/oc-investor-meeting-7fSe58iL42ev5deHYUdvgA.webp";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663555856344/hx6jrLuwt69Vu5ochy8VJ2/oc-hero-bg-k67M8rLAeDHYt7GGwCTNsM.webp";

const caseStudies = [
  {
    id: "college-hill-flip",
    strategy: "Fix & Flip",
    strategyIcon: TrendingUp,
    title: "College Hill Craftsman",
    subtitle: "Full renovation, strong ARV, clean exit",
    location: "College Hill, Wichita, KS",
    img: INTERIOR_IMG,
    status: "Closed",
    timeline: "4.5 months",
    metrics: [
      { label: "Purchase Price", value: "$87,500" },
      { label: "Renovation Cost", value: "$44,200" },
      { label: "Holding Costs", value: "$6,800" },
      { label: "Selling Costs", value: "$9,900" },
      { label: "Total In", value: "$148,400" },
      { label: "Sale Price", value: "$171,000" },
      { label: "Net Profit", value: "$22,600" },
      { label: "ROI", value: "15.2%" },
    ],
    challenge: "The property had been vacant for 18 months and had significant deferred maintenance. The seller was motivated but the property needed a full cosmetic renovation plus HVAC replacement — a scope that scared off several other buyers.",
    approach: [
      "Negotiated purchase price based on accurate rehab scope, not guesswork",
      "Secured hard money financing at 70% ARV with Wildcat Lending",
      "Built a detailed renovation scope with contractor before closing",
      "Applied Modern Design Lab design direction to kitchen and baths",
      "Targeted finishes that matched neighborhood buyer expectations",
      "Listed within 3 days of renovation completion",
    ],
    outcome: "The property sold in 11 days at full asking price. The design decisions — particularly the kitchen renovation and exterior paint — were cited by the buyer's agent as key factors in the premium sale price. Net profit of $22,600 on a 4.5-month timeline.",
    keyLearning: "Accurate scoping before purchase is the single most important factor in fix & flip profitability. We identified the HVAC issue during due diligence — not after closing.",
  },
  {
    id: "riverside-brrrr",
    strategy: "BRRRR",
    strategyIcon: Building2,
    title: "Riverside BRRRR",
    subtitle: "Capital recycled, cash flow established",
    location: "Riverside, Wichita, KS",
    img: AERIAL_IMG,
    status: "Active (Rented)",
    timeline: "6 months to stabilization",
    metrics: [
      { label: "Purchase Price", value: "$68,000" },
      { label: "Renovation Cost", value: "$31,500" },
      { label: "Total Invested", value: "$99,500" },
      { label: "Post-Rehab ARV", value: "$138,000" },
      { label: "Cash-Out Refi", value: "$103,500 (75% LTV)" },
      { label: "Capital Recovered", value: "$99,500 (100%)" },
      { label: "Monthly Rent", value: "$1,250" },
      { label: "Monthly Cash Flow", value: "$280+" },
    ],
    challenge: "The investor had capital to deploy but wanted to build a long-term portfolio without tying up equity indefinitely. The challenge was finding a property where the BRRRR cycle would fully recover the invested capital — not just partially.",
    approach: [
      "Identified property with strong rental demand in Riverside corridor",
      "Scoped renovation for rental durability, not luxury finishes",
      "Targeted post-rehab ARV that supported full capital recovery at 75% LTV",
      "Coordinated DSCR lender connection through Easy Street Capital",
      "Placed qualified tenant within 2 weeks of renovation completion",
      "Refinance completed at $138,000 appraised value",
    ],
    outcome: "100% of invested capital was recovered through the cash-out refinance. The investor now holds a cash-flowing rental property with zero equity tied up — free to deploy capital into the next acquisition. Monthly cash flow of $280+ after PITIA.",
    keyLearning: "The BRRRR method only works when the numbers are structured correctly from the start. We modeled the refinance scenario before purchase — not after renovation.",
  },
  {
    id: "midtown-creative",
    strategy: "Creative Financing",
    strategyIcon: Handshake,
    title: "Midtown Seller Carry",
    subtitle: "Creative structure, win-win outcome",
    location: "Midtown, Wichita, KS",
    img: MEETING_IMG,
    status: "Closed",
    timeline: "3 weeks to close",
    metrics: [
      { label: "Purchase Price", value: "$58,000" },
      { label: "Seller Carry Rate", value: "6.5%" },
      { label: "Down Payment", value: "$8,000" },
      { label: "Monthly Payment", value: "$450" },
      { label: "Renovation Cost", value: "$26,000" },
      { label: "Post-Rehab ARV", value: "$112,000" },
      { label: "Equity at Completion", value: "$54,000+" },
      { label: "Time to Close", value: "21 days" },
    ],
    challenge: "The seller needed to exit the property but didn't need a lump sum — they wanted monthly income. The buyer didn't qualify for conventional financing. A traditional transaction wasn't possible for either party.",
    approach: [
      "Identified seller's actual need: monthly income, not a lump sum",
      "Structured a seller carry note at 6.5% with 5-year balloon",
      "Negotiated purchase price that reflected the seller's financing contribution",
      "Minimal down payment preserved buyer's capital for renovation",
      "Renovation scope focused on maximum ARV for eventual refinance exit",
    ],
    outcome: "The deal closed in 21 days — no bank required. The seller receives $450/month in passive income. The buyer acquired a property below market with minimal capital outlay. Renovation is underway targeting a $112,000 ARV and a conventional refinance exit.",
    keyLearning: "Creative financing isn't about finding loopholes — it's about understanding what each party actually needs and building a structure that serves both. The seller didn't need cash; they needed income.",
  },
];

const schemaFields = [
  { field: "Deal ID", type: "string", desc: "Unique identifier for the case study" },
  { field: "Strategy", type: "enum", desc: "Fix & Flip | BRRRR | Creative | Rental | RTO" },
  { field: "Location", type: "string", desc: "Neighborhood and city" },
  { field: "Status", type: "enum", desc: "Closed | Active | Under Contract" },
  { field: "Timeline", type: "string", desc: "Duration from acquisition to exit/stabilization" },
  { field: "Purchase Price", type: "currency", desc: "Acquisition cost" },
  { field: "Renovation Cost", type: "currency", desc: "Total rehab spend" },
  { field: "ARV", type: "currency", desc: "After Repair Value (appraised or sold)" },
  { field: "Net Profit / Cash Flow", type: "currency", desc: "Return metric by strategy" },
  { field: "ROI", type: "percentage", desc: "Return on invested capital" },
  { field: "Key Learning", type: "text", desc: "Primary takeaway from the deal" },
];

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Investment property" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/50 via-[#0d0d0d]/80 to-[#0d0d0d]" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <span className="section-eyebrow">Proof of Process</span>
            <h1
              className="text-5xl md:text-6xl font-bold text-white leading-tight mt-3 mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Case Studies
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
              Real deals, real numbers, real outcomes. These case studies walk through the challenge, the approach, and the result — so you can see exactly how we work.
            </p>
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      <section className="py-16 bg-[#0d0d0d]">
        <div className="container">
          <div className="flex flex-col gap-10">
            {caseStudies.map((cs, i) => (
              <div key={cs.id} className="card-luxury overflow-hidden">
                {/* Header */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
                  {/* Image */}
                  <div className={`relative h-72 lg:h-auto overflow-hidden ${i % 2 === 1 ? "lg:col-start-2" : ""}`}>
                    <img src={cs.img} alt={cs.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />
                    <div className="absolute top-5 left-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-sm bg-[#3B3BFF]/20 flex items-center justify-center">
                          <cs.strategyIcon size={16} className="text-[#3B3BFF]" />
                        </div>
                        <span className="tag-pill bg-[#3B3BFF] text-white text-[10px]">{cs.strategy}</span>
                        <span className="tag-pill bg-[#0d0d0d]/70 text-white/60 border border-white/10 text-[10px]">{cs.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="p-8">
                    <div className="text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-2">{cs.location}</div>
                    <h2
                      className="text-white font-bold text-3xl mb-1"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {cs.title}
                    </h2>
                    <p className="text-white/45 text-sm mb-6">{cs.subtitle}</p>

                    <div className="flex items-center gap-2 mb-5">
                      <Clock size={13} className="text-[#3B3BFF]" />
                      <span className="text-white/50 text-xs">Timeline: <span className="text-white/70">{cs.timeline}</span></span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {cs.metrics.map((m) => (
                        <div key={m.label} className="bg-white/3 rounded-sm p-3">
                          <div className="text-white/30 text-[9px] tracking-widest uppercase mb-0.5">{m.label}</div>
                          <div
                            className={`font-semibold text-sm ${
                              m.label === "Net Profit" || m.label === "ROI" || m.label === "Monthly Cash Flow" || m.label === "Capital Recovered"
                                ? "text-[#3B3BFF]"
                                : "text-white/80"
                            }`}
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem" }}
                          >
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detail */}
                <div className="border-t border-white/6 p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-sm bg-red-500/10 flex items-center justify-center">
                        <span className="text-red-400 text-xs font-bold">!</span>
                      </div>
                      <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">The Challenge</span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed">{cs.challenge}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-sm bg-[#3B3BFF]/10 flex items-center justify-center">
                        <BarChart3 size={12} className="text-[#3B3BFF]" />
                      </div>
                      <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Our Approach</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {cs.approach.map((a) => (
                        <div key={a} className="flex items-start gap-2">
                          <CheckCircle size={11} className="text-[#3B3BFF] flex-shrink-0 mt-0.5" />
                          <span className="text-white/50 text-xs leading-relaxed">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-sm bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">The Outcome</span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">{cs.outcome}</p>
                    <div className="bg-[#3B3BFF]/8 border border-[#3B3BFF]/15 rounded-sm p-4">
                      <div className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-1.5">Key Learning</div>
                      <p className="text-white/55 text-xs leading-relaxed italic">{cs.keyLearning}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MORE COMING ── */}
      <section className="py-16 bg-[#111111]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span className="section-eyebrow">More Coming</span>
            <h2 className="section-title text-3xl md:text-4xl mt-3 mb-4">
              New Case Studies Added Regularly
            </h2>
            <p className="section-subtitle mb-8">
              As we close deals and stabilize properties, we publish detailed case studies with real numbers. Join our buyer list to be notified when new case studies are published.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-gold">
                Join the Buyer List <ArrowRight size={16} />
              </Link>
              <Link href="/marketplace" className="btn-ghost-gold">
                View Current Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
