import { Link, useLocation } from "wouter";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" data-testid="link-home">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">CarouselBrain</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground'}`}
            data-testid="link-dashboard"
          >
            Open Library &rarr;
          </Link>
          <Link 
            href="/extract" 
            className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-sm"
            data-testid="link-extract"
          >
            Extract
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
