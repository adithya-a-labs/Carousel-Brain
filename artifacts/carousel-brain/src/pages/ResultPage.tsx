import { Navbar } from "@/components/Navbar";
import { useState, useEffect, useMemo } from "react";
import { Link, type RouteComponentProps } from "wouter";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
  GitBranch, CheckCircle2, Clock3, Copy, Check, AlertTriangle,
  Search, Grid2X2, List, Package, Tags, Wrench, Building2,
  CalendarDays, DollarSign, Lightbulb, Route,
} from "lucide-react";
import { getExtractionById } from "@/lib/extractions";
import { getSignedStorageUrls } from "@/lib/storage";
import type { ConceptBlock, ExtractionBlock, RoadmapBlock, Slide } from "@/types/knowledge";
import { toast } from "@/hooks/use-toast";

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Productivity: { bg: "hsl(248 70% 58% / 0.12)", text: "hsl(248 70% 46%)" },
  Psychology: { bg: "hsl(340 75% 58% / 0.12)", text: "hsl(340 70% 46%)" },
  Philosophy: { bg: "hsl(270 65% 58% / 0.12)", text: "hsl(270 65% 44%)" },
  Learning: { bg: "hsl(200 70% 55% / 0.12)", text: "hsl(200 70% 40%)" },
  Career: { bg: "hsl(30 90% 58% / 0.12)", text: "hsl(30 80% 42%)" },
  Mindset: { bg: "hsl(150 65% 50% / 0.12)", text: "hsl(150 65% 36%)" },
  Systems: { bg: "hsl(220 80% 62% / 0.12)", text: "hsl(220 75% 44%)" },
  Growth: { bg: "hsl(45 90% 54% / 0.12)", text: "hsl(40 80% 38%)" },
};

// ─── Slide thumbnail ─────────────────────────────────────────────────────────

type SourceSlide = Slide & {
  imageUrl?: string;
  storagePath?: string;
};

type SourceSlideHandler = (slideIndex: number) => void;

function isUsableLink(value?: string | null) {
  if (!value || value === "#") return false;
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value) || /^www\.[^\s]+\.[^\s]+/i.test(value);
}

function normalizeHref(value?: string | null) {
  if (!isUsableLink(value)) return undefined;
  return /^www\./i.test(value ?? "") ? `https://${value}` : value ?? undefined;
}

async function copyToClipboard(text: string, label = "Copied") {
  const cleaned = text.trim();
  if (!cleaned) return;

  await navigator.clipboard.writeText(cleaned);
  toast({
    title: label,
    description: "Saved to clipboard.",
  });
}

