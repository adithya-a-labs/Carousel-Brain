import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, LayoutGrid } from "lucide-react";

// Mock Data
const MOCK_CARDS = [
  { id: "1", title: "Atomic Habits - The 1% Rule Explained", summary: "How small daily changes compound into massive results over time.", tags: ["Productivity", "Psychology"], date: "2 days ago", status: "Extracted" },
  { id: "2", title: "Mental Models for Clear Thinking", summary: "Core frameworks to make better decisions in complex situations.", tags: ["Philosophy", "Learning"], date: "4 days ago", status: "Extracted" },
  { id: "3", title: "The Art of Deep Work", summary: "Strategies to focus without distraction in a noisy world.", tags: ["Productivity", "Career"], date: "1 week ago", status: "Extracted" },
  { id: "4", title: "Stoic Philosophy: Daily Practices", summary: "Ancient wisdom applied to modern daily anxieties.", tags: ["Philosophy", "Mindset"], date: "2 weeks ago", status: "Extracted" },
  { id: "5", title: "Building a Second Brain - PARA Method", summary: "Organize your digital life for optimal creative output.", tags: ["Productivity", "Systems"], date: "1 month ago", status: "Extracted" },
  { id: "6", title: "How Compound Learning Works", summary: "The mathematics of consistent daily learning.", tags: ["Learning", "Growth"], date: "1 month ago", status: "Extracted" },
];

const ALL_TAGS = ["All", "Productivity", "Psychology", "Philosophy", "Learning", "Career", "Mindset", "Systems", "Growth"];

export default function DashboardPage() {
  const [activeTag, setActiveTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = MOCK_CARDS.filter(card => {
    const matchesTag = activeTag === "All" || card.tags.includes(activeTag);
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Your Library</h1>
            <p className="text-muted-foreground">All your extracted knowledge, neatly organized.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search extractions..." 
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Link 
              href="/extract"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
              data-testid="button-new-extraction"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Extraction</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          <Filter className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              data-testid={`filter-${tag.toLowerCase()}`}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${activeTag === tag 
                  ? 'bg-foreground text-background shadow-sm' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}
              `}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredCards.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCards.map((card) => (
              <motion.div key={card.id} variants={itemVariants}>
                <Link href={`/result/${card.id}`}>
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    data-testid={`card-extraction-${card.id}`}
                    className="group h-full bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer hover:border-primary/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-wrap gap-2">
                        {card.tags.map(tag => (
                          <span key={tag} className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md shrink-0">
                        {card.status}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-2">
                      {card.summary}
                    </p>
                    
                    <div className="text-xs text-muted-foreground/80 mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                      <span>{card.date}</span>
                      <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <LayoutGrid className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No extractions found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => { setActiveTag("All"); setSearchQuery(""); }}
              className="text-primary hover:underline font-medium"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
