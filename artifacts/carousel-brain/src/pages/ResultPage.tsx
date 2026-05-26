import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  hover,
  listItemReveal,
  scrollViewportDeep,
  sectionReveal,
  spring,
  tap,
  transition,
} from "@/lib/motion";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import {
  Share2, BookmarkPlus, Link as LinkIcon, ChevronDown,
  BookOpen, BrainCircuit, Target, ExternalLink, Layers, Zap,
  GraduationCap, Images, X, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";

// ─── Mock carousel slides ───────────────────────────────────────────────────

const MOCK_SLIDES = [
  {
    id: 1,
    gradient: "linear-gradient(145deg, hsl(248 70% 42%), hsl(270 65% 52%))",
    accent: "rgba(255,255,255,0.15)",
    heading: "The 1% Rule",
    lines: [3, 4, 2],
    caption: "Small daily improvements compound into remarkable results.",
  },
  {
    id: 2,
    gradient: "linear-gradient(145deg, hsl(200 70% 38%), hsl(220 70% 50%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Compound Interest",
    lines: [4, 3, 3],
    caption: "37× better in one year — the math of consistent habits.",
  },
  {
    id: 3,
    gradient: "linear-gradient(145deg, hsl(270 60% 40%), hsl(300 55% 52%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Identity Change",
    lines: [3, 4, 2],
    caption: "The deepest layer of lasting behavior change.",
  },
  {
    id: 4,
    gradient: "linear-gradient(145deg, hsl(160 55% 32%), hsl(190 60% 44%))",
    accent: "rgba(255,255,255,0.14)",
    heading: "Systems vs Goals",
    lines: [4, 3, 3],
    caption: "Winners and losers have the same goals. Focus on systems.",
  },
  {
    id: 5,
    gradient: "linear-gradient(145deg, hsl(30 80% 40%), hsl(45 75% 52%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Environment Design",
    lines: [3, 3, 4],
    caption: "Your environment shapes your habits more than willpower.",
  },
  {
    id: 6,
    gradient: "linear-gradient(145deg, hsl(340 65% 40%), hsl(360 60% 52%))",
    accent: "rgba(255,255,255,0.13)",
    heading: "Two-Minute Rule",
    lines: [4, 2, 3],
    caption: "Make it so easy you can't say no. Start impossibly small.",
  },
  {
    id: 7,
    gradient: "linear-gradient(145deg, hsl(220 65% 38%), hsl(240 65% 52%))",
    accent: "rgba(255,255,255,0.14)",
    heading: "Habit Stacking",
    lines: [3, 4, 2],
    caption: "Attach new habits to existing anchors in your routine.",
  },
  {
    id: 8,
    gradient: "linear-gradient(145deg, hsl(280 55% 38%), hsl(310 55% 52%))",
    accent: "rgba(255,255,255,0.12)",
    heading: "Never Miss Twice",
    lines: [2, 4, 3],
    caption: "Missing once is an accident. Missing twice is a new habit.",
  },
];

// ─── Mock knowledge data ─────────────────────────────────────────────────────

const MOCK_DATA = {
  title: "Atomic Habits — The 1% Rule Explained",
  source: "Extracted from Instagram carousel",
  tags: ["Productivity", "Psychology"],
  overview:
    "The core thesis of Atomic Habits is that small, incremental daily changes — just 1% improvements — compound over time into massive transformations. People often overestimate the importance of a single defining moment and underestimate the value of making small improvements on a daily basis.",
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
    { stage: "Beginner", desc: "Focuses on setting goals and trying to force behavior change through sheer willpower and motivation.", color: "hsl(200 70% 55%)", bg: "hsl(200 70% 55% / 0.08)", border: "hsl(200 70% 55% / 0.2)" },
    { stage: "Practitioner", desc: "Shifts focus to building systems and designing environments to make habits easier to execute.", color: "hsl(248 70% 58%)", bg: "hsl(248 70% 58% / 0.08)", border: "hsl(248 70% 58% / 0.2)" },
    { stage: "Expert", desc: "Internalizes habits as identity. 'I am the type of person who does this.' Execution becomes automatic.", color: "hsl(270 65% 55%)", bg: "hsl(270 65% 55% / 0.08)", border: "hsl(270 65% 55% / 0.2)" },
  ],
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Productivity: { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)" },
  Psychology: { bg: "hsl(340 75% 58% / 0.12)", text: "hsl(340 70% 46%)" },
};

