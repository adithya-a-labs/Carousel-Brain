import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, BookmarkPlus, Link as LinkIcon, ChevronDown, BookOpen, BrainCircuit, Target, ExternalLink, Layers, Zap, GraduationCap } from "lucide-react";

const MOCK_DATA = {
  title: "Atomic Habits — The 1% Rule Explained",
  source: "Extracted from Instagram carousel",
  tags: ["Productivity", "Psychology"],
  overview: "The core thesis of Atomic Habits is that small, incremental daily changes — just 1% improvements — compound over time into massive transformations. People often overestimate the importance of a single defining moment and underestimate the value of making small improvements on a daily basis.",
  insights: [
    "Habits are the compound interest of self-improvement. The same way money multiplies through compound interest, the effects of your habits multiply as you repeat them.",
    "Goals are about the results you want to achieve. Systems are about the processes that lead to those results. Focus on building better systems.",
    "True behavior change is identity change. You might start a habit because of motivation, but you'll only stick with it if it becomes part of your identity.",
    "The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.",
  ],
  actionSteps: [
    "Identify one tiny habit you can improve by 1% today.",
    "Audit your current daily system instead of setting a new distant goal.",
    "Reframe a current goal into an identity statement: 'I am a writer' not 'I want to write a book'.",
    "Design your environment to make good habits obvious and bad habits invisible.",
  ],
  concepts: [
    { name: "Compound Interest of Habits", desc: "A 1% improvement every day for a year results in being 37 times better by the time you're done. Conversely, a 1% decline every day brings you down almost to zero. Small choices accumulate." },
    { name: "The Plateau of Latent Potential", desc: "Habits often appear to make no difference until you cross a critical threshold and unlock a new level of performance. Work is not wasted — it is being stored." },
    { name: "Identity-Based Habits", desc: "The deepest layer of behavior change. Outcomes are what you get, processes are what you do, identity is what you believe. Start with who you wish to become." },
  ],
  resources: [
    { title: "Atomic Habits", type: "Book", color: "hsl(248 70% 58%)", colorBg: "hsl(248 70% 58% / 0.08)", link: "#" },
    { title: "Habit Tracker Template", type: "Template", color: "hsl(200 70% 50%)", colorBg: "hsl(200 70% 50% / 0.08)", link: "#" },
    { title: "James Clear's Newsletter", type: "Newsletter", color: "hsl(270 65% 55%)", colorBg: "hsl(270 65% 55% / 0.08)", link: "#" },
    { title: "3-2-1 Thursday", type: "Newsletter", color: "hsl(30 90% 55%)", colorBg: "hsl(30 90% 55% / 0.08)", link: "#" },
  ],
  path: [
    {
      stage: "Beginner",
      desc: "Focuses on setting goals and trying to force behavior change through sheer willpower and motivation.",
      color: "hsl(200 70% 55%)",
      bg: "hsl(200 70% 55% / 0.08)",
      border: "hsl(200 70% 55% / 0.2)",
    },
    {
      stage: "Practitioner",
      desc: "Shifts focus to building systems and designing environments to make habits easier to execute.",
      color: "hsl(248 70% 58%)",
      bg: "hsl(248 70% 58% / 0.08)",
      border: "hsl(248 70% 58% / 0.2)",
    },
    {
      stage: "Expert",
      desc: "Internalizes habits as identity. 'I am the type of person who does this.' Execution becomes automatic.",
      color: "hsl(270 65% 55%)",
      bg: "hsl(270 65% 55% / 0.08)",
      border: "hsl(270 65% 55% / 0.2)",
    },
  ],
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Productivity: { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)" },
  Psychology:   { bg: "hsl(340 75% 58% / 0.12)", text: "hsl(340 70% 46%)" },
};

