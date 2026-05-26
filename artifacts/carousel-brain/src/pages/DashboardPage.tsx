import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, Sparkles } from "lucide-react";
import { hover, spring, staggerContainer, staggerItem, tap } from "@/lib/motion";
import { getAllExtractions } from "@/lib/extractions";

const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Productivity: { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)", dot: "hsl(248 70% 58%)" },
  Psychology:   { bg: "hsl(340 75% 58% / 0.12)", text: "hsl(340 70% 46%)", dot: "hsl(340 75% 58%)" },
  Philosophy:   { bg: "hsl(270 65% 58% / 0.12)", text: "hsl(270 65% 44%)", dot: "hsl(270 65% 56%)" },
  Learning:     { bg: "hsl(200 70% 55% / 0.12)", text: "hsl(200 70% 40%)", dot: "hsl(200 70% 52%)" },
  Career:       { bg: "hsl(30 90% 58% / 0.12)",  text: "hsl(30 80% 42%)",  dot: "hsl(30 90% 56%)"  },
  Mindset:      { bg: "hsl(150 65% 50% / 0.12)", text: "hsl(150 65% 36%)", dot: "hsl(150 65% 48%)" },
  Systems:      { bg: "hsl(220 80% 62% / 0.12)", text: "hsl(220 75% 44%)", dot: "hsl(220 80% 60%)" },
  Growth:       { bg: "hsl(45 90% 54% / 0.12)",  text: "hsl(40 80% 38%)",  dot: "hsl(45 90% 52%)"  },
};

const CARD_ACCENTS = [
  "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))",
  "linear-gradient(135deg, hsl(200 70% 55%), hsl(220 75% 60%))",
  "linear-gradient(135deg, hsl(340 75% 58%), hsl(360 70% 62%))",
  "linear-gradient(135deg, hsl(270 65% 58%), hsl(290 60% 64%))",
  "linear-gradient(135deg, hsl(30 90% 58%), hsl(45 85% 62%))",
  "linear-gradient(135deg, hsl(150 65% 48%), hsl(170 60% 54%))",
  "linear-gradient(135deg, hsl(220 80% 60%), hsl(240 75% 64%))",
  "linear-gradient(135deg, hsl(310 60% 58%), hsl(330 65% 62%))",
];

const ALL_TAGS = ["All", "Productivity", "Psychology", "Philosophy", "Learning", "Career", "Mindset", "Systems", "Growth"];

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  uploading: "Uploading",
  processing: "Processing",
  analyzing: "Analyzing",
  structuring: "Structuring",
  complete: "Complete",
  failed: "Failed",
};

export default function DashboardPage() {
  const [activeTag, setActiveTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = getAllExtractions().filter(card => {
    const matchesTag = activeTag === "All" || card.tags.includes(activeTag);
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1.5">Your Library</h1>
            <p className="text-muted-foreground">All your extracted knowledge, neatly organized.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search extractions..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all"
                style={{ "--tw-ring-color": "hsl(248 70% 58% / 0.2)" } as React.CSSProperties}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Link
              href="/extract"
              className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              data-testid="button-new-extraction"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                boxShadow: "0 2px 12px hsl(248 70% 58% / 0.35)"
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Extraction</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/50 mr-1 shrink-0" />
          {ALL_TAGS.map(tag => (
            <motion.button
              key={tag}
              onClick={() => setActiveTag(tag)}
              data-testid={`filter-${tag.toLowerCase()}`}
              whileHover={hover.subtle}
              whileTap={tap.press}
              transition={spring.snappy}
              className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              style={
                activeTag === tag
                  ? {
                      background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                      color: "white",
                      boxShadow: "0 2px 10px hsl(248 70% 58% / 0.3)"
                    }
                  : {
                      background: "rgba(255,255,255,0.7)",
                      color: "hsl(240 8% 48%)",
                      border: "1px solid hsl(240 12% 89%)"
                    }
              }
            >
              {tag}
            </motion.button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filteredCards.length > 0 ? (
            <motion.div
              key="grid"
              variants={staggerContainer(0.05, 0.03)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCards.map((card, idx) => (
                <motion.div key={card.id} variants={staggerItem}>
                  <Link href={`/result/${card.id}`}>
                    <motion.div
                      whileHover={hover.card}
                      whileTap={tap.press}
                      transition={spring.soft}
                      data-testid={`card-extraction-${card.id}`}
                      className="group h-full rounded-3xl overflow-hidden cursor-pointer relative border border-white/60 premium-surface premium-surface-interactive"
                    >
                      {/* Color accent bar */}
                      <div className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
                        style={{ background: CARD_ACCENTS[idx % CARD_ACCENTS.length] }} />

                      <div className="p-6">
                        {/* Tags + status */}
                        <div className="flex items-start justify-between mb-4 gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {card.tags.map(tag => {
                              const colors = TAG_COLORS[tag] ?? TAG_COLORS.Productivity;
                              return (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                                  style={{ background: colors.bg, color: colors.text }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {STATUS_LABELS[card.status]}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[17px] font-bold leading-snug mb-2.5 transition-colors duration-200 group-hover:text-primary">
                          {card.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2">
                          {card.summary}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                          <span className="text-xs text-muted-foreground/60">{card.date}</span>
                          <motion.span
                            className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "hsl(248 70% 55%)" }}
                          >
                            Open <span className="text-base leading-none">→</span>
                          </motion.span>
                        </div>
                      </div>

                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ boxShadow: "inset 0 0 0 1px hsl(248 70% 58% / 0.15), 0 12px 40px hsl(248 70% 58% / 0.1)" }}
                      />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-36 text-center"
            >
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(248 70% 58% / 0.12), hsl(270 60% 62% / 0.08))",
                  border: "1px solid hsl(248 60% 58% / 0.15)"
                }}>
                <Sparkles className="w-9 h-9" style={{ color: "hsl(248 60% 60%)" }} />
              </div>
              <h3 className="text-xl font-bold mb-2">No extractions found</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">Try adjusting your filters or search query to find what you're looking for.</p>
              <button
                onClick={() => { setActiveTag("All"); setSearchQuery(""); }}
                className="text-sm font-semibold transition-colors"
                style={{ color: "hsl(248 70% 55%)" }}
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
