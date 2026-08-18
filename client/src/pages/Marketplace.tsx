/* ============================================================
   INVESTOR MARKETPLACE PAGE — Dark Luxury "Investment Grade" Design
   Fetches live listings from Supabase marketplace_listings table
   Admin-managed via /admin panel
   ============================================================ */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase, MarketplaceListing } from "@/lib/supabase";
import { ArrowRight, SlidersHorizontal, X, ChevronRight, MapPin, Bed, Bath, Square, Tag, FileText, Send, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const INTERIOR_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663555856344/hx6jrLuwt69Vu5ochy8VJ2/oc-renovation-interior-mEnqEZDnoKecPWiKPZD3sM.webp";

const strategyColors: Record<string, string> = {
  "Fix & Flip": "bg-orange-500/20 text-orange-300",
  "BRRRR": "bg-[#3B3BFF]/20 text-blue-300",
  "Buy & Hold": "bg-green-500/20 text-green-300",
  "Creative Finance": "bg-purple-500/20 text-purple-300",
  "Wholesale": "bg-yellow-500/20 text-yellow-300",
};

const statusColors: Record<string, string> = {
  "Available": "bg-[#3B3BFF] text-white",
  "Under Review": "bg-white/15 text-white/70",
  "Under Contract": "bg-yellow-500/20 text-yellow-300",
  "Sold": "bg-white/10 text-white/40",
  "Coming Soon": "bg-blue-500/20 text-blue-300",
};

function fmt(n: number | null) {
  if (n == null) return "—";
  return "$" + n.toLocaleString();
}

const STRATEGIES = ["All", "Fix & Flip", "BRRRR", "Buy & Hold", "Creative Finance", "Wholesale"];

export default function Marketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState("All");
  const [maxPrice, setMaxPrice] = useState(300000);
  const [minArv, setMinArv] = useState(0);
  const [maxRehab, setMaxRehab] = useState(100000);
  const [showFilters, setShowFilters] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [inquiryListing, setInquiryListing] = useState<MarketplaceListing | null>(null);

  useEffect(() => {
    supabase.getListings(true)
      .then(setListings)
      .catch(() => toast.error("Failed to load listings."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((d) => {
    if (strategy !== "All" && d.strategy !== strategy) return false;
    if (d.price > maxPrice) return false;
    if ((d.arv ?? 0) < minArv) return false;
    if ((d.rehab_estimate ?? 0) > maxRehab) return false;
    return true;
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Inquiry submitted! We'll be in touch within 24 hours.");
    setInquiryListing(null);
  };

  const handleDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Deal submitted for review! We'll evaluate and respond within 48 hours.");
    setShowSubmitForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section className="pt-32 pb-12 bg-[#111111]">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="section-eyebrow">Curated Deal Flow</span>
              <h1
                className="text-4xl md:text-5xl font-bold text-white leading-tight mt-3"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Investor Marketplace
              </h1>
              <p className="text-white/55 text-base mt-3 max-w-xl">
                Every deal on this marketplace has been reviewed and approved by The OC Group. No noise — only curated investment opportunities in the Wichita market.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button onClick={() => setShowSubmitForm(true)} className="btn-ghost-gold">
                Submit a Deal
              </button>
              <Link href="/contact" className="btn-gold">
                Join Buyer List <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS BANNER ── */}
      <section className="bg-[#3B3BFF]/10 border-y border-[#3B3BFF]/20 py-4">
        <div className="container">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="text-[#3B3BFF] font-semibold text-xs tracking-widest uppercase">How This Works:</span>
            {[
              "Admin-curated deals only",
              "Wholesalers submit → Admin approves → Published",
              "Request full deal package on any listing",
              "Join buyer list for first access",
            ].map((item) => (
              <span key={item} className="text-white/50 text-xs flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#3B3BFF]/50" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTERS + LISTINGS ── */}
      <section className="py-12 bg-[#0d0d0d]">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar Filters — only shown when there are listings */}
            {!loading && listings.length > 0 && (
            <div className={`lg:w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
              <div className="card-luxury p-6 sticky top-28">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Filter Deals
                  </h3>
                  <button
                    onClick={() => { setStrategy("All"); setMaxPrice(300000); setMinArv(0); setMaxRehab(100000); }}
                    className="text-white/30 hover:text-white/60 text-xs transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Strategy */}
                <div className="mb-6">
                  <label className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-3 block">
                    Strategy
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {STRATEGIES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={`text-left px-3 py-2 rounded-sm text-xs transition-colors ${
                          strategy === s
                            ? "bg-[#3B3BFF]/20 text-[#3B3BFF] border border-[#3B3BFF]/30"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Price */}
                <div className="mb-6">
                  <label className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-3 block">
                    Max Ask Price
                  </label>
                  <div className="text-white font-semibold text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {fmt(maxPrice)}
                  </div>
                  <input type="range" min={40000} max={300000} step={5000} value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#3B3BFF]" />
                  <div className="flex justify-between text-white/25 text-[10px] mt-1">
                    <span>$40K</span><span>$300K</span>
                  </div>
                </div>

                {/* Min ARV */}
                <div className="mb-6">
                  <label className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-3 block">
                    Min Est. ARV
                  </label>
                  <div className="text-white font-semibold text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {fmt(minArv)}
                  </div>
                  <input type="range" min={0} max={300000} step={5000} value={minArv}
                    onChange={(e) => setMinArv(Number(e.target.value))} className="w-full accent-[#3B3BFF]" />
                  <div className="flex justify-between text-white/25 text-[10px] mt-1">
                    <span>$0</span><span>$300K</span>
                  </div>
                </div>

                {/* Max Rehab */}
                <div className="mb-6">
                  <label className="text-[#3B3BFF] text-[10px] font-semibold tracking-widest uppercase mb-3 block">
                    Max Est. Rehab
                  </label>
                  <div className="text-white font-semibold text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {fmt(maxRehab)}
                  </div>
                  <input type="range" min={0} max={100000} step={2500} value={maxRehab}
                    onChange={(e) => setMaxRehab(Number(e.target.value))} className="w-full accent-[#3B3BFF]" />
                  <div className="flex justify-between text-white/25 text-[10px] mt-1">
                    <span>$0</span><span>$100K</span>
                  </div>
                </div>

                <div className="section-divider" />
                <p className="text-white/30 text-xs mt-4 leading-relaxed">
                  All deals are admin-approved before publishing. Numbers are estimates — request the full deal package for verified analysis.
                </p>
              </div>
            </div>
            )}

            {/* Listings */}
            <div className="flex-1">
              {/* Mobile filter toggle */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <span className="text-white/50 text-sm">{filtered.length} deals found</span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-ghost-gold text-xs py-2 flex items-center gap-2"
                >
                  <SlidersHorizontal size={14} />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              <div className="hidden lg:flex items-center justify-between mb-6">
                <span className="text-white/50 text-sm">
                  {loading ? "Loading deals..." : `${filtered.length} deal${filtered.length !== 1 ? "s" : ""} found`}
                </span>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="flex items-center justify-center py-24 card-luxury">
                  <RefreshCw size={20} className="animate-spin text-[#3B3BFF]" />
                  <span className="text-white/40 text-sm ml-3">Loading deals...</span>
                </div>
              ) : listings.length === 0 ? (
                /* ── EMPTY STATE: No listings in database ── */
                <div className="flex flex-col gap-8">
                  {/* Main empty state card */}
                  <div className="card-luxury overflow-hidden">
                    <div className="bg-gradient-to-br from-[#3B3BFF]/8 to-transparent p-12 md:p-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#3B3BFF]/10 border border-[#3B3BFF]/20 flex items-center justify-center mx-auto mb-6">
                        <TrendingUp size={28} className="text-[#3B3BFF]" />
                      </div>
                      <div className="text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-3">Deal Flow Coming Soon</div>
                      <h2
                        className="text-white font-bold text-3xl md:text-4xl mb-4 leading-tight"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        New Deals Are Being Sourced
                      </h2>
                      <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed mb-8">
                        We are actively sourcing and vetting investment opportunities in the Wichita market. Every deal is reviewed before it hits this page — no noise, only numbers that make sense.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/contact" className="btn-gold">
                          Join the Buyer List <ArrowRight size={16} />
                        </Link>
                        <Link href="/submit-deal" className="btn-ghost-gold">
                          Submit a Deal <Send size={15} />
                        </Link>
                      </div>
                    </div>
                    <div className="border-t border-white/6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/6">
                      {[
                        { label: "Be First to Know", desc: "Join our buyer list and get notified the moment a new deal is posted — before it goes public." },
                        { label: "Submit Your Deals", desc: "Wholesalers and deal finders — submit your off-market deals for review. We move fast on the right numbers." },
                        { label: "Book a Strategy Call", desc: "Not sure what to look for? Book a free 30-minute call and we'll walk you through our current deal criteria." },
                      ].map((item) => (
                        <div key={item.label} className="p-8 text-center">
                          <div className="text-white font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{item.label}</div>
                          <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="card-luxury p-16 text-center">
                  <TrendingUp size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm mb-6">No deals match your current filters.</p>
                  <button
                    onClick={() => { setStrategy("All"); setMaxPrice(300000); setMinArv(0); setMaxRehab(100000); }}
                    className="btn-ghost-gold text-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((listing) => (
                    <div key={listing.id} className="card-luxury overflow-hidden group flex flex-col">
                      {/* Image */}
                      <div className="relative h-44 overflow-hidden flex-shrink-0">
                        <img
                          src={listing.image_url || INTERIOR_IMG}
                          alt={listing.address}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className={`tag-pill text-[10px] ${statusColors[listing.status] || "bg-white/15 text-white/70"}`}>
                            {listing.status}
                          </span>
                          <span className={`tag-pill text-[10px] ${strategyColors[listing.strategy] || "bg-white/10 text-white/50"}`}>
                            {listing.strategy}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start gap-1 mb-0.5">
                          <MapPin size={11} className="text-[#3B3BFF] flex-shrink-0 mt-0.5" />
                          <h4
                            className="text-white font-semibold leading-tight line-clamp-2"
                            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem" }}
                          >
                            {listing.title}
                          </h4>
                        </div>
                        <p className="text-white/35 text-xs mb-3">{listing.address}, {listing.city}, {listing.state}</p>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-white/3 rounded-sm p-2 text-center">
                            <div className="text-[#3B3BFF] font-bold text-base leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                              {fmt(listing.price)}
                            </div>
                            <div className="text-white/30 text-[9px] tracking-widest uppercase mt-0.5">Ask</div>
                          </div>
                          <div className="bg-white/3 rounded-sm p-2 text-center">
                            <div className="text-white font-semibold text-base leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                              {fmt(listing.arv)}
                            </div>
                            <div className="text-white/30 text-[9px] tracking-widest uppercase mt-0.5">ARV</div>
                          </div>
                          <div className="bg-white/3 rounded-sm p-2 text-center">
                            <div className="text-white font-semibold text-base leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                              {fmt(listing.rehab_estimate)}
                            </div>
                            <div className="text-white/30 text-[9px] tracking-widest uppercase mt-0.5">Rehab</div>
                          </div>
                        </div>

                        {/* Property details */}
                        <div className="flex items-center gap-3 text-white/35 text-xs mb-3">
                          {listing.bedrooms != null && <span className="flex items-center gap-1"><Bed size={11} /> {listing.bedrooms}bd</span>}
                          {listing.bathrooms != null && <span className="flex items-center gap-1"><Bath size={11} /> {listing.bathrooms}ba</span>}
                          {listing.sqft != null && <span className="flex items-center gap-1"><Square size={11} /> {listing.sqft.toLocaleString()} sqft</span>}
                        </div>

                        {/* Highlights */}
                        {listing.highlights && listing.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {listing.highlights.slice(0, 3).map((h) => (
                              <span key={h} className="flex items-center gap-1 bg-white/5 text-white/40 text-[10px] px-2 py-0.5 rounded-sm">
                                <Tag size={9} />
                                {h}
                              </span>
                            ))}
                          </div>
                        )}

                        {listing.description && (
                          <p className="text-white/40 text-xs leading-relaxed mb-5 flex-1 line-clamp-3">{listing.description}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => setInquiryListing(listing)}
                            className="btn-gold text-xs py-2 flex-1 justify-center"
                            disabled={listing.status === "Sold" || listing.status === "Under Contract"}
                          >
                            Inquire <ChevronRight size={13} />
                          </button>
                          <button
                            onClick={() => toast.info("Full deal package request submitted. We'll send it within 24 hours.")}
                            className="btn-ghost-gold text-xs py-2 px-3 flex items-center gap-1"
                            title="Request Full Deal Package"
                          >
                            <FileText size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Deal CTA */}
              <div className="mt-10 card-luxury p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Have a Deal to Submit?
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Wholesalers and deal finders — submit your deals for review. Approved deals are published to our buyer network. We move fast on the right opportunities.
                  </p>
                </div>
                <button onClick={() => setShowSubmitForm(true)} className="btn-gold flex-shrink-0">
                  Submit a Deal <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INQUIRY MODAL ── */}
      {inquiryListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/10 rounded-sm w-full max-w-lg p-8 relative">
            <button onClick={() => setInquiryListing(null)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="mb-6">
              <div className="text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-1">Deal Inquiry</div>
              <h3 className="text-white font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {inquiryListing.title}
              </h3>
              <p className="text-white/40 text-sm">{inquiryListing.address}, {inquiryListing.city}</p>
            </div>
            <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">First Name *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="John" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Last Name *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Email *</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="john@email.com" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Phone</label>
                <input type="tel" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="720.620.9929" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Investor Type</label>
                <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B3BFF]/50 transition-colors">
                  <option value="active">Active Investor</option>
                  <option value="new">New Investor</option>
                  <option value="capital">Capital Partner / Lender</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Message</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors resize-none" placeholder="Tell us about your interest in this deal..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1 justify-center">
                  Submit Inquiry <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => toast.info("Full deal package request submitted.")} className="btn-ghost-gold text-xs px-4 flex items-center gap-1.5">
                  <FileText size={14} /> Full Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUBMIT DEAL MODAL ── */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#141414] border border-white/10 rounded-sm w-full max-w-lg p-8 relative my-8">
            <button onClick={() => setShowSubmitForm(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="mb-6">
              <div className="text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-1">Wholesaler Submission</div>
              <h3 className="text-white font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Submit a Deal for Review
              </h3>
              <p className="text-white/40 text-sm mt-1">All submissions are reviewed within 48 hours. Approved deals are published to our buyer network.</p>
            </div>
            <form onSubmit={handleDealSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Your Name *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Phone *</label>
                  <input required type="tel" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="720.620.9929" />
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Email *</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Property Address *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="123 Main St, Wichita, KS" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Asking Price *</label>
                  <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="85000" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Your Est. ARV</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="150000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Est. Rehab</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors" placeholder="40000" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Strategy Fit</label>
                  <select className="w-full bg-[#1a1a1a] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B3BFF]/50 transition-colors">
                    <option value="flip">Fix & Flip</option>
                    <option value="brrrr">BRRRR</option>
                    <option value="rental">Buy & Hold</option>
                    <option value="creative">Creative Finance</option>
                    <option value="unknown">Not Sure</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Property Description / Notes</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors resize-none" placeholder="Condition, motivation, timeline, any unique factors..." />
              </div>
              <button type="submit" className="btn-gold justify-center mt-2">
                Submit for Review <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
