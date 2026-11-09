import { Lock } from "lucide-react";

/** Founder access is delegated to Google; no password or founder code in the browser. */
export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <main className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#3B3BFF] rounded-sm mb-4">
          <Lock size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Admin Access
        </h1>
        <p className="text-white/50 text-sm mt-2 mb-8">OCGICT — Authorized team access</p>
        <div className="bg-[#111111] border border-white/10 rounded-sm p-8">
          <p className="text-white/70 text-sm mb-6">
            Sign in with your authorized Google account to review seller inquiries.
          </p>
          <a href="/api/admin/google/start"
            className="block w-full bg-[#3B3BFF] hover:bg-[#2a2aee] text-white font-semibold text-xs tracking-widest uppercase px-6 py-3 rounded-sm transition-colors">
            Continue with Google
          </a>
          <p className="text-white/40 text-xs mt-5">Access is restricted to approved accounts.</p>
        </div>
        <a href="/" className="inline-block text-white/40 hover:text-white/70 text-xs mt-6">Back to website</a>
      </main>
    </div>
  );
}
