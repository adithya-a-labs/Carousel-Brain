import { Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-2xl"
      style={{ boxShadow: "0 1px 0 rgba(100,80,200,0.06), 0 4px 20px rgba(80,60,180,0.04)" }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(280 65% 62%))",
              boxShadow: "0 2px 10px hsl(248 70% 58% / 0.35)"
            }}
          >
            <Sparkles className="w-4 h-4 text-white relative z-10" />
          </div>
          <span className="font-bold text-[17px] tracking-tight text-foreground group-hover:opacity-80 transition-opacity">
            CarouselBrain
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
              location.startsWith('/dashboard')
                ? 'text-primary bg-primary/8'
                : 'text-muted-foreground hover:text-foreground hover:bg-black/4'
            }`}
            data-testid="link-dashboard"
          >
            Open Library
          </Link>
          <Link
            href="/extract"
            className="relative text-sm font-semibold text-white px-5 py-2 rounded-xl overflow-hidden"
            data-testid="link-extract"
            style={{
              background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))",
              boxShadow: "0 2px 12px hsl(248 70% 58% / 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
          >
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="block"
            >
              Extract
            </motion.span>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
