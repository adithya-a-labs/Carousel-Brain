import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, BookmarkPlus, Link as LinkIcon, ChevronDown, ChevronUp, BookOpen, BrainCircuit, Target, ExternalLink, Layers } from "lucide-react";

const MOCK_DATA = {
  title: "Atomic Habits — The 1% Rule Explained",
  source: "Extracted from Instagram carousel",
  tags: ["Productivity", "Psychology"],
  overview: "The core thesis of Atomic Habits is that small, incremental daily changes—just 1% improvements—compound over time into massive transformations. People often overestimate the importance of a single defining moment and underestimate the value of making small improvements on a daily basis.",
  insights: [
    "Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them.",
    "Goals are about the results you want to achieve. Systems are about the processes that lead to those results. Focus on systems.",
    "True behavior change is identity change. You might start a habit because of motivation, but you'll only stick with it if it becomes part of your identity.",
    "The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become."
  ],
  actionSteps: [
    "Identify one tiny habit you can improve by 1% today.",
    "Audit your current daily system instead of setting a new distant goal.",
    "Reframe a current goal into an identity statement (e.g., 'I want to write a book' -> 'I am a writer').",
    "Design your environment to make good habits obvious and bad habits invisible."
  ],
  concepts: [
    { name: "Compound Interest of Habits", desc: "A 1% improvement every day for a year results in being 37 times better by the time you're done. Conversely, a 1% decline every day brings you down almost to zero." },
    { name: "The Plateau of Latent Potential", desc: "Habits often appear to make no difference until you cross a critical threshold and unlock a new level of performance. Work is not wasted; it is being stored." },
    { name: "Identity-Based Habits", desc: "The deepest layer of behavior change. Outcomes are what you get, processes are what you do, identity is what you believe." }
  ],
  resources: [
    { title: "Atomic Habits (Book)", type: "Book", link: "#" },
    { title: "Habit Tracker Template", type: "Template", link: "#" },
    { title: "James Clear's Newsletter", type: "Newsletter", link: "#" }
  ],
  path: [
    { stage: "Beginner", desc: "Focuses on setting goals and trying to force behavior change through sheer willpower and motivation." },
    { stage: "Practitioner", desc: "Shifts focus to building systems and designing environments to make habits easier to execute." },
    { stage: "Expert", desc: "Internalizes habits as identity. 'I am the type of person who does this.' Execution becomes automatic." }
  ]
};

// Accordion Item Component
const ConceptAccordion = ({ concept }: { concept: {name: string, desc: string} }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-border rounded-xl mb-3 overflow-hidden bg-card transition-colors hover:border-primary/30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left font-medium"
      >
        <span>{concept.name}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t border-border/50 bg-muted/10">
              {concept.desc}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ResultPage() {
  const [activeSection, setActiveSection] = useState("overview");

  // Simple scroll spy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "insights", "actions", "concepts", "resources", "path"];
      let current = sections[0];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && window.scrollY >= (element.offsetTop - 150)) {
          current = section;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Top Action Bar */}
      <div className="sticky top-16 z-40 bg-card/80 backdrop-blur-md border-b border-border py-3">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm hidden sm:inline">{MOCK_DATA.source}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground" data-testid="button-copy-link" title="Copy Link">
              <LinkIcon className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground" data-testid="button-share" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm" data-testid="button-save">
              <BookmarkPlus className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 relative flex">
        
        {/* Main Content */}
        <div className="w-full lg:w-3/4 max-w-3xl mx-auto lg:mx-0 lg:pr-16">
          
          {/* Header */}
          <header className="mb-16">
            <div className="flex gap-2 mb-6">
              {MOCK_DATA.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
              {MOCK_DATA.title}
            </h1>
          </header>

          <div className="space-y-20">
            {/* Overview */}
            <motion.section id="overview" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="prose prose-lg dark:prose-invert">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6 pb-2 border-b border-border">
                <BookOpen className="w-6 h-6 text-primary" /> Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {MOCK_DATA.overview}
              </p>
            </motion.section>

            {/* Key Insights */}
            <motion.section id="insights" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6 pb-2 border-b border-border">
                <BrainCircuit className="w-6 h-6 text-primary" /> Key Insights
              </h2>
              <ul className="space-y-4">
                {MOCK_DATA.insights.map((insight, idx) => (
                  <li key={idx} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-foreground/90 leading-relaxed">{insight}</p>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Action Steps */}
            <motion.section id="actions" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6 pb-2 border-b border-border">
                <Target className="w-6 h-6 text-primary" /> Action Steps
              </h2>
              <div className="grid gap-4">
                {MOCK_DATA.actionSteps.map((step, idx) => (
                  <label key={idx} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card shadow-sm cursor-pointer hover:border-primary/40 transition-colors group">
                    <div className="mt-1 relative flex items-center justify-center">
                      <input type="checkbox" className="w-5 h-5 rounded border-muted-foreground text-primary focus:ring-primary peer appearance-none checked:bg-primary checked:border-primary transition-all bg-muted/50 border" />
                      <div className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-primary-foreground">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M2 7.5L5 10.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                    <span className="text-lg group-hover:text-foreground text-foreground/90 transition-colors select-none">
                      {step}
                    </span>
                  </label>
                ))}
              </div>
            </motion.section>

            {/* Concepts */}
            <motion.section id="concepts" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6 pb-2 border-b border-border">
                <Layers className="w-6 h-6 text-primary" /> Concepts Explained
              </h2>
              <div>
                {MOCK_DATA.concepts.map((concept, idx) => (
                  <ConceptAccordion key={idx} concept={concept} />
                ))}
              </div>
            </motion.section>

            {/* Path */}
            <motion.section id="path" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <h2 className="text-2xl font-semibold mb-8 pb-2 border-b border-border">
                Learning Path
              </h2>
              <div className="relative pl-6 space-y-12 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-primary/30 before:to-transparent">
                {MOCK_DATA.path.map((stage, idx) => (
                  <div key={idx} className="relative flex items-start">
                    <div className="absolute left-[-30px] w-4 h-4 rounded-full bg-background border-2 border-primary mt-1.5 shadow-sm" />
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">{stage.stage}</h4>
                      <p className="text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">{stage.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Resources */}
            <motion.section id="resources" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="pb-32">
              <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-border">
                Resources & Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_DATA.resources.map((res, idx) => (
                  <a key={idx} href={res.link} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group">
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-primary transition-colors">{res.title}</span>
                      <span className="text-xs text-muted-foreground mt-1">{res.type}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </motion.section>
            
          </div>
        </div>

        {/* Floating TOC (Desktop Only) */}
        <div className="hidden lg:block w-1/4 sticky top-32 h-max shrink-0 pl-8">
          <div className="p-6 rounded-2xl bg-muted/20 border border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">On this page</h3>
            <nav className="space-y-3">
              {[
                { id: "overview", label: "Overview" },
                { id: "insights", label: "Key Insights" },
                { id: "actions", label: "Action Steps" },
                { id: "concepts", label: "Concepts Explained" },
                { id: "path", label: "Learning Path" },
                { id: "resources", label: "Resources & Tools" },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`block text-sm text-left transition-colors relative pl-4 ${activeSection === item.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground/80"}`}
                >
                  {activeSection === item.id && (
                    <motion.div 
                      layoutId="toc-indicator"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r"
                    />
                  )}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

      </main>
    </div>
  );
}