// ─── Slide thumbnail ─────────────────────────────────────────────────────────

function SlideThumbnail({
  slide,
  isActive,
  onClick,
  size = "md",
}: {
  slide: typeof MOCK_SLIDES[0];
  isActive?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const isSmall = size === "sm";
  return (
    <motion.button
      onClick={onClick}
      whileHover={hover.card}
      whileTap={tap.press}
      transition={spring.soft}
      className="relative rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
      style={{
        width: isSmall ? 80 : 112,
        height: isSmall ? 100 : 140,
        background: slide.gradient,
        boxShadow: isActive
          ? "0 0 0 2px hsl(248 70% 62%), 0 8px 24px rgba(80,60,180,0.3)"
          : "0 3px 12px rgba(0,0,0,0.18)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Glass overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />

      {/* Active glow ring */}
      {isActive && (
        <motion.div
          layoutId="active-slide-ring"
          className="absolute inset-0 rounded-xl"
          style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.5)" }}
        />
      )}

      {/* Mock content inside slide */}
      <div className="absolute inset-0 p-2 flex flex-col justify-between">
        {/* Slide number badge */}
        <div className="self-start">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.9)" }}
          >
            {slide.id}/{MOCK_SLIDES.length}
          </span>
        </div>

        {/* Mock text lines */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.7)" }} />
          {slide.lines.slice(0, 2).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full"
              style={{
                width: `${55 + i * 12}%`,
                background: "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Hover: caption tooltip */}
      <div
        className="absolute inset-x-0 bottom-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
      >
        <p className="text-[9px] text-white/90 leading-tight font-medium line-clamp-2">
          {slide.heading}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Carousel modal / lightbox ────────────────────────────────────────────────

function CarouselModal({
  initialIndex,
  onClose,
}: {
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const slide = MOCK_SLIDES[idx];

  const prev = () => setIdx((i) => (i - 1 + MOCK_SLIDES.length) % MOCK_SLIDES.length);
  const next = () => setIdx((i) => (i + 1) % MOCK_SLIDES.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition.enter}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ background: "rgba(10,8,24,0.82)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      {/* Card */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={spring.soft}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg"
      >
        {/* The slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={transition.enter}
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: slide.gradient,
              aspectRatio: "4/5",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Ambient inner glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)" }}
            />

            {/* Mock slide content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.85)" }}
                >
                  Slide {slide.id} of {MOCK_SLIDES.length}
                </span>
                <div className="flex gap-1">
                  {MOCK_SLIDES.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === idx ? 16 : 5,
                        height: 5,
                        background: i === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Main content mock */}
              <div className="space-y-5">
                <div>
                  <div className="h-4 rounded-lg w-1/2 mb-3" style={{ background: "rgba(255,255,255,0.9)" }} />
                  <div className="space-y-2">
                    {slide.lines.map((_, i) => (
                      <div
                        key={i}
                        className="h-2.5 rounded"
                        style={{
                          width: `${100 - i * 12}%`,
                          background: "rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)" }}
                >
                  <p className="text-white/90 text-sm font-medium leading-relaxed">
                    {slide.caption}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav controls */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none px-3">
          <motion.button
            whileHover={hover.subtle}
            whileTap={tap.press}
            transition={spring.snappy}
            onClick={prev}
            className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={hover.subtle}
            whileTap={tap.press}
            transition={spring.snappy}
            onClick={next}
            className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Caption below */}
        <div className="mt-4 text-center">
          <p className="text-white/50 text-sm">Press ← → to navigate · Esc to close</p>
        </div>
      </motion.div>

      {/* Close button */}
      <motion.button
        whileHover={hover.subtle}
        whileTap={tap.press}
        transition={spring.snappy}
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <X className="w-5 h-5 text-white/80" />
      </motion.button>
    </motion.div>
  );
}

// ─── Desktop carousel sidebar panel ──────────────────────────────────────────

function CarouselSidePanel({
  isOpen,
  onClose,
  onSlideClick,
  activeSlide,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSlideClick: (idx: number) => void;
  activeSlide: number;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.97 }}
          transition={spring.layout}
          className="hidden lg:flex flex-col w-[148px] shrink-0 sticky top-36 h-max"
        >
          {/* Panel */}
          <div
            className="rounded-2xl overflow-hidden premium-panel"
          >
            {/* Header */}
            <div
              className="px-3 py-2.5 flex items-center justify-between border-b"
              style={{ borderColor: "rgba(120,100,220,0.1)" }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))" }}
                >
                  <Images className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Source</span>
              </div>
              <button
                onClick={onClose}
                className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* AI badge */}
            <div className="px-3 pt-3 pb-2">
              <div
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                style={{ background: "linear-gradient(135deg, hsl(248 70% 58% / 0.1), hsl(270 60% 62% / 0.06))" }}
              >
                <Sparkles className="w-3 h-3 shrink-0" style={{ color: "hsl(248 70% 55%)" }} />
                <p className="text-[10px] leading-tight" style={{ color: "hsl(248 60% 50%)" }}>
                  AI extracted from {MOCK_SLIDES.length} slides
                </p>
              </div>
            </div>

            {/* Slides list */}
            <div className="px-2 pb-3 space-y-2 max-h-[520px] overflow-y-auto no-scrollbar">
              {MOCK_SLIDES.map((slide, i) => (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <SlideThumbnail
                    slide={slide}
                    isActive={activeSlide === i}
                    onClick={() => onSlideClick(i)}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile carousel strip ────────────────────────────────────────────────────

function MobileCarouselStrip({ onSlideClick }: { onSlideClick: (idx: number) => void }) {
  return (
    <div className="lg:hidden mb-8 -mx-4">
      {/* Strip header */}
      <div className="px-4 mb-3 flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))" }}
        >
          <Images className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground/70">Source Carousel</span>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full ml-auto"
          style={{ background: "hsl(248 70% 58% / 0.1)" }}
        >
          <Sparkles className="w-3 h-3" style={{ color: "hsl(248 70% 55%)" }} />
          <span className="text-[10px] font-semibold" style={{ color: "hsl(248 70% 50%)" }}>
            AI extracted
          </span>
        </div>
      </div>

      {/* Scrollable strip */}
      <div className="relative">
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, hsl(240 20% 98%), transparent)" }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, hsl(240 20% 98%), transparent)" }}
        />

        <div className="flex gap-3 overflow-x-auto px-4 pb-3 no-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
          {MOCK_SLIDES.map((slide, i) => (
            <div key={slide.id} style={{ scrollSnapAlign: "start" }}>
              <SlideThumbnail
                slide={slide}
                isActive={false}
                onClick={() => onSlideClick(i)}
                size="md"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Supporting components ────────────────────────────────────────────────────

const ConceptAccordion = ({ concept }: { concept: { name: string; desc: string } }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      whileHover={isOpen ? undefined : hover.lift}
      transition={spring.soft}
      className={`rounded-2xl mb-3 overflow-hidden border premium-surface ${!isOpen ? "premium-surface-interactive" : ""}`}
      style={{
        borderColor: isOpen ? "hsl(248 70% 58% / 0.25)" : "hsl(240 12% 90%)",
        background: isOpen ? "rgba(255,255,255,0.95)" : undefined,
        boxShadow: isOpen ? "0 4px 20px hsl(248 70% 58% / 0.08)" : undefined,
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
          transition={transition.enter}
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
            transition={transition.enter}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5 text-muted-foreground leading-relaxed border-t border-border/40 pt-4"
              style={{ background: "linear-gradient(180deg, hsl(248 60% 58% / 0.03), transparent)" }}
            >
              {concept.desc}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function SectionHeading({
  icon: Icon,
  label,
  gradient,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  gradient: string;
  isActive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-7 pb-3 border-b border-border/50">
      <motion.div
        animate={
          isActive
            ? { boxShadow: "0 4px 18px rgba(80,60,180,0.28)" }
            : { boxShadow: "0 3px 10px rgba(80,60,180,0.2)" }
        }
        transition={spring.soft}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
        style={{ background: gradient }}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <h2 className="text-2xl font-bold">{label}</h2>
    </div>
  );
}

const TOC_ITEMS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "insights", label: "Key Insights", icon: BrainCircuit },
  { id: "actions", label: "Action Steps", icon: Target },
  { id: "concepts", label: "Concepts Explained", icon: Layers },
  { id: "path", label: "Learning Path", icon: GraduationCap },
  { id: "resources", label: "Resources & Tools", icon: ExternalLink },
] as const;

const TOC_IDS = TOC_ITEMS.map((item) => item.id);

function ReadingProgressBar({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/[0.04] overflow-hidden">
      <motion.div
        className="h-full"
        style={{
          transformOrigin: "left",
          background:
            "linear-gradient(90deg, hsl(248 70% 58%), hsl(270 65% 62%), hsl(220 80% 62%))",
        }}
        animate={{ scaleX: progress }}
        initial={false}
        transition={spring.soft}
      />
    </div>
  );
}

function ScrollSection({
  id,
  activeSection,
  children,
  className = "",
}: {
  id: string;
  activeSection: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = activeSection === id;

  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={scrollViewportDeep}
      variants={sectionReveal}
      className={`relative scroll-mt-36 ${className}`}
    >
      {isActive && (
        <motion.div
          layoutId="reading-accent"
          className="absolute -left-5 md:-left-6 top-1 bottom-1 w-[3px] rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, hsl(248 70% 58%), hsl(270 65% 55%), hsl(248 70% 58% / 0.2))",
            boxShadow: "0 0 12px hsl(248 70% 58% / 0.35)",
          }}
          transition={spring.layout}
        />
      )}
      {children}
    </motion.section>
  );
}

function ResultToc({
  activeSection,
  activeIndex,
  progress,
  onNavigate,
}: {
  activeSection: string;
  activeIndex: number;
  progress: number;
  onNavigate: (id: string) => void;
}) {
  const trackFill =
    TOC_ITEMS.length > 1 ? activeIndex / (TOC_ITEMS.length - 1) : 0;

  return (
    <div className="hidden lg:block w-48 shrink-0 sticky top-36 h-max">
      <div className="p-5 rounded-2xl border premium-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
            On this page
          </div>
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.snappy}
            className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
            style={{
              background: "hsl(248 70% 58% / 0.1)",
              color: "hsl(248 70% 50%)",
            }}
          >
            {activeIndex + 1}/{TOC_ITEMS.length}
          </motion.span>
        </div>

        {/* Journey track */}
        <div className="relative mb-1 pl-1">
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px rounded-full"
            style={{ background: "hsl(240 12% 90%)" }}
          />
          <motion.div
            className="absolute left-[15px] top-2 w-px rounded-full origin-top"
            style={{
              height: `${trackFill * 100}%`,
              background:
                "linear-gradient(180deg, hsl(248 70% 58%), hsl(270 65% 55%))",
              boxShadow: "0 0 8px hsl(248 70% 58% / 0.25)",
            }}
            transition={spring.soft}
          />

          <nav className="space-y-0.5 relative">
            {TOC_ITEMS.map((item, index) => {
              const isActive = activeSection === item.id;
              const isPast = index < activeIndex;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  whileHover={!isActive ? { x: 2 } : {}}
                  whileTap={tap.press}
                  transition={spring.snappy}
                  className="w-full flex items-center gap-2.5 pl-1 pr-3 py-2 rounded-xl text-sm text-left transition-colors duration-300 relative"
                  style={
                    isActive
                      ? {
                          background: "hsl(248 70% 58% / 0.1)",
                          color: "hsl(248 70% 50%)",
                        }
                      : isPast
                        ? { color: "hsl(240 8% 62%)" }
                        : { color: "hsl(240 8% 55%)" }
                  }
                >
                  <span
                    className="relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold transition-all duration-300"
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))",
                            color: "white",
                            boxShadow: "0 0 0 3px hsl(248 70% 58% / 0.15)",
                          }
                        : isPast
                          ? {
                              background: "hsl(248 70% 58% / 0.15)",
                              color: "hsl(248 70% 50%)",
                            }
                          : {
                              background: "rgba(255,255,255,0.9)",
                              border: "1px solid hsl(240 12% 88%)",
                              color: "hsl(240 8% 55%)",
                            }
                    }
                  >
                    {index + 1}
                  </span>
                  <item.icon
                    className="w-3.5 h-3.5 shrink-0 transition-opacity duration-300"
                    style={{ opacity: isActive ? 1 : isPast ? 0.55 : 0.7 }}
                  />
                  <span
                    className={
                      isActive ? "font-semibold" : isPast ? "font-medium" : ""
                    }
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Mini progress */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 mb-1.5">
            <span>Reading progress</span>
            <span className="tabular-nums font-medium">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-black/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                transformOrigin: "left",
                background:
                  "linear-gradient(90deg, hsl(248 70% 58%), hsl(270 65% 62%))",
              }}
              animate={{ scaleX: progress }}
              initial={false}
              transition={spring.soft}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileReadingPill({
  activeIndex,
  progress,
  label,
}: {
  activeIndex: number;
  progress: number;
  label: string;
}) {
  const visible = progress > 0.04 && progress < 0.98;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={spring.soft}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div
            className="flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full premium-panel border border-white/60"
            style={{ boxShadow: "0 8px 32px rgba(80,60,180,0.12)" }}
          >
            <div className="relative w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="hsl(240 12% 90%)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="16"
                  cy="16"
                  r="13"
                  fill="none"
                  stroke="url(#pill-gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 13}
                  style={{ strokeDashoffset: 2 * Math.PI * 13 * (1 - progress) }}
                  transition={spring.soft}
                />
                <defs>
                  <linearGradient id="pill-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(248 70% 58%)" />
                    <stop offset="100%" stopColor="hsl(270 65% 62%)" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-primary">
                {activeIndex + 1}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                Section {activeIndex + 1} of {TOC_ITEMS.length}
              </p>
              <p className="text-sm font-medium text-foreground/85 truncate max-w-[200px]">
                {label}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResultPage() {
  const { activeSection, activeIndex, progress, contentRef } =
    useReadingProgress(TOC_IDS);
  const [carouselOpen, setCarouselOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlide, setModalSlide] = useState(0);
  const [activeSlideSidebar, setActiveSlideSidebar] = useState(0);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 120, 280], [1, 1, 0.72]);
  const headerY = useTransform(scrollY, [0, 280], [0, -8]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 132, behavior: "smooth" });
  };

  const activeTocItem = TOC_ITEMS[activeIndex] ?? TOC_ITEMS[0];

  const openModal = (idx: number) => {
    setModalSlide(idx);
    setActiveSlideSidebar(idx);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <Navbar />

      {/* ── Sticky action bar ── */}
      <div className="sticky top-16 z-40 border-b border-white/50 backdrop-blur-2xl premium-panel relative">
        <ReadingProgressBar progress={progress} />
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(248 70% 58% / 0.15), hsl(270 60% 62% / 0.1))" }}
            >
              <BrainCircuit className="w-4 h-4" style={{ color: "hsl(248 70% 55%)" }} />
            </div>
            <div className="min-w-0 hidden sm:block">
              <span className="text-sm font-medium text-muted-foreground block truncate">
                {MOCK_DATA.source}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeSection}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={spring.snappy}
                  className="text-xs font-semibold truncate block"
                  style={{ color: "hsl(248 70% 52%)" }}
                >
                  {activeTocItem.label}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Source carousel toggle */}
            <motion.button
              whileHover={hover.subtle}
              whileTap={tap.press}
              transition={spring.snappy}
              onClick={() => setCarouselOpen((o) => !o)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all mr-1"
              style={
                carouselOpen
                  ? {
                      background: "hsl(248 70% 58% / 0.12)",
                      color: "hsl(248 70% 50%)",
                      border: "1px solid hsl(248 70% 58% / 0.2)",
                    }
                  : {
                      background: "rgba(0,0,0,0.04)",
                      color: "hsl(240 8% 50%)",
                      border: "1px solid transparent",
                    }
              }
              data-testid="button-toggle-carousel"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Source</span>
            </motion.button>

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
              whileHover={hover.glow}
              whileTap={tap.deep}
              transition={spring.soft}
              className="flex items-center gap-2 text-white px-4 py-1.5 rounded-xl text-sm font-semibold"
              data-testid="button-save"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                boxShadow: "0 2px 8px hsl(248 70% 58% / 0.3)",
              }}
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Save
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        <div className="flex gap-6 items-start">

          {/* ── Desktop carousel sidebar ── */}
          <CarouselSidePanel
            isOpen={carouselOpen}
            onClose={() => setCarouselOpen(false)}
            onSlideClick={openModal}
            activeSlide={activeSlideSidebar}
          />

          {/* ── Content column ── */}
          <div className="flex-1 min-w-0 flex gap-8 items-start">
            <div ref={contentRef} className="flex-1 min-w-0 max-w-2xl relative">

              {/* Mobile carousel strip */}
              <MobileCarouselStrip onSlideClick={openModal} />

              {/* Page header */}
              <motion.header
                className="mb-12"
                style={{ opacity: headerOpacity, y: headerY }}
              >
                <div className="flex flex-wrap gap-2 mb-5">
                  {MOCK_DATA.tags.map((tag) => {
                    const c = TAG_COLORS[tag] ?? { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)" };
                    return (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ background: c.bg, color: c.text }}
                      >
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
              </motion.header>

              {/* Gradient separator */}
              <div
                className="h-px w-full mb-12 rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(248 70% 58% / 0.3), hsl(270 60% 62% / 0.2), transparent)" }}
              />

              <div className="space-y-20 relative">
                {/* Section flow spine (desktop) */}
                <div
                  className="hidden md:block absolute left-0 top-8 bottom-32 w-px pointer-events-none"
                  aria-hidden
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "hsl(240 12% 92%)" }}
                  />
                  <motion.div
                    className="absolute inset-x-0 top-0 rounded-full origin-top"
                    style={{
                      scaleY: progress,
                      height: "100%",
                      background:
                        "linear-gradient(180deg, hsl(248 70% 58% / 0.5), hsl(270 65% 55% / 0.35), transparent)",
                    }}
                    transition={spring.soft}
                  />
                </div>

                {/* Overview */}
                <ScrollSection id="overview" activeSection={activeSection}>
                  <SectionHeading
                    icon={BookOpen}
                    label="Overview"
                    gradient="linear-gradient(135deg, hsl(248 70% 58%), hsl(260 65% 62%))"
                    isActive={activeSection === "overview"}
                  />
                  <p className="text-[17px] text-foreground/80 leading-[1.85]">{MOCK_DATA.overview}</p>
                </ScrollSection>

                {/* Key Insights */}
                <ScrollSection id="insights" activeSection={activeSection}>
                  <SectionHeading
                    icon={BrainCircuit}
                    label="Key Insights"
                    gradient="linear-gradient(135deg, hsl(270 65% 58%), hsl(290 60% 64%))"
                    isActive={activeSection === "insights"}
                  />
                  <ul className="space-y-3">
                    {MOCK_DATA.insights.map((insight, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={scrollViewportDeep}
                        transition={listItemReveal(idx)}
                        whileHover={hover.lift}
                        className="flex gap-4 p-5 rounded-2xl border premium-surface premium-surface-interactive"
                        style={{
                          borderColor: "hsl(248 40% 90%)",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
                          style={{ background: `linear-gradient(135deg, hsl(${248 + idx * 8} 70% 58%), hsl(${270 + idx * 8} 65% 62%))` }}
                        >
                          {idx + 1}
                        </div>
                        <p className="text-foreground/85 leading-relaxed">{insight}</p>
                      </motion.li>
                    ))}
                  </ul>
                </ScrollSection>

                {/* Action Steps */}
                <ScrollSection id="actions" activeSection={activeSection}>
                  <SectionHeading
                    icon={Target}
                    label="Action Steps"
                    gradient="linear-gradient(135deg, hsl(200 70% 55%), hsl(220 75% 60%))"
                    isActive={activeSection === "actions"}
                  />
                  <div className="grid gap-3">
                    {MOCK_DATA.actionSteps.map((step, idx) => (
                      <motion.label
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={scrollViewportDeep}
                        transition={listItemReveal(idx)}
                        whileHover={hover.lift}
                        className="flex items-start gap-4 p-5 rounded-2xl border cursor-pointer group premium-surface premium-surface-interactive"
                        style={{ borderColor: "hsl(240 12% 90%)" }}
                      >
                        <div className="mt-0.5 relative shrink-0 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-md appearance-none border-2 border-border transition-all cursor-pointer"
                          />
                        </div>
                        <span className="text-base text-foreground/85 group-hover:text-foreground transition-colors leading-relaxed">
                          {step}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </ScrollSection>

                {/* Concepts */}
                <ScrollSection id="concepts" activeSection={activeSection}>
                  <SectionHeading
                    icon={Layers}
                    label="Concepts Explained"
                    gradient="linear-gradient(135deg, hsl(340 75% 58%), hsl(360 70% 62%))"
                    isActive={activeSection === "concepts"}
                  />
                  <div>
                    {MOCK_DATA.concepts.map((concept, idx) => (
                      <ConceptAccordion key={idx} concept={concept} />
                    ))}
                  </div>
                </ScrollSection>

                {/* Learning Path */}
                <ScrollSection id="path" activeSection={activeSection}>
                  <SectionHeading
                    icon={GraduationCap}
                    label="Learning Path"
                    gradient="linear-gradient(135deg, hsl(30 90% 55%), hsl(45 85% 60%))"
                    isActive={activeSection === "path"}
                  />
                  <div className="relative pl-8">
                    <div
                      className="absolute left-3 top-4 bottom-4 w-0.5 rounded-full"
                      style={{ background: "linear-gradient(180deg, hsl(200 70% 55%), hsl(248 70% 58%), hsl(270 65% 55%))" }}
                    />
                    <div className="space-y-8">
                      {MOCK_DATA.path.map((stage, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={scrollViewportDeep}
                          transition={listItemReveal(idx)}
                          className="relative"
                        >
                          <div
                            className="absolute left-[-29px] w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-md mt-3"
                            style={{
                              background: stage.color,
                              boxShadow: `0 0 0 3px ${stage.border}, 0 4px 10px ${stage.color}40`,
                            }}
                          >
                            <div className="w-2 h-2 rounded-full bg-white/60" />
                          </div>
                          <div className="p-5 rounded-2xl border" style={{ background: stage.bg, borderColor: stage.border }}>
                            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: stage.color }}>
                              {stage.stage}
                            </div>
                            <p className="text-foreground/80 leading-relaxed">{stage.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </ScrollSection>

                {/* Resources */}
                <ScrollSection id="resources" activeSection={activeSection} className="pb-32">
                  <SectionHeading
                    icon={ExternalLink}
                    label="Resources & Tools"
                    gradient="linear-gradient(135deg, hsl(150 65% 48%), hsl(170 60% 54%))"
                    isActive={activeSection === "resources"}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MOCK_DATA.resources.map((res, idx) => (
                      <motion.a
                        key={idx}
                        href={res.link}
                        whileHover={hover.card}
                        whileTap={tap.press}
                        transition={spring.soft}
                        className="group flex items-center justify-between p-5 rounded-2xl border premium-surface premium-surface-interactive"
                        style={{
                          background: res.colorBg,
                          borderColor: `${res.color}30`,
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                            {res.title}
                          </span>
                          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: res.color }}>
                            {res.type}
                          </span>
                        </div>
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center ml-3 shrink-0"
                          style={{ background: `${res.color}18`, color: res.color }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </ScrollSection>
              </div>
            </div>

            <ResultToc
              activeSection={activeSection}
              activeIndex={activeIndex}
              progress={progress}
              onNavigate={scrollTo}
            />
          </div>
        </div>
      </main>

      <MobileReadingPill
        activeIndex={activeIndex}
        progress={progress}
        label={activeTocItem.label}
      />

      {/* ── Modal lightbox ── */}
      <AnimatePresence>
        {modalOpen && (
          <CarouselModal
            initialIndex={modalSlide}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
