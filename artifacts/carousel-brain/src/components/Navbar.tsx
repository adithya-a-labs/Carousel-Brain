import { Link, useLocation } from "wouter";
import { Menu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { hover, spring, tap, transition } from "@/lib/motion";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))";

const primaryCtaShadow =
  "0 2px 12px hsl(248 70% 58% / 0.4), 0 4px 20px hsl(248 70% 58% / 0.15), inset 0 1px 0 rgba(255,255,255,0.2)";

function NavLoginLink({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location.startsWith("/dashboard");

  return (
    <Link href="/dashboard" onClick={onNavigate} data-testid="link-login">
      <motion.span
        whileHover={hover.subtle}
        whileTap={tap.press}
        className={`inline-flex items-center justify-center text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-300 ${className} ${
          isActive
            ? "text-foreground bg-black/5"
            : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
        }`}
      >
        Login
      </motion.span>
    </Link>
  );
}

function NavGetStartedButton({
  className = "",
  fullWidth = false,
  onNavigate,
}: {
  className?: string;
  fullWidth?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/extract"
      onClick={onNavigate}
      data-testid="link-get-started"
      className={`group ${fullWidth ? "block w-full" : "inline-block"}`}
    >
      <motion.span
        whileHover={hover.glow}
        whileTap={tap.deep}
        className={`relative overflow-hidden flex items-center justify-center text-sm font-semibold text-white rounded-xl transition-shadow duration-500 ${className} ${
          fullWidth ? "w-full px-5 py-3" : "px-4 py-2 sm:px-5"
        }`}
        style={{
          background: PRIMARY_GRADIENT,
          boxShadow: primaryCtaShadow,
        }}
      >
        <span className="relative z-10 whitespace-nowrap">Get Started</span>
        <span
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          aria-hidden
        >
          <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </span>
      </motion.span>
    </Link>
  );
}

function NavOpenLibraryLink({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location.startsWith("/dashboard");

  return (
    <Link href="/dashboard" onClick={onNavigate} data-testid="link-dashboard">
      <motion.span
        whileHover={hover.subtle}
        whileTap={tap.press}
        className={`inline-flex text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-300 ${className} ${
          isActive
            ? "text-primary bg-primary/8"
            : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
        }`}
      >
        Open Library
      </motion.span>
    </Link>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition.enter}
      className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur-2xl"
      style={{
        boxShadow:
          "0 1px 0 rgba(100,80,200,0.06), 0 4px 24px rgba(80,60,180,0.05)",
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
          data-testid="link-home"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={tap.press}
            transition={spring.soft}
            className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{
              background: PRIMARY_GRADIENT,
              boxShadow: "0 2px 10px hsl(248 70% 58% / 0.35)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white relative z-10" />
          </motion.div>
          <span className="font-bold text-[17px] tracking-tight text-foreground group-hover:opacity-80 transition-opacity duration-300">
            CarouselBrain
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
          <NavOpenLibraryLink />
          <NavLoginLink />
          <NavGetStartedButton />
        </nav>

        <div className="flex md:hidden items-center gap-1.5">
          <NavLoginLink className="px-2.5 text-[13px]" />
          <NavGetStartedButton className="!px-3.5 !py-2 text-[13px]" />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <motion.button
                type="button"
                whileHover={hover.subtle}
                whileTap={tap.press}
                transition={spring.snappy}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-300 border border-border/60 bg-white/50 backdrop-blur-sm"
                aria-label="Open menu"
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100vw-2rem,320px)] border-l border-white/50 p-0 gap-0 premium-panel"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: "rgba(120,100,220,0.1)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: PRIMARY_GRADIENT,
                      boxShadow: "0 2px 10px hsl(248 70% 58% / 0.3)",
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-foreground tracking-tight">
                    CarouselBrain
                  </span>
                </div>
              </div>

              <nav className="flex flex-col p-4 gap-1">
                <NavOpenLibraryLink
                  className="w-full text-left px-4 py-3 rounded-xl"
                  onNavigate={closeMenu}
                />
                <Link
                  href="/extract"
                  onClick={closeMenu}
                  className="text-sm font-medium px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors duration-300"
                >
                  Extract knowledge
                </Link>
                <Link
                  href="/result/demo"
                  onClick={closeMenu}
                  className="text-sm font-medium px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors duration-300"
                >
                  See example
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