function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  compact = false,
}: {
  text?: string | null;
  label?: string;
  copiedLabel?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(text?.trim());

  return (
    <motion.button
      type="button"
      whileHover={canCopy ? hover.subtle : undefined}
      whileTap={canCopy ? tap.press : undefined}
      transition={spring.snappy}
      disabled={!canCopy}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!text) return;
        await copyToClipboard(text, copiedLabel);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors ${
        compact ? "px-2 py-1" : "px-3 py-1.5"
      } ${canCopy ? "text-foreground/70 hover:text-foreground bg-white/70 hover:bg-white" : "text-muted-foreground/35 bg-white/40 cursor-not-allowed"}`}
      style={{ borderColor: "hsl(240 12% 88%)" }}
      title={label}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "Copied" : label}</span>
    </motion.button>
  );
}

function SourceBadge({
  sourceSlideIndex,
  evidenceText,
  onSourceSlide,
}: {
  sourceSlideIndex?: number | null;
  evidenceText?: string | null;
  onSourceSlide?: SourceSlideHandler;
}) {
  const [showEvidence, setShowEvidence] = useState(false);

  if (sourceSlideIndex == null && !evidenceText) return null;

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {sourceSlideIndex != null && (
        <button
          type="button"
          onClick={() => {
            onSourceSlide?.(sourceSlideIndex);
            setShowEvidence((value) => !value);
          }}
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 hover:bg-white transition-colors"
          style={{ color: "hsl(248 70% 50%)" }}
        >
          From slide {sourceSlideIndex}
        </button>
      )}
      {evidenceText && (
        <span className="text-[11px] text-muted-foreground/75 leading-relaxed line-clamp-1">
          {evidenceText}
        </span>
      )}
      <AnimatePresence>
        {showEvidence && sourceSlideIndex != null && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={spring.snappy}
            className="absolute left-0 top-full z-20 mt-2 w-[min(320px,80vw)] rounded-2xl border premium-panel p-4"
            style={{ borderColor: "hsl(248 70% 58% / 0.18)", boxShadow: "0 16px 44px rgba(80,60,180,0.14)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(248 70% 52%)" }}>
              Source evidence
            </p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              {evidenceText || `Source slide ${sourceSlideIndex} is selected in the carousel rail.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function fallbackSlide(index: number, storagePath?: string): SourceSlide {
  const gradients = [
    "linear-gradient(145deg, hsl(248 70% 42%), hsl(270 65% 52%))",
    "linear-gradient(145deg, hsl(200 70% 32%), hsl(220 76% 48%))",
    "linear-gradient(145deg, hsl(150 58% 30%), hsl(178 58% 42%))",
  ];

  return {
    id: index + 1,
    gradient: gradients[index % gradients.length],
    accent: "rgba(255,255,255,0.13)",
    heading: `Source slide ${index + 1}`,
    lines: [3, 4, 2],
    caption: storagePath ? `Stored source image ${index + 1}.` : "Extracted source slide.",
    storagePath,
  };
}

function SlideThumbnail({
  slide,
  slideCount,
  isActive,
  onClick,
  size = "md",
}: {
  slide: SourceSlide;
  slideCount: number;
  isActive?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const isSmall = size === "sm";
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(slide.imageUrl && !imageFailed);

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
        background: hasImage ? "hsl(240 12% 12%)" : slide.gradient,
        boxShadow: isActive
          ? "0 0 0 2px hsl(248 70% 62%), 0 8px 24px rgba(80,60,180,0.3)"
          : "0 3px 12px rgba(0,0,0,0.18)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {hasImage && (
        <img
          src={slide.imageUrl}
          alt={`Source slide ${slide.id}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}

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
            {slide.id}/{slideCount}
          </span>
        </div>

        {!hasImage && (
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
        )}
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
  slides,
  initialIndex,
  onClose,
}: {
  slides: SourceSlide[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const slide = slides[idx];
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(slide.imageUrl && !imageFailed);

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  useEffect(() => {
    setImageFailed(false);
  }, [idx, slide.imageUrl]);

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
              background: hasImage ? "hsl(240 12% 10%)" : slide.gradient,
              aspectRatio: "4/5",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            {hasImage && (
              <img
                src={slide.imageUrl}
                alt={`Source slide ${slide.id}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImageFailed(true)}
              />
            )}

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
                  Slide {slide.id} of {slides.length}
                </span>
                <div className="flex gap-1">
                  {slides.map((_, i) => (
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

              <div className="space-y-5">
                {!hasImage && (
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
                )}

                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
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
  slides,
  onClose,
  onSlideClick,
  activeSlide,
}: {
  isOpen: boolean;
  slides: SourceSlide[];
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
                  AI extracted from {slides.length} slides
                </p>
              </div>
            </div>

            {/* Slides list */}
            <div className="px-2 pb-3 space-y-2 max-h-[520px] overflow-y-auto no-scrollbar">
              {slides.map((slide, i) => (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <SlideThumbnail
                    slide={slide}
                    slideCount={slides.length}
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

function MobileCarouselStrip({
  slides,
  onSlideClick,
}: {
  slides: SourceSlide[];
  onSlideClick: (idx: number) => void;
}) {
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
          {slides.map((slide, i) => (
            <div key={slide.id} style={{ scrollSnapAlign: "start" }}>
              <SlideThumbnail
                slide={slide}
                slideCount={slides.length}
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

const ConceptAccordion = ({
  concept,
  onSourceSlide,
}: {
  concept: ConceptBlock["clusters"][number];
  onSourceSlide?: SourceSlideHandler;
}) => {
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
              <p>{concept.description}</p>
              {concept.whyItMatters && (
                <p className="mt-3 text-foreground/75">
                  <span className="font-semibold text-foreground/80">Why it matters: </span>
                  {concept.whyItMatters}
                </p>
              )}
              {concept.ideas && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {concept.ideas.map((idea) => (
                    <span
                      key={idea}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: "hsl(248 70% 58% / 0.08)",
                        color: "hsl(248 70% 50%)",
                      }}
                    >
                      {idea}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <SourceBadge sourceSlideIndex={concept.sourceSlideIndex} evidenceText={concept.evidenceText} onSourceSlide={onSourceSlide} />
              </div>
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
  actions,
  trust,
}: {
  icon: React.ElementType;
  label: string;
  gradient: string;
  isActive?: boolean;
  actions?: React.ReactNode;
  trust?: {
    confidence?: number;
    evidenceCount?: number;
    grounded?: boolean;
  };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-7 pb-3 border-b border-border/50">
      <div className="flex items-center gap-3 min-w-0">
        <motion.div
          animate={
            isActive
              ? { boxShadow: "0 4px 18px rgba(80,60,180,0.28)" }
              : { boxShadow: "0 3px 10px rgba(80,60,180,0.2)" }
          }
          transition={spring.soft}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
          style={{ background: gradient }}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
        <h2 className="text-2xl font-bold min-w-0">{label}</h2>
        <TrustBadge trust={trust} />
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type TocItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const BLOCK_GRADIENTS: Record<ExtractionBlock["kind"], string> = {
  summary: "linear-gradient(135deg, hsl(248 70% 58%), hsl(260 65% 62%))",
  checklist: "linear-gradient(135deg, hsl(200 70% 55%), hsl(220 75% 60%))",
  concepts: "linear-gradient(135deg, hsl(340 75% 58%), hsl(360 70% 62%))",
  roadmap: "linear-gradient(135deg, hsl(30 90% 55%), hsl(45 85% 60%))",
  timeline: "linear-gradient(135deg, hsl(270 65% 58%), hsl(290 60% 64%))",
  resources: "linear-gradient(135deg, hsl(150 65% 48%), hsl(170 60% 54%))",
  repoCollection: "linear-gradient(135deg, hsl(220 80% 60%), hsl(240 75% 64%))",
  catalog_grid: "linear-gradient(135deg, hsl(248 70% 58%), hsl(200 70% 55%))",
};

type KnownBlockKind = ExtractionBlock["kind"];
type UnknownExtractionBlock = {
  id: string;
  title: string;
  kind: string;
  [key: string]: unknown;
};
type RuntimeBlock = ExtractionBlock | UnknownExtractionBlock;
type BlockRendererProps<TBlock extends ExtractionBlock = ExtractionBlock> = {
  block: TBlock;
  onSourceSlide?: SourceSlideHandler;
};

function hasRenderableContent(block: RuntimeBlock) {
  if (block.kind === "summary") return Boolean((block as Extract<ExtractionBlock, { kind: "summary" }>).body);
  if (block.kind === "checklist") return ((block as Extract<ExtractionBlock, { kind: "checklist" }>).items ?? []).length > 0;
  if (block.kind === "resources") return ((block as Extract<ExtractionBlock, { kind: "resources" }>).groups ?? []).some((group) => group.items.length > 0);
  if (block.kind === "concepts") return ((block as Extract<ExtractionBlock, { kind: "concepts" }>).clusters ?? []).length > 0;
  if (block.kind === "roadmap") return ((block as Extract<ExtractionBlock, { kind: "roadmap" }>).stages ?? []).length > 0;
  if (block.kind === "timeline") return ((block as Extract<ExtractionBlock, { kind: "timeline" }>).events ?? []).length > 0;
  if (block.kind === "repoCollection") return ((block as Extract<ExtractionBlock, { kind: "repoCollection" }>).repos ?? []).length > 0;
  if (block.kind === "catalog_grid") return ((block as Extract<ExtractionBlock, { kind: "catalog_grid" }>).items ?? []).length > 0;
  return true;
}

function actionPlanText(blocks: ExtractionBlock[]) {
  return blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "checklist" }> => block.kind === "checklist")
    .flatMap((block) => block.items.filter((item) => !item.promptText).map((item, index) => `${index + 1}. ${item.text}`))
    .join("\n");
}

function resourceCollectionText(blocks: ExtractionBlock[]) {
  const resourceLines = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "resources" }> => block.kind === "resources")
    .flatMap((block) =>
      block.groups.flatMap((group) =>
        group.items.map((item) => {
          const href = normalizeHref(item.applyUrl ?? item.url ?? item.link);
          return [item.title, item.description, href].filter(Boolean).join(" - ");
        }),
      ),
    );
  const catalogLines = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "catalog_grid" }> => block.kind === "catalog_grid")
    .flatMap((block) => block.items.map((item) => [item.title, item.description].filter(Boolean).join(" - ")));

  return [...resourceLines, ...catalogLines].join("\n");
}

function catalogIdeasText(blocks: ExtractionBlock[]) {
  return blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "catalog_grid" }> => block.kind === "catalog_grid")
    .flatMap((block) => block.items.map((item, index) => `${index + 1}. ${[item.title, item.description].filter(Boolean).join(" - ")}`))
    .join("\n");
}

function promptCollectionText(block: Extract<ExtractionBlock, { kind: "checklist" }>) {
  return block.items
    .map((item, index) => {
      const promptText = item.promptText || item.detail || item.text;
      return `### ${index + 1}. ${item.text}\n\n${promptText}`;
    })
    .join("\n\n");
}

function blockText(block: RuntimeBlock) {
  if (block.kind === "summary") {
    const summary = block as Extract<ExtractionBlock, { kind: "summary" }>;
    return [summary.title, summary.body, ...(summary.highlights ?? [])].filter(Boolean).join("\n\n");
  }
  if (block.kind === "checklist") {
    const checklist = block as Extract<ExtractionBlock, { kind: "checklist" }>;
    return checklist.items.map((item, index) => `${index + 1}. ${item.text}${item.detail ? ` - ${item.detail}` : ""}`).join("\n");
  }
  if (block.kind === "resources") {
    return resourceCollectionText([block as ExtractionBlock]);
  }
  if (block.kind === "catalog_grid") {
    return catalogIdeasText([block as ExtractionBlock]);
  }
  if (block.kind === "concepts") {
    const concepts = block as Extract<ExtractionBlock, { kind: "concepts" }>;
    return concepts.clusters.map((concept) => `${concept.name}\n${concept.description}`).join("\n\n");
  }
  if (block.kind === "roadmap") {
    const roadmap = block as Extract<ExtractionBlock, { kind: "roadmap" }>;
    return roadmap.stages.map((stage, index) => `${index + 1}. ${stage.stage}: ${stage.description}`).join("\n");
  }
  return block.title ?? "";
}

function resultMarkdown(extraction: {
  title: string;
  summary: string;
  blocks: ExtractionBlock[];
}) {
  const sections = extraction.blocks
    .filter(hasRenderableContent)
    .map((block) => `## ${block.title}\n\n${blockText(block)}`)
    .join("\n\n");
  return `# ${extraction.title}\n\n${extraction.summary}\n\n${sections}`.trim();
}

type ValueStat = {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "purple" | "green" | "blue" | "amber" | "rose";
};

type ExtractionValueSummary = {
  summary: string;
  stats: ValueStat[];
};

function extractedValueSummary(contentType: string, blocks: ExtractionBlock[]): ExtractionValueSummary {
  const catalogItems = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "catalog_grid" }> => block.kind === "catalog_grid")
    .flatMap((block) => block.items);
  const resources = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "resources" }> => block.kind === "resources")
    .flatMap((block) => block.groups.flatMap((group) => group.items));
  const checklistBlocks = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "checklist" }> => block.kind === "checklist");
  const checklistItems = checklistBlocks.flatMap((block) => block.items);
  const keyInsights = checklistBlocks
    .filter((block) => /insight/i.test(block.title))
    .flatMap((block) => block.items);
  const actionSteps = checklistBlocks
    .filter((block) => /action|checklist|step/i.test(block.title) && !/insight|prompt/i.test(block.title))
    .flatMap((block) => block.items);
  const concepts = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "concepts" }> => block.kind === "concepts")
    .flatMap((block) => block.clusters);
  const milestones = blocks
    .filter((block): block is Extract<ExtractionBlock, { kind: "roadmap" }> => block.kind === "roadmap")
    .flatMap((block) => block.stages);
  const opportunities = resources.filter((item) => item.type === "Opportunity" || item.deadline || item.stipend || item.organization);
  const openableLinks = resources.filter((item) => normalizeHref(item.applyUrl ?? item.url ?? item.link)).length;
  const resourceTypes = (type: RegExp) => resources.filter((item) => type.test(`${item.type} ${item.category ?? ""}`)).length;
  const categories = new Set(catalogItems.map((item) => item.category).filter(Boolean));
  const difficultyCount = (name: RegExp) => catalogItems.filter((item) => name.test(item.difficulty ?? "")).length;

  if (contentType === "resources" || (resources.length > 0 && catalogItems.length === 0)) {
    const totalResources = resources.length + catalogItems.length;
    const catalogTypeCount = (type: RegExp) => catalogItems.filter((item) => type.test(`${item.category ?? ""} ${item.title}`)).length;
    return {
      summary: `${totalResources} resources identified${openableLinks ? `, with ${openableLinks} openable links` : ""}.`,
      stats: compactStats([
        { label: "Resources Found", value: totalResources, icon: BookOpen, tone: "purple" },
        { label: "Tools", value: resourceTypes(/tool|api|platform/i) + catalogTypeCount(/tool|api|library|platform/i), icon: Wrench, tone: "blue" },
        { label: "Repositories", value: resourceTypes(/repo|github|repository/i) + catalogTypeCount(/repo|github|repository/i), icon: GitBranch, tone: "green" },
        { label: "Courses", value: resourceTypes(/course|learning/i) + catalogTypeCount(/course|learning/i), icon: GraduationCap, tone: "amber" },
        { label: "Openable Links", value: openableLinks, icon: ExternalLink, tone: "rose" },
      ]),
    };
  }

  if (catalogItems.length > 0) {
    const stats = compactStats([
      { label: "Items Extracted", value: catalogItems.length, icon: Package, tone: "purple" },
      { label: "Categories", value: categories.size, icon: Tags, tone: "blue" },
      { label: "Beginner", value: difficultyCount(/beginner|easy/i), icon: CheckCircle2, tone: "green" },
      { label: "Intermediate", value: difficultyCount(/intermediate|medium/i), icon: Clock3, tone: "amber" },
      { label: "Advanced", value: difficultyCount(/advanced|hard/i), icon: Zap, tone: "rose" },
    ]);
    return {
      summary: `${catalogItems.length} ${contentType === "system" ? "items" : "ideas"} extracted${categories.size ? ` across ${categories.size} categories` : ""}.`,
      stats,
    };
  }

  if (opportunities.length > 0 || contentType === "opportunities") {
    const organizations = new Set(opportunities.map((item) => item.organization).filter(Boolean));
    const deadlines = opportunities.filter((item) => item.deadline).length;
    const stipends = opportunities.filter((item) => item.stipend).length;
    return {
      summary: `${opportunities.length || resources.length} opportunities identified${organizations.size ? ` across ${organizations.size} organizations` : ""}.`,
      stats: compactStats([
        { label: "Opportunities", value: opportunities.length || resources.length, icon: Target, tone: "purple" },
        { label: "Organizations", value: organizations.size, icon: Building2, tone: "blue" },
        { label: "Deadlines Found", value: deadlines, icon: CalendarDays, tone: "amber" },
        { label: "Stipends Found", value: stipends, icon: DollarSign, tone: "green" },
      ]),
    };
  }

  if (resources.length > 0) {
    return {
      summary: `${resources.length} resources identified${openableLinks ? `, with ${openableLinks} openable links` : ""}.`,
      stats: compactStats([
        { label: "Resources Found", value: resources.length, icon: BookOpen, tone: "purple" },
        { label: "Tools", value: resourceTypes(/tool|api|platform/i), icon: Wrench, tone: "blue" },
        { label: "Repositories", value: resourceTypes(/repo|github|repository/i), icon: GitBranch, tone: "green" },
        { label: "Courses", value: resourceTypes(/course|learning/i), icon: GraduationCap, tone: "amber" },
        { label: "Openable Links", value: openableLinks, icon: ExternalLink, tone: "rose" },
      ]),
    };
  }

  if (contentType === "roadmap") {
    return {
      summary: `${milestones.length} milestones mapped${concepts.length ? ` with ${concepts.length} concepts` : ""}.`,
      stats: compactStats([
        { label: "Milestones", value: milestones.length, icon: Route, tone: "purple" },
        { label: "Concepts", value: concepts.length, icon: Layers, tone: "blue" },
        { label: "Outcomes", value: checklistItems.length, icon: Target, tone: "green" },
        { label: "Resources", value: resources.length, icon: BookOpen, tone: "amber" },
      ]),
    };
  }

  return {
    summary: `${keyInsights.length + actionSteps.length + concepts.length + resources.length} knowledge elements extracted.`,
    stats: compactStats([
      { label: "Key Insights", value: keyInsights.length, icon: Lightbulb, tone: "purple" },
      { label: "Action Steps", value: actionSteps.length || checklistItems.filter((item) => !item.promptText).length, icon: CheckCircle2, tone: "green" },
      { label: "Concepts", value: concepts.length, icon: BrainCircuit, tone: "blue" },
      { label: "Resources Mentioned", value: resources.length, icon: BookOpen, tone: "amber" },
    ]),
  };
}

