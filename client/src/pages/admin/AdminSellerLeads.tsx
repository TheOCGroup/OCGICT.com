import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

type Lead = { id: string; form: string; receivedAt: string | null; reference: string; name: string; address: string; email: string; phone: string; action: string; offerId: string };

export default function AdminSellerLeads() {
  const { logout } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/seller-leads", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 ? "Your administrator session has expired. Sign in again." : response.status === 404 ? "Seller review is not activated on this deployment." : "Seller records are unavailable. Please try again.");
      const data = await response.json() as { leads?: Lead[] };
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (e) { setLeads([]); setError(e instanceof Error ? e.message : "Unable to load seller records."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <main className="min-h-screen bg-[#0d0d0d] text-white p-6 md:p-10">
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div><p className="text-xs uppercase tracking-widest text-white/50">The OC Group · Private</p><h1 className="text-3xl font-semibold mt-2">Seller Review</h1><p className="text-white/50 text-sm mt-2">Read-only intake queue · latest 25 submissions</p></div>
        <div className="flex gap-4 items-center"><button onClick={() => void refresh()} className="border border-white/20 px-4 py-2">Refresh</button><Link href="/admin" className="text-white/70 underline">Admin</Link><button onClick={() => void logout()} className="text-white/70 underline">Sign out</button></div>
      </div>
      {loading ? <p role="status">Loading seller records…</p> : error ? <p role="alert" className="border border-red-500/40 p-4">{error}</p> : leads.length === 0 ? <p className="border border-white/15 p-5">No recent seller submissions.</p> :
        <div className="space-y-3">{leads.map(lead => <article key={lead.id} className="border border-white/15 bg-white/5 p-5 rounded-sm">
          <div className="flex flex-wrap justify-between gap-3"><strong>{lead.name || lead.address || lead.reference || "Seller submission"}</strong><span className="text-xs text-white/50">{lead.receivedAt ? new Date(lead.receivedAt).toLocaleString() : "Time unavailable"}</span></div>
          <p className="text-sm text-white/60 mt-2">{lead.form} {lead.action ? `· ${lead.action}` : ""}</p>
          {lead.address && <p className="mt-2">{lead.address}</p>}
          {lead.email && <p className="mt-2">Email: {lead.email}</p>}
          {lead.phone && <p className="mt-1">Phone: {lead.phone}</p>}
          {lead.reference && <p className="text-xs text-white/50 mt-2">Reference: {lead.reference}</p>}
        </article>)}</div>}
    </div>
  </main>;
}