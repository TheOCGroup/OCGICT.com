/*
  Design: Dark Luxury — Admin Panel
  Page: Deal Submissions Review
  Palette: #0d0d0d bg, white text, #3B3BFF accent
*/

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, Eye, Plus,
  Phone, Mail, Home, DollarSign, RefreshCw,
  ChevronDown, ChevronUp, LogOut, Building2
} from "lucide-react";

const SUPABASE_URL = "https://lsaerludzkxjewqgbvkg.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWVybHVkemt4amV3cWdidmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTMwNzEsImV4cCI6MjA5MTc2OTA3MX0.k0PmsyeAQ-hq8aTn_AVoyzsx-cbYdmfQzHKhIMp_s1U";

interface Submission {
  id: string;
  submitter_name: string;
  submitter_phone: string | null;
  submitter_email: string | null;
  submitter_type: string;
  property_address: string;
  city: string;
  state: string;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  year_built: number | null;
  property_condition: string | null;
  asking_price: number | null;
  arv: number | null;
  rehab_estimate: number | null;
  strategy: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

async function sbFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const fmt = (v: number | null) => v != null ? `$${v.toLocaleString()}` : "—";
const statusColors: Record<string, string> = {
  "Pending Review": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Approved": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Rejected": "bg-red-500/15 text-red-400 border-red-500/20",
  "Published": "bg-[#3B3BFF]/15 text-[#3B3BFF] border-[#3B3BFF]/30",
};

export default function AdminSubmissions() {
  const { logout } = useAdminAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("Pending Review");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await sbFetch("deal_submissions?order=created_at.desc");
      setSubmissions(data || []);
    } catch (e) {
      toast.error("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await sbFetch(`deal_submissions?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewed_at: new Date().toISOString() }),
        headers: { Prefer: "return=minimal" },
      });
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast.success(`Submission marked as ${status}`);
    } catch {
      toast.error("Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  const publishToMarketplace = async (sub: Submission) => {
    setUpdating(sub.id);
    try {
      const listing = {
        title: sub.property_address,
        address: sub.property_address,
        city: sub.city || "Wichita",
        state: sub.state || "KS",
        zip: sub.zip || "",
        price: sub.asking_price || 0,
        arv: sub.arv,
        rehab_estimate: sub.rehab_estimate,
        projected_profit: sub.arv && sub.asking_price
          ? sub.arv - sub.asking_price - (sub.rehab_estimate || 0)
          : null,
        strategy: sub.strategy || "Fix & Flip",
        status: "Available",
        bedrooms: sub.bedrooms,
        bathrooms: sub.bathrooms,
        sqft: sub.sqft,
        year_built: sub.year_built,
        property_type: "Single Family",
        description: sub.description || "",
        highlights: [],
        image_url: null,
        is_active: true,
        sort_order: 0,
      };
      const result = await sbFetch("marketplace_listings", {
        method: "POST",
        body: JSON.stringify({ ...listing, updated_at: new Date().toISOString() }),
      });
      const listingId = result?.[0]?.id;
      await sbFetch(`deal_submissions?id=eq.${sub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Published", reviewed_at: new Date().toISOString(), published_listing_id: listingId }),
        headers: { Prefer: "return=minimal" },
      });
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "Published" } : s));
      toast.success("Deal published to marketplace!");
    } catch (e) {
      toast.error("Failed to publish deal.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "All" ? submissions : submissions.filter(s => s.status === filter);
  const counts = {
    "Pending Review": submissions.filter(s => s.status === "Pending Review").length,
    "Approved": submissions.filter(s => s.status === "Approved").length,
    "Published": submissions.filter(s => s.status === "Published").length,
    "Rejected": submissions.filter(s => s.status === "Rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Admin top bar */}
      <div className="bg-[#111] border-b border-white/8 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1.5">
            <Home size={12} /> Site
          </Link>
          <Link href="/admin/listings" className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1.5">
            <Building2 size={12} /> Listings
          </Link>
          <span className="text-[#3B3BFF] text-xs font-semibold">Deal Submissions</span>
        </div>
        <button onClick={logout} className="text-white/20 hover:text-white/50 text-xs flex items-center gap-1.5 transition-colors">
          <LogOut size={12} /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Deal Submissions
            </h1>
            <p className="text-white/30 text-sm mt-1">Review and publish deals submitted via the public form</p>
          </div>
          <button onClick={fetchSubmissions} className="text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Object.entries(counts).map(([status, count]) => (
            <button key={status} onClick={() => setFilter(status)}
              className={`bg-[#111] border rounded-sm p-4 text-left transition-colors ${
                filter === status ? "border-[#3B3BFF]/40" : "border-white/8 hover:border-white/15"
              }`}>
              <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{status}</div>
              <div className="text-white text-2xl font-bold">{count}</div>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["All", "Pending Review", "Approved", "Published", "Rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-4 py-2 rounded-sm border transition-colors ${
                filter === f
                  ? "bg-[#3B3BFF]/15 border-[#3B3BFF]/40 text-[#3B3BFF]"
                  : "border-white/10 text-white/40 hover:text-white/60"
              }`}>
              {f} {f !== "All" && `(${counts[f as keyof typeof counts] ?? 0})`}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        {loading ? (
          <div className="text-center py-20 text-white/30">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
            Loading submissions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#111] border border-white/8 rounded-sm">
            <Clock size={32} className="text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No {filter !== "All" ? filter.toLowerCase() : ""} submissions yet.</p>
            <p className="text-white/20 text-xs mt-1">Share the Submit a Deal link with wholesalers and Facebook group members.</p>
            <Link href="/submit-deal">
              <button className="mt-4 text-[#3B3BFF] text-xs border border-[#3B3BFF]/30 px-4 py-2 rounded-sm hover:bg-[#3B3BFF]/10 transition-colors">
                View Submit a Deal page →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(sub => {
              const isExpanded = expanded === sub.id;
              const spread = sub.arv && sub.asking_price
                ? sub.arv - sub.asking_price - (sub.rehab_estimate || 0)
                : null;
              return (
                <div key={sub.id} className="bg-[#111] border border-white/8 rounded-sm overflow-hidden">
                  {/* Row header */}
                  <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/2 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : sub.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-white font-medium text-sm">{sub.property_address}</span>
                        <span className="text-white/40 text-xs">{sub.city}, {sub.state}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-sm border ${statusColors[sub.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-white/40 text-xs">By {sub.submitter_name} ({sub.submitter_type})</span>
                        {sub.asking_price && <span className="text-white/40 text-xs">Ask: {fmt(sub.asking_price)}</span>}
                        {spread != null && (
                          <span className={`text-xs font-semibold ${spread > 30000 ? "text-emerald-400" : "text-yellow-400"}`}>
                            Spread: {fmt(spread)}
                          </span>
                        )}
                        <span className="text-white/20 text-xs">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-white/30 shrink-0" /> : <ChevronDown size={14} className="text-white/30 shrink-0" />}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-white/8 px-5 py-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                        {/* Contact */}
                        <div>
                          <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Submitter</div>
                          <div className="space-y-2">
                            <div className="text-white text-sm font-medium">{sub.submitter_name}</div>
                            <div className="text-white/40 text-xs">{sub.submitter_type}</div>
                            {sub.submitter_phone && (
                              <a href={`tel:${sub.submitter_phone.replace(/\D/g,"")}`}
                                className="flex items-center gap-2 text-[#3B3BFF] text-sm hover:underline">
                                <Phone size={12} /> {sub.submitter_phone}
                              </a>
                            )}
                            {sub.submitter_email && (
                              <a href={`mailto:${sub.submitter_email}`}
                                className="flex items-center gap-2 text-[#3B3BFF] text-sm hover:underline">
                                <Mail size={12} /> {sub.submitter_email}
                              </a>
                            )}
                          </div>
                        </div>
                        {/* Property specs */}
                        <div>
                          <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Property</div>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-white/40">Address</span>
                            <span className="text-white">{sub.property_address}</span>
                            <span className="text-white/40">City</span>
                            <span className="text-white">{sub.city}, {sub.state} {sub.zip}</span>
                            {sub.bedrooms != null && <><span className="text-white/40">Beds/Baths</span><span className="text-white">{sub.bedrooms}bd / {sub.bathrooms}ba</span></>}
                            {sub.sqft != null && <><span className="text-white/40">Sq Ft</span><span className="text-white">{sub.sqft?.toLocaleString()}</span></>}
                            {sub.year_built != null && <><span className="text-white/40">Year Built</span><span className="text-white">{sub.year_built}</span></>}
                            {sub.property_condition && <><span className="text-white/40">Condition</span><span className="text-white">{sub.property_condition}</span></>}
                          </div>
                        </div>
                        {/* Numbers */}
                        <div>
                          <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Deal Numbers</div>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-white/40">Asking</span><span className="text-white font-semibold">{fmt(sub.asking_price)}</span>
                            <span className="text-white/40">ARV</span><span className="text-white">{fmt(sub.arv)}</span>
                            <span className="text-white/40">Rehab Est.</span><span className="text-white">{fmt(sub.rehab_estimate)}</span>
                            <span className="text-white/40">Spread</span>
                            <span className={`font-semibold ${spread != null && spread > 30000 ? "text-emerald-400" : "text-yellow-400"}`}>
                              {fmt(spread)}
                            </span>
                            {sub.strategy && <><span className="text-white/40">Strategy</span><span className="text-white">{sub.strategy}</span></>}
                          </div>
                        </div>
                        {/* Notes */}
                        {sub.description && (
                          <div>
                            <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Notes</div>
                            <p className="text-white/60 text-sm leading-relaxed">{sub.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {sub.status !== "Published" && (
                        <div className="flex gap-3 flex-wrap pt-4 border-t border-white/8">
                          {sub.status !== "Approved" && sub.status !== "Rejected" && (
                            <>
                              <button
                                onClick={() => updateStatus(sub.id, "Approved")}
                                disabled={updating === sub.id}
                                className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                onClick={() => updateStatus(sub.id, "Rejected")}
                                disabled={updating === sub.id}
                                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => publishToMarketplace(sub)}
                            disabled={updating === sub.id}
                            className="flex items-center gap-2 bg-[#3B3BFF]/15 border border-[#3B3BFF]/30 text-[#3B3BFF] hover:bg-[#3B3BFF]/25 text-xs px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
                          >
                            {updating === sub.id
                              ? <><RefreshCw size={12} className="animate-spin" /> Publishing...</>
                              : <><Plus size={13} /> Publish to Marketplace</>
                            }
                          </button>
                        </div>
                      )}
                      {sub.status === "Published" && (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs pt-4 border-t border-white/8">
                          <CheckCircle2 size={13} /> This deal has been published to the marketplace.
                          <Link href="/marketplace" className="underline hover:no-underline ml-1">View →</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