function compactStats(stats: ValueStat[]) {
  return stats.filter((stat) => stat.value > 0);
}

function extractionWarnings(blocks: ExtractionBlock[], metadata: Record<string, unknown> | undefined) {
  const metadataWarnings = Array.isArray(metadata?.extractionWarnings)
    ? metadata.extractionWarnings.filter((item): item is string => typeof item === "string")
    : [];
  const warningBlockText = blocks
    .filter((block) => block.kind === "summary" && /warning/i.test(block.title))
    .flatMap((block) => {
      const body = (block as Extract<ExtractionBlock, { kind: "summary" }>).body;
      return body ? body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean) : [];
    });

  return Array.from(new Set([...metadataWarnings, ...warningBlockText]));
}

function blockIcon(kind: string) {
  const icons: Record<KnownBlockKind, React.ElementType> = {
    summary: BookOpen,
    checklist: Target,
    concepts: Layers,
    roadmap: GraduationCap,
    timeline: Clock3,
    resources: ExternalLink,
    repoCollection: GitBranch,
    catalog_grid: Zap,
  };
  return icons[kind as KnownBlockKind] ?? BrainCircuit;
}

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
  items,
  activeSection,
  activeIndex,
  progress,
  onNavigate,
}: {
  items: TocItem[];
  activeSection: string;
  activeIndex: number;
  progress: number;
  onNavigate: (id: string) => void;
}) {
  const trackFill =
    items.length > 1 ? activeIndex / (items.length - 1) : 0;

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
            {activeIndex + 1}/{items.length}
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
            {items.map((item, index) => {
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
  sectionCount,
}: {
  activeIndex: number;
  progress: number;
  label: string;
  sectionCount: number;
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
                Section {activeIndex + 1} of {sectionCount}
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

function FilterSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent outline-none text-foreground/75"
      >
        {values.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function TrustMetric({ label, value }: { label: string; value?: number }) {
  const percent = typeof value === "number" ? Math.round(value * 100) : undefined;
  return (
    <div className="rounded-2xl border premium-surface px-4 py-3" style={{ borderColor: "hsl(248 70% 58% / 0.12)" }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">{label}</p>
        <p className="text-sm font-bold text-foreground/80">{percent != null ? `${percent}%` : "n/a"}</p>
      </div>
      <div className="h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percent ?? 0}%`,
            background: "linear-gradient(90deg, hsl(248 70% 58%), hsl(150 65% 48%))",
          }}
        />
      </div>
    </div>
  );
}

function ValueStatCard({ stat }: { stat: ValueStat }) {
  const Icon = stat.icon;
  const tones = {
    purple: { bg: "hsl(248 70% 58% / 0.1)", color: "hsl(248 70% 48%)" },
    green: { bg: "hsl(150 65% 48% / 0.1)", color: "hsl(150 65% 34%)" },
    blue: { bg: "hsl(200 70% 50% / 0.1)", color: "hsl(200 70% 38%)" },
    amber: { bg: "hsl(38 90% 55% / 0.12)", color: "hsl(34 80% 38%)" },
    rose: { bg: "hsl(340 75% 58% / 0.1)", color: "hsl(340 70% 42%)" },
  }[stat.tone ?? "purple"];

  return (
    <div className="rounded-2xl border premium-surface px-4 py-3" style={{ borderColor: "hsl(248 70% 58% / 0.12)" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tones.bg, color: tones.color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground/90 tabular-nums">{stat.value}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-tight">{stat.label}</p>
        </div>
      </div>
    </div>
  );
}

function ExtractionDetails({
  quality,
  warnings,
  contentTypeReason,
}: {
  quality?: {
    extractionQualityScore?: number;
    groundingScore?: number;
    hasHallucinationRisk?: boolean;
    warningCount?: number;
  };
  warnings: string[];
  contentTypeReason?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!quality && warnings.length === 0 && !contentTypeReason) return null;

  return (
    <div className="mt-5 rounded-2xl border premium-surface overflow-hidden" style={{ borderColor: "hsl(248 70% 58% / 0.12)" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-foreground/80">Extraction Details</p>
          <p className="text-xs text-muted-foreground">Diagnostics for review and debugging</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.enter}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 p-4 space-y-4">
              {quality && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <TrustMetric label="Quality" value={quality.extractionQualityScore} />
                  <TrustMetric label="Grounding" value={quality.groundingScore} />
                  <div className="rounded-2xl border premium-surface px-4 py-3" style={{ borderColor: "hsl(248 70% 58% / 0.12)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">Warnings</p>
                    <p className="text-lg font-bold text-foreground/85">{quality.warningCount ?? warnings.length}</p>
                  </div>
                </div>
              )}
              {contentTypeReason && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55 mb-1">Content Type Reason</p>
                  <p className="text-sm text-foreground/75 leading-relaxed">{contentTypeReason}</p>
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55 mb-2">Extraction Warnings</p>
                  <div className="space-y-2">
                    {warnings.map((warning) => (
                      <p key={warning} className="text-sm text-muted-foreground leading-relaxed rounded-xl bg-black/[0.035] px-3 py-2">
                        {warning}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrustBadge({
  trust,
}: {
  trust?: {
    confidence?: number;
    evidenceCount?: number;
    grounded?: boolean;
  };
}) {
  if (!trust) return null;

  const confidence = typeof trust.confidence === "number" ? Math.round(trust.confidence * 100) : undefined;
  const grounded = trust.grounded || (trust.evidenceCount ?? 0) > 0;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{
        borderColor: grounded ? "hsl(150 65% 48% / 0.24)" : "hsl(30 90% 55% / 0.24)",
        color: grounded ? "hsl(150 65% 34%)" : "hsl(30 80% 38%)",
      }}
      title={grounded ? `${trust.evidenceCount ?? 0} grounded source references` : "Limited source evidence available"}
    >
      <CheckCircle2 className="w-3 h-3" />
      {confidence != null ? `${confidence}%` : grounded ? "Grounded" : "Low evidence"}
      {trust.evidenceCount != null && <span className="font-semibold opacity-70">/{trust.evidenceCount}</span>}
    </span>
  );
}

function SummaryBlockView({ block }: { block: Extract<ExtractionBlock, { kind: "summary" }> }) {
  return (
    <div>
      <div className="rounded-3xl border premium-surface p-6" style={{ borderColor: "hsl(248 70% 58% / 0.16)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          {block.eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(248 70% 52%)" }}>
              {block.eyebrow}
            </p>
          )}
          <CopyButton text={block.body} label="Copy summary" copiedLabel="Summary copied" compact />
        </div>
        <p className="text-[17px] text-foreground/80 leading-[1.85]">{block.body}</p>
      </div>
      {block.highlights && (
        <div className="grid gap-3 mt-6">
          {block.highlights.map((highlight, idx) => (
            <motion.div
              key={highlight}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={scrollViewportDeep}
              transition={listItemReveal(idx)}
              className="flex items-center gap-3 p-4 rounded-2xl border premium-surface"
              style={{ borderColor: "hsl(248 40% 90%)" }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "hsl(248 70% 55%)" }} />
              <span className="text-foreground/85 leading-relaxed">{highlight}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistBlockView({
  block,
  onSourceSlide,
}: {
  block: Extract<ExtractionBlock, { kind: "checklist" }>;
  onSourceSlide?: SourceSlideHandler;
}) {
  const isPromptBlock = block.title.toLowerCase().includes("prompt") || block.items.some((item) => item.promptText);

  if (isPromptBlock) {
    const allPrompts = promptCollectionText(block);
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border premium-surface p-4" style={{ borderColor: "hsl(200 70% 55% / 0.14)" }}>
          <p className="text-sm text-muted-foreground">{block.items.length} prompt templates extracted</p>
          <CopyButton text={allPrompts} label="Copy all prompts" copiedLabel="Prompts copied" compact />
        </div>
        {block.items.map((item, idx) => {
          const promptText = item.promptText || item.detail || item.text;
          return (
            <motion.div
              key={`${item.text}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={scrollViewportDeep}
              transition={listItemReveal(idx)}
              whileHover={hover.lift}
              className="p-5 rounded-2xl border premium-surface premium-surface-interactive"
              style={{ borderColor: "hsl(200 70% 55% / 0.18)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-foreground/90">{item.text}</h3>
                  {item.purpose && <p className="text-sm text-muted-foreground mt-1">{item.purpose}</p>}
                </div>
                <CopyButton text={promptText} label="Copy prompt" copiedLabel="Prompt copied" compact />
              </div>
              {promptText && (
                <div className="rounded-xl bg-black/[0.035] border border-border/50 p-4 text-sm text-foreground/75 leading-relaxed whitespace-pre-wrap">
                  {promptText}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {item.variables?.map((variable) => (
                  <span key={variable} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">
                    {variable}
                  </span>
                ))}
                {item.bestUsedFor && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">
                    {item.bestUsedFor}
                  </span>
                )}
                {item.expectedOutput && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">
                    Output: {item.expectedOutput}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <SourceBadge sourceSlideIndex={item.sourceSlideIndex} evidenceText={item.evidenceText} onSourceSlide={onSourceSlide} />
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {block.items.map((item, idx) => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={scrollViewportDeep}
          transition={listItemReveal(idx)}
          whileHover={hover.lift}
          className="flex items-start gap-4 p-5 rounded-2xl border group premium-surface premium-surface-interactive"
          style={{ borderColor: "hsl(240 12% 90%)" }}
        >
          <div className="mt-0.5 relative shrink-0 flex items-center justify-center">
            <input
              type="checkbox"
              className="w-5 h-5 rounded-md appearance-none border-2 border-border transition-all cursor-pointer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base text-foreground/85 group-hover:text-foreground transition-colors leading-relaxed">
              {item.text}
            </p>
            {item.detail && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <CopyButton text={item.text} label="Copy" copiedLabel="Action copied" compact />
              <SourceBadge sourceSlideIndex={item.sourceSlideIndex} evidenceText={item.evidenceText} onSourceSlide={onSourceSlide} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RoadmapBlockView({ block, onSourceSlide }: { block: RoadmapBlock; onSourceSlide?: SourceSlideHandler }) {
  return (
    <div className="relative pl-8">
      <div
        className="absolute left-3 top-4 bottom-4 w-0.5 rounded-full"
        style={{ background: "linear-gradient(180deg, hsl(200 70% 55%), hsl(248 70% 58%), hsl(270 65% 55%))" }}
      />
      <div className="space-y-8">
        {block.stages.map((stage, idx) => (
          <motion.div
            key={stage.stage}
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
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: stage.color }}>
                  {stage.stage}
                </div>
                {stage.duration && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-muted-foreground">
                    {stage.duration}
                  </span>
                )}
              </div>
              <p className="text-foreground/80 leading-relaxed">{stage.description}</p>
              {stage.milestone && (
                <p className="text-sm font-medium mt-3" style={{ color: stage.color }}>
                  Milestone: {stage.milestone}
                </p>
              )}
              <div className="mt-3">
                <SourceBadge
                  sourceSlideIndex={"sourceSlideIndex" in stage ? stage.sourceSlideIndex as number | null : null}
                  evidenceText={"evidenceText" in stage ? stage.evidenceText as string | null : null}
                  onSourceSlide={onSourceSlide}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ConceptBlockView({ block, onSourceSlide }: { block: Extract<ExtractionBlock, { kind: "concepts" }>; onSourceSlide?: SourceSlideHandler }) {
  return (
    <div>
      {block.clusters.map((concept) => (
        <ConceptAccordion key={concept.name} concept={concept} onSourceSlide={onSourceSlide} />
      ))}
    </div>
  );
}

function TimelineBlockView({ block, onSourceSlide }: { block: Extract<ExtractionBlock, { kind: "timeline" }>; onSourceSlide?: SourceSlideHandler }) {
  return (
    <div className="grid gap-3">
      {block.events.map((event, idx) => (
        <motion.div
          key={event.label}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={scrollViewportDeep}
          transition={listItemReveal(idx)}
          whileHover={hover.lift}
          className="flex gap-4 p-5 rounded-2xl border premium-surface premium-surface-interactive"
          style={{ borderColor: "hsl(248 40% 90%)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, hsl(${248 + idx * 8} 70% 58%), hsl(${270 + idx * 8} 65% 62%))` }}
          >
            {idx + 1}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground/90">{event.label}</h3>
              {event.timeframe && <span className="text-xs text-muted-foreground">{event.timeframe}</span>}
            </div>
            <p className="text-foreground/75 leading-relaxed">{event.description}</p>
            <div className="mt-3">
              <SourceBadge
                sourceSlideIndex={"sourceSlideIndex" in event ? event.sourceSlideIndex as number | null : null}
                evidenceText={"evidenceText" in event ? event.evidenceText as string | null : null}
                onSourceSlide={onSourceSlide}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ResourceBlockView({
  block,
  onSourceSlide,
}: {
  block: Extract<ExtractionBlock, { kind: "resources" }>;
  onSourceSlide?: SourceSlideHandler;
}) {
  const isOpportunityBlock = block.title.toLowerCase().includes("opportun") ||
    block.groups.some((group) => group.items.some((item) => item.type === "Opportunity" || item.deadline || item.stipend || item.applyUrl));
  const groupedItems = useMemo(() => {
    const items = block.groups.flatMap((group) => group.items);
    if (isOpportunityBlock) {
      return [{
        category: "Programs & Opportunities",
        items: [...items].sort((a, b) => {
          const urgencyRank = (value?: string) => /urgent|soon|high/i.test(value ?? "") ? 0 : /medium/i.test(value ?? "") ? 1 : 2;
          return urgencyRank(a.urgency) - urgencyRank(b.urgency) || String(a.deadline ?? "").localeCompare(String(b.deadline ?? ""));
        }),
      }];
    }

    const groups = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.category || item.type || "Resources";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return Array.from(groups, ([category, items]) => ({ category, items }));
  }, [block.groups, isOpportunityBlock]);
  const validLinks = groupedItems.flatMap((group) => group.items.map((item) => normalizeHref(item.applyUrl ?? item.url ?? item.link)).filter(Boolean)) as string[];
  const deadlinesText = groupedItems
    .flatMap((group) => group.items)
    .filter((item) => item.deadline)
    .map((item) => `${item.title}: ${item.deadline}`)
    .join("\n");

  const openAllLinks = () => {
    validLinks.forEach((href, index) => {
      window.setTimeout(() => window.open(href, "_blank", "noopener,noreferrer"), index * 80);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {groupedItems.reduce((sum, group) => sum + group.items.length, 0)} {isOpportunityBlock ? "opportunities" : "resources"} extracted
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={resourceCollectionText([block])} label={isOpportunityBlock ? "Copy opportunities" : "Copy resources"} copiedLabel="Copied" compact />
          {isOpportunityBlock && deadlinesText && <CopyButton text={deadlinesText} label="Copy deadlines" copiedLabel="Deadlines copied" compact />}
          {validLinks.length > 1 && (
            <button
              type="button"
              onClick={openAllLinks}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ background: "hsl(248 70% 55%)" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open all
            </button>
          )}
        </div>
      </div>

      {groupedItems.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">{group.category}</h3>
          <div className={isOpportunityBlock ? "grid gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
            {group.items.map((res) => {
              const href = normalizeHref(res.applyUrl ?? res.url ?? res.link);
              const actionLabel = isOpportunityBlock ? "Apply" : "Open";
              const copyText = [res.title, href, res.description].filter(Boolean).join("\n");
              const statusLabel = href ? "Available" : res.linkStatus === "incomplete" ? "Incomplete" : "Missing";

              return (
              <motion.div
                key={res.title}
                whileHover={hover.card}
                whileTap={tap.press}
                transition={spring.soft}
                className="group p-5 rounded-2xl border premium-surface premium-surface-interactive"
                style={{ background: res.colorBg, borderColor: `${res.color}30` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
                        {res.title}
                      </h3>
                    {res.urgency && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${res.color}18`, color: res.color }}>
                          {res.urgency}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 text-muted-foreground">
                        {statusLabel}
                      </span>
                    </div>
                    {res.description && <p className="text-sm text-muted-foreground leading-relaxed">{res.description}</p>}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider shrink-0" style={{ color: res.color }}>
                    {res.category || res.type}
                  </span>
                </div>

                {isOpportunityBlock && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {[
                      ["Organization", res.organization],
                      ["Deadline", res.deadline],
                      ["Stipend", res.stipend],
                      ["Location", res.location],
                      ["Duration", res.duration],
                      ["Focus", res.focus],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-white/60 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/55">{label}</p>
                        <p className="text-sm text-foreground/80 leading-snug">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!isOpportunityBlock && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {res.bestFor && <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">Best for: {res.bestFor}</span>}
                    {res.difficulty && <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">{res.difficulty}</span>}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                  <SourceBadge sourceSlideIndex={res.sourceSlideIndex} evidenceText={res.evidenceText} onSourceSlide={onSourceSlide} />
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton text={copyText} label="Copy" copiedLabel={`${isOpportunityBlock ? "Opportunity" : "Resource"} copied`} compact />
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
                        style={{ background: res.color }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {actionLabel}
                      </a>
                    ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/65 text-muted-foreground">
                        {res.linkStatus === "incomplete" ? "Link incomplete" : "Link unavailable"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalogBlockView({
  block,
  onSourceSlide,
}: {
  block: Extract<ExtractionBlock, { kind: "catalog_grid" }>;
  onSourceSlide?: SourceSlideHandler;
}) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [techFilter, setTechFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const categories = useMemo(() => ["All", ...Array.from(new Set(block.items.map((item) => item.category).filter(Boolean) as string[]))], [block.items]);
  const difficulties = useMemo(() => ["All", ...Array.from(new Set(block.items.map((item) => item.difficulty).filter(Boolean) as string[]))], [block.items]);
  const techStacks = useMemo(() => ["All", ...Array.from(new Set(block.items.flatMap((item) => item.techStack ?? []).filter(Boolean)))], [block.items]);
  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return block.items.filter((item) => {
      const text = `${item.title} ${item.description ?? ""} ${item.category ?? ""} ${(item.techStack ?? []).join(" ")}`.toLowerCase();
      return (!query || text.includes(query)) &&
        (categoryFilter === "All" || item.category === categoryFilter) &&
        (difficultyFilter === "All" || item.difficulty === difficultyFilter) &&
        (techFilter === "All" || (item.techStack ?? []).includes(techFilter));
    });
  }, [block.items, categoryFilter, difficultyFilter, searchTerm, techFilter]);
  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, 18);
  const hasMore = filteredItems.length > visibleItems.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filteredItems.length} of {block.items.length} {block.catalogType === "project_ideas" ? "ideas" : "items"} extracted
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={catalogIdeasText([block])} label="Copy catalog" copiedLabel="Catalog copied" compact />
          <button
            type="button"
            onClick={() => setViewMode((mode) => mode === "grid" ? "list" : "grid")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white/70 hover:bg-white transition-colors"
            style={{ borderColor: "hsl(240 12% 88%)" }}
          >
            {viewMode === "grid" ? <List className="w-3.5 h-3.5" /> : <Grid2X2 className="w-3.5 h-3.5" />}
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
        {filteredItems.length > 18 && (
          <motion.button
            type="button"
            whileHover={hover.subtle}
            whileTap={tap.press}
            transition={spring.snappy}
            onClick={() => setExpanded((value) => !value)}
            className="text-sm font-semibold px-3 py-1.5 rounded-xl border bg-white/70 hover:bg-white transition-colors"
            style={{ borderColor: "hsl(248 70% 58% / 0.18)", color: "hsl(248 70% 50%)" }}
          >
            {expanded ? "Show less" : `Show all ${filteredItems.length}`}
          </motion.button>
        )}
        </div>
      </div>

      <div className="rounded-2xl border premium-surface p-4" style={{ borderColor: "hsl(248 70% 58% / 0.12)" }}>
        <div className="flex items-center gap-2 rounded-xl bg-white/70 border px-3 py-2 mb-3" style={{ borderColor: "hsl(240 12% 88%)" }}>
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setExpanded(false);
            }}
            placeholder="Search ideas..."
            className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.length > 1 && <FilterSelect label="Category" value={categoryFilter} values={categories} onChange={setCategoryFilter} />}
          {difficulties.length > 1 && <FilterSelect label="Difficulty" value={difficultyFilter} values={difficulties} onChange={setDifficultyFilter} />}
          {techStacks.length > 1 && <FilterSelect label="Tech" value={techFilter} values={techStacks} onChange={setTechFilter} />}
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "grid gap-3"}>
      {visibleItems.map((item, idx) => {
        const color = item.color ?? `hsl(${248 + (idx % 6) * 14} 70% 58%)`;
        const colorBg = item.colorBg ?? `${color}14`;

        return (
          <motion.div
            key={`${item.title}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={scrollViewportDeep}
            transition={listItemReveal(idx)}
            whileHover={hover.card}
            className={`group rounded-2xl border premium-surface premium-surface-interactive ${viewMode === "grid" ? "p-5" : "p-4"}`}
            style={{ background: colorBg, borderColor: `${color}30` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${color}18`, color }}
              >
                {block.items.indexOf(item) + 1}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {item.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">
                  {item.category}
                </span>
              )}
              {item.difficulty && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 text-muted-foreground">
                  {item.difficulty}
                </span>
              )}
              {item.sourceSlideIndex != null && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-white/70" style={{ color }}>
                  Slide {item.sourceSlideIndex}
                </span>
              )}
            </div>

            {item.techStack && item.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.techStack.slice(0, 6).map((tech) => (
                  <span key={tech} className="text-[11px] px-2 py-0.5 rounded-md bg-black/[0.04] text-foreground/65">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
              <SourceBadge sourceSlideIndex={item.sourceSlideIndex} evidenceText={item.evidenceText} onSourceSlide={onSourceSlide} />
              <CopyButton text={item.title} label="Copy idea" copiedLabel="Idea copied" compact />
            </div>
          </motion.div>
        );
      })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-white/75 hover:bg-white transition-colors border"
            style={{ borderColor: "hsl(248 70% 58% / 0.18)", color: "hsl(248 70% 50%)" }}
          >
            Show {filteredItems.length - visibleItems.length} more ideas
          </button>
        </div>
      )}
    </div>
  );
}

function RepoBlockView({ block }: { block: Extract<ExtractionBlock, { kind: "repoCollection" }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {block.repos.map((repo) => (
        <motion.a
          key={repo.name}
          href={repo.link}
          whileHover={hover.card}
          whileTap={tap.press}
          transition={spring.soft}
          className="group p-5 rounded-2xl border premium-surface premium-surface-interactive"
          style={{ background: repo.colorBg, borderColor: `${repo.color}30` }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <GitBranch className="w-5 h-5 shrink-0 mt-0.5" style={{ color: repo.color }} />
            {repo.stars && <span className="text-xs font-semibold text-muted-foreground">{repo.stars} stars</span>}
          </div>
          <h3 className="font-bold text-foreground/90 group-hover:text-foreground transition-colors mb-2">{repo.name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{repo.description}</p>
          {repo.language && (
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: repo.color }}>
              {repo.language}
            </span>
          )}
        </motion.a>
      ))}
    </div>
  );
}

function UnknownBlockView({ block }: { block: UnknownExtractionBlock }) {
  return (
    <div
      className="p-6 rounded-2xl border premium-surface text-center"
      style={{ borderColor: "hsl(248 70% 58% / 0.18)" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{
          background: "linear-gradient(135deg, hsl(248 70% 58% / 0.14), hsl(270 60% 62% / 0.1))",
        }}
      >
        <BrainCircuit className="w-6 h-6" style={{ color: "hsl(248 70% 55%)" }} />
      </div>
      <h3 className="font-bold mb-2">Unsupported knowledge block</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This extraction includes a "{block.kind}" block that is not registered in this client yet.
      </p>
    </div>
  );
}

const blockRegistry = {
  summary: SummaryBlockView,
  roadmap: RoadmapBlockView,
  resources: ResourceBlockView,
  checklist: ChecklistBlockView,
  concepts: ConceptBlockView,
  timeline: TimelineBlockView,
  repoCollection: RepoBlockView,
  catalog_grid: CatalogBlockView,
} satisfies Record<KnownBlockKind, React.ComponentType<BlockRendererProps<any>>>;

function AdaptiveBlock({
  block,
  activeSection,
  onSourceSlide,
}: {
  block: RuntimeBlock;
  activeSection: string;
  onSourceSlide?: SourceSlideHandler;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const Icon = blockIcon(block.kind);
  const Renderer = blockRegistry[block.kind as KnownBlockKind] as
    | React.ComponentType<BlockRendererProps<any>>
    | undefined;
  const gradient =
    BLOCK_GRADIENTS[block.kind as KnownBlockKind] ??
    "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))";

  return (
    <ScrollSection id={block.id} activeSection={activeSection}>
      <SectionHeading
        icon={Icon}
        label={block.title}
        gradient={gradient}
        isActive={activeSection === block.id}
        trust={"trust" in block ? block.trust as { confidence?: number; evidenceCount?: number; grounded?: boolean } : undefined}
        actions={
          <>
            <CopyButton text={blockText(block)} label="Copy block" copiedLabel={`${block.title} copied`} compact />
            <motion.button
              type="button"
              whileHover={hover.subtle}
              whileTap={tap.press}
              transition={spring.snappy}
              onClick={() => setCollapsed((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-white/70 hover:bg-white px-2 py-1 text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors"
              style={{ borderColor: "hsl(240 12% 88%)" }}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
              {collapsed ? "Expand" : "Collapse"}
            </motion.button>
          </>
        }
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={transition.enter}
            className="overflow-visible"
          >
            {Renderer ? <Renderer block={block} onSourceSlide={onSourceSlide} /> : <UnknownBlockView block={block as UnknownExtractionBlock} />}
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollSection>
  );
}

function MissingExtraction({ extractionId }: { extractionId?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={spring.soft}
          className="relative w-full max-w-2xl rounded-3xl border border-white/60 premium-panel overflow-hidden text-center"
          style={{ boxShadow: "0 24px 80px hsl(248 70% 58% / 0.12)" }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, hsl(248 70% 58%), hsl(270 65% 62%), hsl(200 70% 55%))",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, hsl(248 70% 58% / 0.12), transparent 58%)",
            }}
          />
          <div className="relative px-6 py-14 md:px-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                background:
                  "linear-gradient(135deg, hsl(248 70% 58% / 0.15), hsl(270 60% 62% / 0.1))",
                border: "1px solid hsl(248 60% 58% / 0.16)",
              }}
            >
              <BrainCircuit className="w-8 h-8" style={{ color: "hsl(248 70% 55%)" }} />
            </div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "hsl(248 70% 52%)" }}
            >
              Extraction unavailable
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              This knowledge workspace is not in your library.
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
              {extractionId
                ? `No extraction matches "${extractionId}".`
                : "No extraction id was provided."} Return to your library to continue from a saved knowledge transformation.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                boxShadow: "0 2px 12px hsl(248 70% 58% / 0.35)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Open Library
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function LoadingExtraction() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={spring.soft}
          className="relative w-full max-w-2xl rounded-3xl border border-white/60 premium-panel overflow-hidden"
          style={{ boxShadow: "0 24px 80px hsl(248 70% 58% / 0.12)" }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, hsl(248 70% 58%), hsl(270 65% 62%), hsl(200 70% 55%))",
            }}
          />
          <div className="relative px-6 py-12 md:px-12">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(248 70% 58% / 0.15), hsl(270 60% 62% / 0.1))",
                }}
              >
                <BrainCircuit className="w-6 h-6" style={{ color: "hsl(248 70% 55%)" }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  Loading workspace
                </p>
                <p className="text-sm text-muted-foreground">Preparing adaptive knowledge blocks</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded-xl bg-muted/70 skeleton-breathe" />
              <div className="h-4 w-full rounded bg-muted/50 skeleton-breathe" />
              <div className="h-4 w-5/6 rounded bg-muted/50 skeleton-breathe" />
              <div className="grid sm:grid-cols-2 gap-3 pt-4">
                <div className="h-24 rounded-2xl bg-muted/40 skeleton-breathe" />
                <div className="h-24 rounded-2xl bg-muted/40 skeleton-breathe" />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function ResultPage({
  params,
}: RouteComponentProps<{ id?: string }>) {
  const { data: extraction, isLoading } = useQuery({
    queryKey: ["extraction", params.id],
    queryFn: () => getExtractionById(params.id),
  });
  const storagePaths = extraction?.metadata.storagePaths ?? [];
  const { data: signedStorageUrls = {} } = useQuery({
    queryKey: ["storage-urls", extraction?.id, storagePaths],
    queryFn: () => getSignedStorageUrls(storagePaths),
    enabled: storagePaths.length > 0,
    staleTime: 45 * 60 * 1000,
  });
  const sourceSlides: SourceSlide[] = useMemo(() => {
    if (!extraction) return [];

    if (storagePaths.length === 0) {
      return extraction.slides;
    }

    return storagePaths.map((path, index) => ({
      ...(extraction.slides[index] ?? fallbackSlide(index, path)),
      id: index + 1,
      storagePath: path,
      imageUrl: signedStorageUrls[path],
    }));
  }, [extraction, signedStorageUrls, storagePaths]);
  const renderableBlocks = useMemo(
    () => extraction?.blocks.filter((block) => hasRenderableContent(block)) ?? [],
    [extraction],
  );
  const tocItems: TocItem[] = useMemo(
    () =>
      extraction
        ? renderableBlocks.map((block) => ({
            id: block.id,
            label: block.title,
            icon: blockIcon(block.kind),
          }))
        : [],
    [extraction, renderableBlocks],
  );
  const sectionIds = useMemo(() => tocItems.map((item) => item.id), [tocItems]);
  const { activeSection, activeIndex, progress, contentRef } =
    useReadingProgress(sectionIds);
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

  const activeTocItem = tocItems[activeIndex] ?? tocItems[0];
  const actionPlan = useMemo(() => actionPlanText(renderableBlocks), [renderableBlocks]);
  const resourceCollection = useMemo(() => resourceCollectionText(renderableBlocks), [renderableBlocks]);
  const catalogIdeas = useMemo(() => catalogIdeasText(renderableBlocks), [renderableBlocks]);
  const markdownExport = useMemo(
    () => extraction ? resultMarkdown({ title: extraction.title, summary: extraction.summary, blocks: renderableBlocks }) : "",
    [extraction, renderableBlocks],
  );
  const quality = (extraction?.metadata as Record<string, unknown> | undefined)?.quality as
    | { extractionQualityScore?: number; groundingScore?: number; hasHallucinationRisk?: boolean; warningCount?: number }
    | undefined;
  const metadataRecord = extraction?.metadata as Record<string, unknown> | undefined;
  const valueSummary = useMemo(
    () => extraction ? extractedValueSummary(extraction.contentType, renderableBlocks) : { summary: "", stats: [] },
    [extraction, renderableBlocks],
  );
  const diagnosticsWarnings = useMemo(
    () => extractionWarnings(renderableBlocks, metadataRecord),
    [renderableBlocks, metadataRecord],
  );
  const contentTypeReason = typeof metadataRecord?.contentTypeReason === "string" ? metadataRecord.contentTypeReason : undefined;
  const showQualityWarning = Boolean(
    quality &&
    ((quality.extractionQualityScore ?? 1) < 0.48 || (quality.groundingScore ?? 1) < 0.18 || quality.hasHallucinationRisk || (quality.warningCount ?? 0) > 0),
  );

  const selectSourceSlide: SourceSlideHandler = (slideIndex) => {
    const index = Math.max(0, Math.min(sourceSlides.length - 1, slideIndex - 1));
    setCarouselOpen(true);
    setActiveSlideSidebar(index);
  };

  const openModal = (idx: number) => {
    setModalSlide(idx);
    setActiveSlideSidebar(idx);
    const targetBlock = tocItems[idx];
    if (targetBlock) scrollTo(targetBlock.id);
    setModalOpen(true);
  };

  if (isLoading) {
    return <LoadingExtraction />;
  }

  if (!extraction) {
    return <MissingExtraction extractionId={params.id} />;
  }

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
                {extraction.metadata.source}
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
                  {activeTocItem?.label ?? "Workspace"}
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
            slides={sourceSlides}
            onClose={() => setCarouselOpen(false)}
            onSlideClick={openModal}
            activeSlide={activeSlideSidebar}
          />

          {/* ── Content column ── */}
          <div className="flex-1 min-w-0 flex gap-8 items-start">
            <div ref={contentRef} className="flex-1 min-w-0 max-w-2xl relative">

              {/* Mobile carousel strip */}
              <MobileCarouselStrip slides={sourceSlides} onSlideClick={openModal} />

              {/* Page header */}
              <motion.header
                className="mb-12"
                style={{ opacity: headerOpacity, y: headerY }}
              >
                <div className="flex flex-wrap gap-2 mb-5">
                  {extraction.metadata.tags.map((tag) => {
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
                  {extraction.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                  <Zap className="w-3.5 h-3.5" style={{ color: "hsl(248 70% 60%)" }} />
                  {extraction.metadata.source}
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  <CopyButton text={markdownExport} label="Copy Markdown" copiedLabel="Markdown copied" />
                  <CopyButton text={extraction.summary} label="Copy summary" copiedLabel="Summary copied" />
                  {actionPlan && <CopyButton text={actionPlan} label="Copy action plan" copiedLabel="Action plan copied" />}
                  {resourceCollection && <CopyButton text={resourceCollection} label="Copy resources" copiedLabel="Resources copied" />}
                  {catalogIdeas && <CopyButton text={catalogIdeas} label="Copy ideas" copiedLabel="Ideas copied" />}
                </div>
                {(valueSummary.summary || valueSummary.stats.length > 0) && (
                  <div className="mt-6 rounded-3xl border premium-surface p-5" style={{ borderColor: "hsl(248 70% 58% / 0.14)" }}>
                    {valueSummary.summary && (
                      <p className="text-sm text-foreground/75 leading-relaxed mb-4">
                        {valueSummary.summary}
                      </p>
                    )}
                    {valueSummary.stats.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {valueSummary.stats.map((stat) => (
                          <ValueStatCard key={stat.label} stat={stat} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {showQualityWarning && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border premium-surface p-4" style={{ borderColor: "hsl(30 90% 55% / 0.18)" }}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(30 90% 45%)" }} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Some details may be incomplete due to OCR quality.
                    </p>
                  </div>
                )}
                <ExtractionDetails
                  quality={quality}
                  warnings={diagnosticsWarnings}
                  contentTypeReason={contentTypeReason}
                />
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

                {renderableBlocks.map((block, index) => (
                  <div key={block.id} className={index === renderableBlocks.length - 1 ? "pb-32" : ""}>
                    <AdaptiveBlock block={block} activeSection={activeSection} onSourceSlide={selectSourceSlide} />
                  </div>
                ))}
              </div>
            </div>

            <ResultToc
              items={tocItems}
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
        label={activeTocItem?.label ?? "Workspace"}
        sectionCount={tocItems.length}
      />

      {/* ── Modal lightbox ── */}
      <AnimatePresence>
        {modalOpen && (
          <CarouselModal
            slides={sourceSlides}
            initialIndex={modalSlide}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
