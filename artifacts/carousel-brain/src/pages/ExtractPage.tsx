import { Navbar } from "@/components/Navbar";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Layers, Loader2, CheckCircle2, Instagram, Link2, ArrowRight, Image, BookOpen, User } from "lucide-react";
import { useLocation } from "wouter";
import { createExtraction, type CreateExtractionInput } from "@/lib/extractions";
import {
  hover,
  spring,
  statePanel,
  tap,
  transition,
} from "@/lib/motion";

type UploadState = "idle" | "uploading" | "processing";
type Mode = "upload" | "link";

const PROCESSING_MESSAGES = [
  "Queued for knowledge extraction...",
  "Processing carousel structure...",
  "Analyzing semantic patterns...",
  "Structuring adaptive knowledge...",
  "Preparing your workspace...",
];

const INSTAGRAM_LINK_PATTERN = /instagram\.com\/(p|reel|tv)\//i;

const MOCK_PREVIEW = {
  account: "@jamesclear",
  handle: "jamesclear",
  slideCount: 10,
  caption: "The 1% rule — why small habits compound into remarkable results.",
  thumbnail: null,
};

export default function ExtractPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("upload");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [showLinkPreview, setShowLinkPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const startUpload = () => {
    setUploadState("uploading");
    setIsDragging(false);
    setProgress(0);

    let p = 0;
    const uploadInterval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(uploadInterval);
        setProgress(100);
        setTimeout(() => startProcessing({ sourceType: "upload", uploadedFiles: [] }), 400);
      } else {
        setProgress(Math.round(p));
      }
    }, 180);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "idle") startUpload();
  };

  const startProcessing = (input: CreateExtractionInput) => {
    setUploadState("processing");
    setMessageIndex(0);
    const extractionJob = createExtraction(input);

    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < PROCESSING_MESSAGES.length) {
        setMessageIndex(msgIdx);
      } else {
        clearInterval(msgInterval);
        extractionJob
          .then((job) => setTimeout(() => setLocation(`/result/${job.id}`), 500))
          .catch(() => setTimeout(() => setLocation("/result/demo"), 500));
      }
    }, 1400);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLinkValue(val);
    setShowLinkPreview(INSTAGRAM_LINK_PATTERN.test(val));
  };

  const handleLinkExtract = () => {
    if (!linkValue.trim()) return;
    startProcessing({ sourceType: "instagram", instagramUrl: linkValue.trim() });
  };

  const handleModeChange = (m: Mode) => {
    if (uploadState !== "idle") return;
    setMode(m);
    setShowLinkPreview(false);
    setLinkValue("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground relative overflow-hidden">
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none processing-glow" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 py-16">
        <div className="w-full max-w-xl">

          <AnimatePresence mode="wait">
            {uploadState === "idle" && (
              <motion.div
                key="idle"
                variants={statePanel}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Page header */}
                <div className="text-center mb-10">
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-3xl font-bold tracking-tight mb-2"
                  >
                    Extract Knowledge
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="text-muted-foreground"
                  >
                    Transform your saved carousels into structured intelligence.
                  </motion.p>
                </div>

                {/* Mode switcher */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="relative flex items-center bg-muted/60 border border-border rounded-2xl p-1 mb-8 gap-1"
                >
                  <motion.div
                    layoutId="mode-pill"
                    className="absolute inset-y-1 rounded-xl bg-card shadow-sm border border-border/60"
                    style={{
                      left: mode === "upload" ? "4px" : "calc(50% + 2px)",
                      width: "calc(50% - 6px)",
                    }}
                    transition={spring.layout}
                  />
                  <button
                    data-testid="tab-upload"
                    onClick={() => handleModeChange("upload")}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors duration-200 ${
                      mode === "upload" ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Upload Images
                  </button>
                  <button
                    data-testid="tab-link"
                    onClick={() => handleModeChange("link")}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors duration-200 ${
                      mode === "link" ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <Link2 className="w-4 h-4" />
                    Paste Instagram Link
                  </button>
                </motion.div>

                {/* Panel content */}
                <AnimatePresence mode="wait">
                  {mode === "upload" ? (
                    <motion.div
                      key="upload-panel"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={transition.enter}
                    >
                      <div
                        data-testid="dropzone-upload"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => startUpload()}
                        className={`
                          relative group cursor-pointer w-full rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 bg-card/90 premium-surface
                          ${isDragging
                            ? "border-primary bg-primary/5 scale-[1.015]"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                          }
                        `}
                        style={{ minHeight: "280px" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                        <motion.div
                          animate={isDragging ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="relative mb-5"
                        >
                          <Layers className="w-14 h-14 text-muted-foreground/20 absolute top-2 left-2" />
                          <UploadCloud className={`w-14 h-14 relative z-10 transition-colors duration-300 ${isDragging ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary/60"}`} />
                        </motion.div>

                        <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${isDragging ? "text-primary" : ""}`}>
                          {isDragging ? "Release to upload" : "Click or drag images here"}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                          Supports PNG, JPG — up to 10 slides from a single carousel post
                        </p>

                        <div className="flex items-center gap-3 mt-8">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={isDragging ? { y: [0, -4 - i * 2, 0] } : {}}
                              transition={{ duration: 0.6, delay: i * 0.08, repeat: isDragging ? Infinity : 0 }}
                              className="w-10 h-12 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center"
                              style={{ transform: `rotate(${(i - 1) * 4}deg)` }}
                            >
                              <Image className="w-4 h-4 text-muted-foreground/40" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="link-panel"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={transition.enter}
                      className="flex flex-col items-center"
                    >
                      {/* Link input */}
                      <div className="w-full relative group">
                        <div className={`
                          relative flex items-center bg-card border rounded-2xl transition-all duration-300 overflow-hidden
                          ${linkValue ? "border-primary/40 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]" : "border-border group-focus-within:border-primary/40 group-focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"}
                        `}>
                          <div className="pl-5 pr-3 text-muted-foreground/50 flex-shrink-0">
                            <Instagram className="w-5 h-5" />
                          </div>
                          <input
                            ref={inputRef}
                            data-testid="input-instagram-link"
                            type="url"
                            value={linkValue}
                            onChange={handleLinkChange}
                            placeholder="Paste an Instagram carousel link…"
                            className="flex-1 py-4 pr-4 text-base bg-transparent outline-none placeholder:text-muted-foreground/40 text-foreground"
                          />
                        </div>
                      </div>

                      {/* Link preview card */}
                      <AnimatePresence>
                        {showLinkPreview && (
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={spring.soft}
                            className="w-full mt-4"
                          >
                            <div className="bg-card/95 border border-border rounded-2xl overflow-hidden premium-surface">
                              <div className="flex items-stretch">
                                {/* Thumbnail mock */}
                                <div className="w-20 flex-shrink-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
                                  <BookOpen className="w-7 h-7 text-primary/50" />
                                </div>
                                <div className="flex-1 p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                                      <User className="w-3.5 h-3.5 text-primary/60" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{MOCK_PREVIEW.account}</span>
                                    <span className="text-xs text-muted-foreground/60">· {MOCK_PREVIEW.slideCount} slides</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{MOCK_PREVIEW.caption}</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                      Ready to analyze
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Extract button */}
                      <motion.button
                        data-testid="button-extract-link"
                        onClick={handleLinkExtract}
                        disabled={!linkValue.trim()}
                        whileHover={linkValue.trim() ? hover.glow : {}}
                        whileTap={linkValue.trim() ? tap.press : {}}
                        className={`
                          mt-6 w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 transition-all duration-300
                          ${linkValue.trim()
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                          }
                        `}
                      >
                        Extract knowledge
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {uploadState === "uploading" && (
              <motion.div
                key="uploading"
                variants={statePanel}
                initial="initial"
                animate="animate"
                exit="exit"
                className="premium-panel border border-border p-12 rounded-3xl flex flex-col items-center text-center"
              >
                <div className="relative mb-8 w-16 h-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-muted border-t-primary rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
                    {progress}%
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-1.5">Uploading your carousel…</h3>
                <p className="text-muted-foreground text-sm mb-8">Preparing files for analysis</p>

                <div className="w-full max-w-[260px] bg-muted h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={spring.soft}
                  />
                </div>
              </motion.div>
            )}

            {uploadState === "processing" && (
              <motion.div
                key="processing"
                variants={statePanel}
                initial="initial"
                animate="animate"
                exit="exit"
                className="premium-panel border border-border p-10 rounded-3xl flex flex-col items-center w-full"
              >
                {/* Pulse orb */}
                <div className="relative w-16 h-16 flex items-center justify-center mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.12, 0.22, 0.12] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary rounded-full processing-glow"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.38, 0.2] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="absolute inset-2 bg-primary/80 rounded-full"
                  />
                  <div className="relative z-10 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    {messageIndex === PROCESSING_MESSAGES.length - 1 ? (
                      <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                    )}
                  </div>
                </div>

                {/* Cycling message */}
                <div className="relative h-8 w-full mb-3 overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    <motion.h3
                      key={messageIndex}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={transition.enter}
                      className="absolute inset-0 text-xl font-semibold text-center"
                    >
                      {PROCESSING_MESSAGES[messageIndex]}
                    </motion.h3>
                  </AnimatePresence>
                </div>

                {/* Step dots */}
                <div className="flex items-center gap-2 mb-10">
                  {PROCESSING_MESSAGES.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === messageIndex ? 20 : 6,
                        backgroundColor: i <= messageIndex ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      }}
                      transition={spring.snappy}
                      className="h-1.5 rounded-full"
                    />
                  ))}
                </div>

                {/* Skeleton knowledge layout */}
                <div className="w-full space-y-5 border border-border/80 rounded-2xl p-6 bg-muted/15 premium-surface">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-24 bg-muted/80 skeleton-breathe rounded-md" />
                    <div className="h-5 w-16 bg-primary/10 skeleton-breathe rounded-md" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3 w-full bg-muted/60 skeleton-breathe rounded" />
                    <div className="h-3 w-[90%] bg-muted/60 skeleton-breathe rounded" />
                    <div className="h-3 w-[75%] bg-muted/60 skeleton-breathe rounded" />
                  </div>
                  <div className="pt-2 space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary/12 skeleton-breathe flex-shrink-0" />
                        <div className="h-3 rounded skeleton-breathe bg-muted/50" style={{ width: `${70 - i * 10}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <div className="h-7 w-20 bg-primary/10 skeleton-breathe rounded-lg" />
                    <div className="h-7 w-16 bg-muted/60 skeleton-breathe rounded-lg" />
                    <div className="h-7 w-24 bg-muted/60 skeleton-breathe rounded-lg" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
