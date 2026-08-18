/* ============================================================
   ADMIN LISTING FORM — OC Group Marketplace Manager
   Used for both creating new listings and editing existing ones
   ============================================================ */
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { supabase, MarketplaceListing } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STRATEGIES = ["Fix & Flip", "BRRRR", "Buy & Hold", "Creative Finance", "Wholesale"];
const STATUSES = ["Available", "Under Contract", "Sold", "Coming Soon"];
const PROPERTY_TYPES = ["Single Family", "Duplex", "Triplex", "Fourplex", "Multi-Family", "Commercial", "Land"];

const EMPTY: Omit<MarketplaceListing, "id" | "created_at" | "updated_at"> = {
  title: "",
  address: "",
  city: "Wichita",
  state: "KS",
  zip: "",
  price: 0,
  arv: null,
  rehab_estimate: null,
  projected_profit: null,
  strategy: "Fix & Flip",
  status: "Available",
  bedrooms: null,
  bathrooms: null,
  sqft: null,
  year_built: null,
  property_type: "Single Family",
  description: "",
  highlights: [],
  image_url: null,
  is_active: true,
  sort_order: 0,
};

const labelCls = "text-white/50 text-xs mb-1.5 block tracking-widest uppercase";
const inputCls = "w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B3BFF]/60 transition-colors";
const sectionCls = "bg-[#111111] border border-white/8 rounded-sm p-6 mb-5";

