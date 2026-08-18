/* ============================================================
   ADMIN LISTINGS DASHBOARD — OC Group Marketplace Manager
   Full CRUD + Sort & Filter: search, strategy, status, visibility, sortable columns
   ============================================================ */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { supabase, MarketplaceListing } from "@/lib/supabase";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, LogOut, Home,
  TrendingUp, DollarSign, RefreshCw, AlertCircle,
  ChevronUp, ChevronDown, ChevronsUpDown, Search, X, SlidersHorizontal,
  Upload, FileText, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";

const strategyColors: Record<string, string> = {
  "Fix & Flip": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "BRRRR": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Buy & Hold": "bg-green-500/15 text-green-400 border-green-500/20",
  "Creative Finance": "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "Wholesale": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const statusColors: Record<string, string> = {
  "Available": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Under Contract": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Sold": "bg-red-500/15 text-red-400 border-red-500/20",
  "Coming Soon": "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const STRATEGIES = ["All Strategies", "Fix & Flip", "BRRRR", "Buy & Hold", "Creative Finance", "Wholesale"];
const STATUSES = ["All Statuses", "Available", "Under Contract", "Sold", "Coming Soon"];
const VISIBILITY = ["All", "Visible", "Hidden"];

type SortKey = "title" | "price" | "arv" | "projected_profit" | "status" | "strategy" | "created_at" | "sort_order";
type SortDir = "asc" | "desc";

function fmt(n: number | null) {
  if (n == null) return "—";
  return "$" + n.toLocaleString();
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="text-white/20 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="text-[#3B3BFF] ml-1 inline" />
    : <ChevronDown size={12} className="text-[#3B3BFF] ml-1 inline" />;
}

export default function AdminListings() {
  const { logout } = useAdminAuth();
  const [, navigate] = useLocation();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("All Strategies");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [visibilityFilter, setVisibilityFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("sort_order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await supabase.getListings(false);
      setListings(data);
    } catch {
      setError("Failed to load listings. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await supabase.deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success("Listing deleted.");
    } catch {
      toast.error("Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (listing: MarketplaceListing) => {
    if (!listing.id) return;
    setTogglingId(listing.id);
    try {
      await supabase.toggleListingActive(listing.id, !listing.is_active);
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l));
      toast.success(listing.is_active ? "Listing hidden from public." : "Listing is now live.");
    } catch {
      toast.error("Failed to update listing.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── CSV IMPORT STATE ──
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<Partial<MarketplaceListing>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const cells: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = ""; }
        else { cur += c; }
      }
      cells.push(cur.trim());
      rows.push(cells);
    }
    return rows;
  };

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error("CSV appears empty or invalid."); return; }
      const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
      const errors: string[] = [];
      const parsed: Partial<MarketplaceListing>[] = [];

      // Column mapping — handles DealMachine and generic CSVs
      const col = (names: string[]) => {
        for (const n of names) {
          const idx = headers.findIndex(h => h.includes(n));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const idxAddress = col(["property_address", "address", "street"]);
      const idxCity = col(["city"]);
      const idxState = col(["state"]);
      const idxZip = col(["zip", "postal"]);
      const idxPrice = col(["list_price", "asking_price", "price", "offer"]);
      const idxArv = col(["estimated_value", "arv", "after_repair"]);
      const idxRehab = col(["rehab", "repair", "est_repair"]);
      const idxBeds = col(["beds", "bedrooms", "br"]);
      const idxBaths = col(["baths", "bathrooms"]);
      const idxSqft = col(["sqft", "sq_ft", "square"]);
      const idxYear = col(["year_built", "year"]);
      const idxStrategy = col(["strategy", "exit"]);
      const idxStatus = col(["status", "deal_status"]);
      const idxNotes = col(["notes", "description", "comments"]);

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const get = (idx: number) => idx >= 0 ? (r[idx] || "").trim() : "";
        const num = (idx: number) => { const v = parseFloat(get(idx).replace(/[$,]/g, "")); return isNaN(v) ? null : v; };

        const address = get(idxAddress);
        if (!address) { errors.push(`Row ${i + 1}: Missing address — skipped`); continue; }

        const city = get(idxCity) || "Wichita";
        const state = get(idxState) || "KS";
        const zip = get(idxZip) || "";
        const price = num(idxPrice) || 0;
        const arv = num(idxArv);
        const rehab = num(idxRehab);
        const beds = parseInt(get(idxBeds)) || null;
        const baths = parseFloat(get(idxBaths)) || null;
        const sqft = parseInt(get(idxSqft)) || null;
        const year = parseInt(get(idxYear)) || null;
        const profit = arv && price ? Math.round(arv - price - (rehab || 0)) : null;

        // Normalize strategy
        const rawStrategy = get(idxStrategy).toLowerCase();
        let strategy = "Fix & Flip";
        if (rawStrategy.includes("brrrr") || rawStrategy.includes("hold")) strategy = "BRRRR";
        else if (rawStrategy.includes("wholesale")) strategy = "Wholesale";
        else if (rawStrategy.includes("creative")) strategy = "Creative Finance";
        else if (rawStrategy.includes("buy") && rawStrategy.includes("hold")) strategy = "Buy & Hold";

        const rawStatus = get(idxStatus).toLowerCase();
        let status = "Available";
        if (rawStatus.includes("contract")) status = "Under Contract";
        else if (rawStatus.includes("sold")) status = "Sold";
        else if (rawStatus.includes("coming")) status = "Coming Soon";

        parsed.push({
          title: address,
          address,
          city,
          state,
          zip,
          price,
          arv,
          rehab_estimate: rehab,
          projected_profit: profit,
          bedrooms: beds,
          bathrooms: baths,
          sqft,
          year_built: year,
          strategy,
          status,
          description: get(idxNotes) || "",
          is_active: true,
          sort_order: 0,
        });
      }

      setImportErrors(errors);
      setImportRows(parsed);
      setImportDone(false);
      if (parsed.length === 0) {
        toast.error("No valid rows found. Check your CSV format.");
      } else {
        toast.success(`Parsed ${parsed.length} listing${parsed.length !== 1 ? "s" : ""} — review and confirm below.`);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    if (!importRows.length) return;
    setImporting(true);
    let success = 0, fail = 0;
    for (const row of importRows) {
      try {
        await supabase.createListing(row as MarketplaceListing);
        success++;
      } catch {
        fail++;
      }
    }
    setImporting(false);
    setImportDone(true);
    if (success > 0) {
      toast.success(`Imported ${success} listing${success !== 1 ? "s" : ""} successfully!`);
      await fetchListings();
    }
    if (fail > 0) toast.error(`${fail} row${fail !== 1 ? "s" : ""} failed to import.`);
    if (success > 0) setTimeout(() => { setShowImport(false); setImportRows([]); setImportErrors([]); setImportDone(false); }, 1500);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStrategyFilter("All Strategies");
    setStatusFilter("All Statuses");
    setVisibilityFilter("All");
  };

  const hasActiveFilters = search || strategyFilter !== "All Strategies" || statusFilter !== "All Statuses" || visibilityFilter !== "All";

  // Filtered + sorted listings
  const processed = useMemo(() => {
    let result = [...listings];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.strategy.toLowerCase().includes(q)
      );
    }

    // Strategy filter
    if (strategyFilter !== "All Strategies") {
      result = result.filter(l => l.strategy === strategyFilter);
    }

    // Status filter
    if (statusFilter !== "All Statuses") {
      result = result.filter(l => l.status === statusFilter);
    }

    // Visibility filter
    if (visibilityFilter === "Visible") result = result.filter(l => l.is_active);
    if (visibilityFilter === "Hidden") result = result.filter(l => !l.is_active);

    // Sort
    result.sort((a, b) => {
      let av: string | number | null = null;
      let bv: string | number | null = null;
      if (sortKey === "title") { av = a.title; bv = b.title; }
      else if (sortKey === "price") { av = a.price; bv = b.price; }
      else if (sortKey === "arv") { av = a.arv; bv = b.arv; }
      else if (sortKey === "projected_profit") { av = a.projected_profit; bv = b.projected_profit; }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
      else if (sortKey === "strategy") { av = a.strategy; bv = b.strategy; }
      else if (sortKey === "sort_order") { av = a.sort_order; bv = b.sort_order; }
      else if (sortKey === "created_at") { av = a.created_at || ""; bv = b.created_at || ""; }

      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? 1 : -1;
      if (bv == null) return sortDir === "asc" ? -1 : 1;

      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return result;
  }, [listings, search, strategyFilter, statusFilter, visibilityFilter, sortKey, sortDir]);

  const activeCount = listings.filter(l => l.is_active).length;
  const totalValue = listings.filter(l => l.is_active).reduce((s, l) => s + (l.price || 0), 0);
  const totalProfit = listings.filter(l => l.is_active).reduce((s, l) => s + (l.projected_profit || 0), 0);

  const thCls = "text-white/30 text-[10px] tracking-widest uppercase cursor-pointer hover:text-white/60 transition-colors select-none";

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* ── TOP BAR ── */}
      <header className="bg-[#111111] border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#3B3BFF] rounded-sm flex items-center justify-center">
                <TrendingUp size={15} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  OC Group Admin
                </div>
                <div className="text-white/30 text-xs">Marketplace Manager</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/submissions"
                className="flex items-center gap-1.5 text-white/40 hover:text-[#3B3BFF] text-xs transition-colors">
                <FileText size={13} /> Deal Submissions
              </Link>
              <a href="/marketplace" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors">
                <Home size={13} /> View Public Page
              </a>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 text-white/40 hover:text-red-400 text-xs transition-colors">
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Listings", value: activeCount.toString(), icon: Eye, color: "text-[#3B3BFF]" },
            { label: "Total Listed Value", value: fmt(totalValue), icon: DollarSign, color: "text-emerald-400" },
            { label: "Projected Profit", value: fmt(totalProfit), icon: TrendingUp, color: "text-orange-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111111] border border-white/8 rounded-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-white/5 flex items-center justify-center flex-shrink-0">
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <div className="text-white/40 text-xs mb-0.5">{stat.label}</div>
                <div className="text-white font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── HEADER ROW ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Marketplace Listings
            </h1>
            <p className="text-white/40 text-sm">
              {hasActiveFilters
                ? `${processed.length} of ${listings.length} listings match filters`
                : `${listings.length} total listings`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchListings}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs border border-white/10 rounded-sm px-3 py-2 transition-colors">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <label className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs border border-white/10 rounded-sm px-3 py-2 transition-colors cursor-pointer">
              <Upload size={13} /> Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={e => { setShowImport(true); handleCSVFile(e); }} />
            </label>
            <Link href="/admin/listings/new">
              <button className="flex items-center gap-2 bg-[#3B3BFF] hover:bg-[#2a2aee] text-white text-xs font-semibold tracking-widest uppercase px-4 py-2.5 rounded-sm transition-colors">
                <Plus size={14} /> Add Listing
              </button>
            </Link>
          </div>
        </div>

        {/* ── SEARCH + FILTER BAR ── */}
        <div className="bg-[#111111] border border-white/8 rounded-sm p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search by title, address, city, strategy..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-sm pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 text-xs border rounded-sm px-4 py-2.5 transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-[#3B3BFF]/15 border-[#3B3BFF]/40 text-[#3B3BFF]"
                  : "border-white/10 text-white/40 hover:text-white/70"
              }`}
            >
              <SlidersHorizontal size={13} />
              Filters
              {hasActiveFilters && (
                <span className="bg-[#3B3BFF] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {[strategyFilter !== "All Strategies", statusFilter !== "All Statuses", visibilityFilter !== "All"].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/60 text-xs border border-white/10 rounded-sm px-3 py-2.5 transition-colors"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Expanded filter dropdowns */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/8">
              {/* Strategy */}
              <div>
                <label className="text-white/30 text-[10px] tracking-widest uppercase mb-2 block">Strategy</label>
                <select
                  value={strategyFilter}
                  onChange={e => setStrategyFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B3BFF]/50 transition-colors"
                >
                  {STRATEGIES.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-white/30 text-[10px] tracking-widest uppercase mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B3BFF]/50 transition-colors"
                >
                  {STATUSES.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="text-white/30 text-[10px] tracking-widest uppercase mb-2 block">Visibility</label>
                <div className="flex gap-1">
                  {VISIBILITY.map(v => (
                    <button
                      key={v}
                      onClick={() => setVisibilityFilter(v)}
                      className={`flex-1 text-xs py-2 rounded-sm border transition-colors ${
                        visibilityFilter === v
                          ? "bg-[#3B3BFF]/20 border-[#3B3BFF]/40 text-[#3B3BFF]"
                          : "border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 mb-5">
            <AlertCircle size={15} className="text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* ── LISTINGS TABLE ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="animate-spin text-[#3B3BFF]" />
            <span className="text-white/40 text-sm ml-3">Loading listings...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] border border-white/8 rounded-sm">
            <TrendingUp size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No listings yet.</p>
            <Link href="/admin/listings/new">
              <button className="mt-4 bg-[#3B3BFF] text-white text-xs font-semibold tracking-widest uppercase px-5 py-2.5 rounded-sm">
                Add Your First Listing
              </button>
            </Link>
          </div>
        ) : processed.length === 0 ? (
          <div className="text-center py-16 bg-[#111111] border border-white/8 rounded-sm">
            <Search size={28} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-4">No listings match your search or filters.</p>
            <button onClick={clearFilters} className="text-[#3B3BFF] text-xs hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/8 rounded-sm overflow-hidden">
            {/* Sortable table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/8">
              <button className={`col-span-4 text-left ${thCls}`} onClick={() => handleSort("title")}>
                Property <SortIcon col="title" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className={`col-span-2 text-left ${thCls}`} onClick={() => handleSort("price")}>
                Price / ARV <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className={`col-span-1 text-left ${thCls}`} onClick={() => handleSort("strategy")}>
                Strategy <SortIcon col="strategy" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className={`col-span-1 text-left ${thCls}`} onClick={() => handleSort("status")}>
                Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <button className={`col-span-1 text-left ${thCls}`} onClick={() => handleSort("projected_profit")}>
                Profit <SortIcon col="projected_profit" sortKey={sortKey} sortDir={sortDir} />
              </button>
              <div className={`col-span-1 ${thCls} cursor-default`}>Visible</div>
              <div className={`col-span-2 text-right ${thCls} cursor-default`}>Actions</div>
            </div>

            {/* Rows */}
            {processed.map((listing) => (
              <div
                key={listing.id}
                className={`grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-white/5 last:border-0 transition-colors hover:bg-white/2 ${!listing.is_active ? "opacity-50" : ""}`}
              >
                {/* Property */}
                <div className="col-span-4">
                  <div className="text-white text-sm font-medium leading-tight mb-0.5 line-clamp-1">
                    {listing.title}
                  </div>
                  <div className="text-white/40 text-xs">{listing.address}, {listing.city}</div>
                  <div className="text-white/25 text-xs mt-0.5">
                    {listing.bedrooms != null ? `${listing.bedrooms}bd` : ""}
                    {listing.bathrooms != null ? ` · ${listing.bathrooms}ba` : ""}
                    {listing.sqft != null ? ` · ${listing.sqft.toLocaleString()} sqft` : ""}
                  </div>
                </div>

                {/* Price / ARV */}
                <div className="col-span-2">
                  <div className="text-white text-sm font-semibold">{fmt(listing.price)}</div>
                  <div className="text-white/40 text-xs">ARV: {fmt(listing.arv)}</div>
                </div>

                {/* Strategy */}
                <div className="col-span-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm border ${strategyColors[listing.strategy] || "bg-white/5 text-white/40 border-white/10"}`}>
                    {listing.strategy}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm border ${statusColors[listing.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                    {listing.status}
                  </span>
                </div>

                {/* Profit */}
                <div className="col-span-1">
                  <div className="text-emerald-400 text-sm font-semibold">{fmt(listing.projected_profit)}</div>
                </div>

                {/* Visible toggle */}
                <div className="col-span-1">
                  <button
                    onClick={() => handleToggleActive(listing)}
                    disabled={togglingId === listing.id}
                    title={listing.is_active ? "Click to hide" : "Click to show"}
                    className={`w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${
                      listing.is_active
                        ? "bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400"
                        : "bg-white/5 text-white/30 hover:bg-emerald-500/15 hover:text-emerald-400"
                    }`}
                  >
                    {listing.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Link href={`/admin/listings/${listing.id}/edit`}>
                    <button className="w-8 h-8 rounded-sm bg-[#3B3BFF]/10 text-[#3B3BFF] hover:bg-[#3B3BFF]/20 flex items-center justify-center transition-colors">
                      <Edit2 size={13} />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(listing.id!, listing.title)}
                    disabled={deletingId === listing.id}
                    className="w-8 h-8 rounded-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer hint */}
        {processed.length > 0 && (
          <p className="text-white/20 text-xs mt-3 text-center">
            Showing {processed.length} of {listings.length} listings · Click any column header to sort
          </p>
        )}
      </div>

      {/* ── CSV IMPORT MODAL ── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-sm w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#3B3BFF]/15 rounded-sm flex items-center justify-center">
                  <FileText size={15} className="text-[#3B3BFF]" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Import CSV</div>
                  <div className="text-white/30 text-xs">Review parsed listings before importing</div>
                </div>
              </div>
              <button onClick={() => { setShowImport(false); setImportRows([]); setImportErrors([]); setImportDone(false); }}
                className="text-white/30 hover:text-white/70 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {importRows.length === 0 && importErrors.length === 0 && (
                <div className="text-center py-12">
                  <Upload size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Select a CSV file to preview</p>
                  <p className="text-white/20 text-xs mt-1">Supports DealMachine exports and generic CSVs</p>
                  <label className="mt-4 inline-flex items-center gap-2 bg-[#3B3BFF] hover:bg-[#2a2aee] text-white text-xs font-semibold px-4 py-2.5 rounded-sm cursor-pointer transition-colors">
                    <Upload size={13} /> Choose CSV File
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
                  </label>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-sm p-3">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold mb-2">
                    <AlertCircle size={13} /> {importErrors.length} row{importErrors.length !== 1 ? "s" : ""} skipped
                  </div>
                  {importErrors.map((e, i) => <div key={i} className="text-yellow-400/60 text-xs">{e}</div>)}
                </div>
              )}

              {importRows.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-3">
                    <CheckCircle2 size={13} /> {importRows.length} listing{importRows.length !== 1 ? "s" : ""} ready to import
                  </div>
                  <div className="space-y-2">
                    {importRows.map((row, i) => (
                      <div key={i} className="bg-white/3 border border-white/6 rounded-sm p-3 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <div className="text-white text-xs font-medium line-clamp-1">{row.title}</div>
                          <div className="text-white/40 text-[10px]">{row.city}, {row.state} {row.zip}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-white text-xs">{row.price ? `$${(row.price as number).toLocaleString()}` : "—"}</div>
                          <div className="text-white/30 text-[10px]">ARV: {row.arv ? `$${(row.arv as number).toLocaleString()}` : "—"}</div>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${strategyColors[row.strategy as string] || "bg-white/5 text-white/40 border-white/10"}`}>
                            {row.strategy}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <div className="text-white/40 text-[10px]">
                            {row.bedrooms != null ? `${row.bedrooms}bd` : ""}
                            {row.bathrooms != null ? ` ${row.bathrooms}ba` : ""}
                          </div>
                        </div>
                        <div className="col-span-1 text-right">
                          <button onClick={() => setImportRows(prev => prev.filter((_, j) => j !== i))}
                            className="text-white/20 hover:text-red-400 transition-colors">
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {importDone && (
                <div className="text-center py-8">
                  <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">Import complete!</p>
                  <p className="text-white/40 text-sm">Listings are now live on the marketplace.</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            {importRows.length > 0 && !importDone && (
              <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between">
                <div className="text-white/30 text-xs">
                  {importRows.length} listing{importRows.length !== 1 ? "s" : ""} will be added as <span className="text-emerald-400">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setShowImport(false); setImportRows([]); setImportErrors([]); }}
                    className="text-white/40 hover:text-white/70 text-xs border border-white/10 rounded-sm px-4 py-2 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleImportConfirm} disabled={importing}
                    className="flex items-center gap-2 bg-[#3B3BFF] hover:bg-[#2a2aee] disabled:opacity-50 text-white text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-sm transition-colors">
                    {importing ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                    {importing ? "Importing..." : `Import ${importRows.length} Listing${importRows.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