const ConceptAccordion = ({ concept }: { concept: { name: string; desc: string } }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="rounded-2xl mb-3 overflow-hidden border transition-all duration-200"
      style={{
        borderColor: isOpen ? "hsl(248 70% 58% / 0.25)" : "hsl(240 12% 90%)",
        background: isOpen ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
        boxShadow: isOpen ? "0 4px 20px hsl(248 70% 58% / 0.08)" : "none"
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold group"
      >
        <span className={`transition-colors ${isOpen ? "" : "text-foreground/80 group-hover:text-foreground"}`}>
          {concept.name}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 ml-4"
          style={{ color: isOpen ? "hsl(248 70% 55%)" : "hsl(240 8% 60%)" }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-muted-foreground leading-relaxed border-t border-border/40 pt-4"
              style={{ background: "linear-gradient(180deg, hsl(248 60% 58% / 0.03), transparent)" }}>
              {concept.desc}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const TOC_ITEMS = [
  { id: "overview",   label: "Overview",          icon: BookOpen },
  { id: "insights",   label: "Key Insights",       icon: BrainCircuit },
  { id: "actions",    label: "Action Steps",       icon: Target },
  { id: "concepts",   label: "Concepts Explained", icon: Layers },
  { id: "path",       label: "Learning Path",      icon: GraduationCap },
  { id: "resources",  label: "Resources & Tools",  icon: ExternalLink },
];

export default function ResultPage() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      let current = TOC_ITEMS[0].id;
      for (const { id } of TOC_ITEMS) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 160) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 110, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground mesh-bg">
      <Navbar />

      {/* Sticky action bar */}
      <div className="sticky top-16 z-40 border-b border-white/50 backdrop-blur-2xl"
        style={{ background: "rgba(255,255,255,0.75)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(248 70% 58% / 0.15), hsl(270 60% 62% / 0.1))" }}>
              <BrainCircuit className="w-4 h-4" style={{ color: "hsl(248 70% 55%)" }} />
            </div>
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">{MOCK_DATA.source}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
              data-testid="button-copy-link"
              title="Copy Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
              data-testid="button-share"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <motion.button
              whileHover={{ scale: 1.04, y: -0.5 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 text-white px-4 py-1.5 rounded-xl text-sm font-semibold shadow-sm"
              data-testid="button-save"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                boxShadow: "0 2px 8px hsl(248 70% 58% / 0.3)"
              }}
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Save
            </motion.button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 flex gap-16">

        {/* Main content */}
        <div className="flex-1 min-w-0 max-w-2xl">

          {/* Header */}
          <header className="mb-14">
            <div className="flex flex-wrap gap-2 mb-5">
              {MOCK_DATA.tags.map(tag => {
                const c = TAG_COLORS[tag] ?? { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)" };
                return (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ background: c.bg, color: c.text }}>
                    {tag}
                  </span>
                );
              })}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.12] tracking-tight mb-4">
              {MOCK_DATA.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
              <Zap className="w-3.5 h-3.5" style={{ color: "hsl(248 70% 60%)" }} />
              {MOCK_DATA.source}
            </div>
          </header>

          {/* Gradient separator */}
          <div className="h-px w-full mb-14 rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(248 70% 58% / 0.3), hsl(270 60% 62% / 0.2), transparent)" }} />

          <div className="space-y-20">

            {/* Overview */}
            <motion.section id="overview" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <SectionHeading icon={BookOpen} label="Overview" gradient="linear-gradient(135deg, hsl(248 70% 58%), hsl(260 65% 62%))" />
              <p className="text-[17px] text-foreground/80 leading-[1.85]">
                {MOCK_DATA.overview}
              </p>
            </motion.section>

            {/* Key Insights */}
            <motion.section id="insights" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <SectionHeading icon={BrainCircuit} label="Key Insights" gradient="linear-gradient(135deg, hsl(270 65% 58%), hsl(290 60% 64%))" />
              <ul className="space-y-3">
                {MOCK_DATA.insights.map((insight, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4 p-5 rounded-2xl border"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      borderColor: "hsl(248 40% 90%)",
                      boxShadow: "0 2px 10px rgba(80,60,180,0.04)"
                    }}
                  >
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
                      style={{ background: `linear-gradient(135deg, hsl(${248 + idx * 8} 70% 58%), hsl(${270 + idx * 8} 65% 62%))` }}>
                      {idx + 1}
                    </div>
                    <p className="text-foreground/85 leading-relaxed">{insight}</p>
                  </motion.li>
                ))}
              </ul>
            </motion.section>

            {/* Action Steps */}
            <motion.section id="actions" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <SectionHeading icon={Target} label="Action Steps" gradient="linear-gradient(135deg, hsl(200 70% 55%), hsl(220 75% 60%))" />
              <div className="grid gap-3">
                {MOCK_DATA.actionSteps.map((step, idx) => (
                  <motion.label
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.07 }}
                    whileHover={{ scale: 1.005 }}
                    className="flex items-start gap-4 p-5 rounded-2xl border cursor-pointer group transition-all"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      borderColor: "hsl(240 12% 90%)"
                    }}
                  >
                    <div className="mt-0.5 relative shrink-0 flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-md appearance-none border-2 border-border checked:border-primary transition-all cursor-pointer"
                        style={{}}
                      />
                      <div className="absolute pointer-events-none">
                        <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7.5L5 10.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-base text-foreground/85 group-hover:text-foreground transition-colors leading-relaxed">
                      {step}
                    </span>
                  </motion.label>
                ))}
              </div>
            </motion.section>

            {/* Concepts */}
            <motion.section id="concepts" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <SectionHeading icon={Layers} label="Concepts Explained" gradient="linear-gradient(135deg, hsl(340 75% 58%), hsl(360 70% 62%))" />
              <div>
                {MOCK_DATA.concepts.map((concept, idx) => (
                  <ConceptAccordion key={idx} concept={concept} />
                ))}
              </div>
            </motion.section>

            {/* Learning Path */}
            <motion.section id="path" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <SectionHeading icon={GraduationCap} label="Learning Path" gradient="linear-gradient(135deg, hsl(30 90% 55%), hsl(45 85% 60%))" />
              <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute left-3 top-4 bottom-4 w-0.5 rounded-full"
                  style={{ background: "linear-gradient(180deg, hsl(200 70% 55%), hsl(248 70% 58%), hsl(270 65% 55%))" }} />

                <div className="space-y-8">
                  {MOCK_DATA.path.map((stage, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="relative"
                    >
                      {/* Node */}
                      <div
                        className="absolute left-[-29px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md mt-3"
                        style={{
                          background: stage.color,
                          boxShadow: `0 0 0 3px ${stage.border}, 0 4px 10px ${stage.color}40`
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white/60" />
                      </div>

                      <div className="p-5 rounded-2xl border"
                        style={{ background: stage.bg, borderColor: stage.border }}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: stage.color }}>
                          {stage.stage}
                        </div>
                        <p className="text-foreground/80 leading-relaxed">{stage.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Resources */}
            <motion.section id="resources" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="pb-32">
              <SectionHeading icon={ExternalLink} label="Resources & Tools" gradient="linear-gradient(135deg, hsl(150 65% 48%), hsl(170 60% 54%))" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_DATA.resources.map((res, idx) => (
                  <motion.a
                    key={idx}
                    href={res.link}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center justify-between p-5 rounded-2xl border transition-all"
                    style={{
                      background: res.colorBg,
                      borderColor: `${res.color}30`,
                      boxShadow: "0 2px 10px rgba(80,60,180,0.04)"
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">{res.title}</span>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: res.color }}>{res.type}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center ml-3 shrink-0"
                      style={{ background: `${res.color}18`, color: res.color }}>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.section>

          </div>
        </div>

        {/* Floating TOC */}
        <div className="hidden lg:block w-52 shrink-0 sticky top-36 h-max">
          <div className="p-5 rounded-2xl border"
            style={{
              background: "rgba(255,255,255,0.75)",
              borderColor: "hsl(248 40% 90%)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(80,60,180,0.06)"
            }}>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">On this page</div>
            <nav className="space-y-1">
              {TOC_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all relative"
                  style={
                    activeSection === item.id
                      ? { background: "hsl(248 70% 58% / 0.1)", color: "hsl(248 70% 50%)" }
                      : { color: "hsl(240 8% 55%)" }
                  }
                >
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="toc-indicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                      style={{ background: "linear-gradient(180deg, hsl(248 70% 58%), hsl(270 60% 62%))" }}
                    />
                  )}
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className={activeSection === item.id ? "font-semibold" : ""}>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

      </main>
    </div>
  );
}

function SectionHeading({ icon: Icon, label, gradient }: { icon: React.ElementType; label: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3 mb-7 pb-3 border-b border-border/50">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
        style={{ background: gradient, boxShadow: "0 3px 10px rgba(80,60,180,0.2)" }}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <h2 className="text-2xl font-bold">{label}</h2>
    </div>
  );
}