export default function AdminListingForm() {
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id && params.id !== "new";
  const [, navigate] = useLocation();

  const [form, setForm] = useState<Omit<MarketplaceListing, "id" | "created_at" | "updated_at">>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");
  const [newHighlight, setNewHighlight] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    supabase.getListing(params.id!)
      .then(data => {
        if (!data) { navigate("/admin"); return; }
        const { id, created_at, updated_at, ...rest } = data;
        setForm({ ...EMPTY, ...rest });
      })
      .catch(() => setError("Failed to load listing."))
      .finally(() => setFetching(false));
  }, [params.id, isEdit]);

  const set = (k: keyof typeof form, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const setNum = (k: keyof typeof form, v: string) =>
    set(k, v === "" ? null : Number(v));

  const addHighlight = () => {
    const h = newHighlight.trim();
    if (!h) return;
    set("highlights", [...form.highlights, h]);
    setNewHighlight("");
  };

  const removeHighlight = (i: number) =>
    set("highlights", form.highlights.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.address || !form.price) {
      setError("Title, address, and price are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await supabase.updateListing(params.id!, form);
        toast.success("Listing updated successfully.");
      } else {
        await supabase.createListing(form);
        toast.success("Listing created and is now live.");
      }
      navigate("/admin");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      setError(msg);
      toast.error("Failed to save listing.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#3B3BFF]" />
        <span className="text-white/40 text-sm ml-3">Loading listing...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Top bar */}
      <header className="bg-[#111111] border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft size={16} /> Back to Listings
            </button>
            <h1
              className="text-white font-bold text-lg"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {isEdit ? "Edit Listing" : "New Listing"}
            </h1>
            <button
              form="listing-form"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#3B3BFF] hover:bg-[#2a2aee] disabled:opacity-50 text-white text-xs font-semibold tracking-widest uppercase px-4 py-2.5 rounded-sm transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {loading ? "Saving..." : "Save Listing"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 mb-5">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <form id="listing-form" onSubmit={handleSubmit} className="flex flex-col gap-0">

          {/* ── BASIC INFO ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Listing Title *</label>
                <input
                  required
                  className={inputCls}
                  placeholder="e.g. East Side Fix & Flip — High-Demand Corridor"
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Strategy</label>
                  <select
                    className={inputCls}
                    value={form.strategy}
                    onChange={e => set("strategy", e.target.value)}
                  >
                    {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={e => set("status", e.target.value)}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Brief deal overview — what makes this property a strong opportunity..."
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── ADDRESS ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Location
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>Street Address *</label>
                <input
                  required
                  className={inputCls}
                  placeholder="3412 E Douglas Ave"
                  value={form.address}
                  onChange={e => set("address", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input className={inputCls} value={form.state} onChange={e => set("state", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>ZIP</label>
                  <input className={inputCls} placeholder="67218" value={form.zip} onChange={e => set("zip", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── FINANCIALS ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Deal Financials
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Asking Price *</label>
                <input
                  required
                  type="number"
                  className={inputCls}
                  placeholder="68000"
                  value={form.price || ""}
                  onChange={e => setNum("price", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>ARV</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="145000"
                  value={form.arv ?? ""}
                  onChange={e => setNum("arv", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Rehab Estimate</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="38000"
                  value={form.rehab_estimate ?? ""}
                  onChange={e => setNum("rehab_estimate", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Projected Profit</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="39000"
                  value={form.projected_profit ?? ""}
                  onChange={e => setNum("projected_profit", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── PROPERTY DETAILS ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Property Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Property Type</label>
                <select
                  className={inputCls}
                  value={form.property_type}
                  onChange={e => set("property_type", e.target.value)}
                >
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Bedrooms</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="3"
                  value={form.bedrooms ?? ""}
                  onChange={e => setNum("bedrooms", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Bathrooms</label>
                <input
                  type="number"
                  step="0.5"
                  className={inputCls}
                  placeholder="1.5"
                  value={form.bathrooms ?? ""}
                  onChange={e => setNum("bathrooms", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Square Feet</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="1240"
                  value={form.sqft ?? ""}
                  onChange={e => setNum("sqft", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Year Built</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="1962"
                  value={form.year_built ?? ""}
                  onChange={e => setNum("year_built", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Sort Order</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="1"
                  value={form.sort_order}
                  onChange={e => set("sort_order", Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* ── HIGHLIGHTS ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Deal Highlights
            </h2>
            <p className="text-white/40 text-xs mb-4">These appear as bullet points on the listing card. Add 3–5 key selling points.</p>
            <div className="flex gap-2 mb-4">
              <input
                className={`${inputCls} flex-1`}
                placeholder="e.g. Brick exterior, fast close possible..."
                value={newHighlight}
                onChange={e => setNewHighlight(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }}
              />
              <button
                type="button"
                onClick={addHighlight}
                className="flex items-center gap-1.5 bg-[#3B3BFF]/15 hover:bg-[#3B3BFF]/25 text-[#3B3BFF] text-xs font-semibold px-4 py-2.5 rounded-sm transition-colors"
              >
                <Plus size={13} /> Add
              </button>
            </div>
            {form.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-sm"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── VISIBILITY ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Visibility
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.is_active}
                  onChange={e => set("is_active", e.target.checked)}
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? "bg-[#3B3BFF]" : "bg-white/10"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {form.is_active ? "Visible on public marketplace" : "Hidden from public"}
                </div>
                <div className="text-white/40 text-xs">
                  {form.is_active ? "Investors can see and inquire about this listing." : "Only visible in the admin panel."}
                </div>
              </div>
            </label>
          </div>

          {/* ── IMAGE URL ── */}
          <div className={sectionCls}>
            <h2 className="text-white font-semibold text-base mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Property Image (Optional)
            </h2>
            <div>
              <label className={labelCls}>Image URL</label>
              <input
                type="url"
                className={inputCls}
                placeholder="https://... (paste a direct image URL)"
                value={form.image_url ?? ""}
                onChange={e => set("image_url", e.target.value || null)}
              />
              <p className="text-white/25 text-xs mt-1.5">Paste a direct link to a property photo. Leave blank to use the default placeholder.</p>
            </div>
            {form.image_url && (
              <div className="mt-3 rounded-sm overflow-hidden border border-white/10" style={{ maxWidth: 280 }}>
                <img src={form.image_url} alt="Preview" className="w-full h-36 object-cover" />
              </div>
            )}
          </div>

          {/* ── SUBMIT ── */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#3B3BFF] hover:bg-[#2a2aee] disabled:opacity-50 text-white text-xs font-semibold tracking-widest uppercase px-6 py-3 rounded-sm transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {loading ? "Saving..." : isEdit ? "Update Listing" : "Create Listing"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
