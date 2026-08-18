/* ============================================================
   404 NOT FOUND — Dark Luxury "Investment Grade" Design
   ============================================================ */
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-32">
        <div className="container text-center">
          <div
            className="font-bold leading-none mb-6 select-none"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(6rem, 20vw, 14rem)",
              color: "oklch(0.45 0.22 264 / 15%)",
            }}
          >
            404
          </div>
          <div className="-mt-16 relative z-10">
            <span className="section-eyebrow">Page Not Found</span>
            <h1
              className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              This Page Doesn't Exist
            </h1>
            <p className="text-white/50 text-base max-w-md mx-auto mb-10 leading-relaxed">
              The page you're looking for may have moved or never existed. Let's get you back on track.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="btn-gold">
                <Home size={16} /> Back to Home
              </Link>
              <Link href="/contact" className="btn-ghost-gold">
                Contact Us <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
