import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Layers, Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

type UploadState = "idle" | "uploading" | "processing";

const PROCESSING_MESSAGES = [
  "Analyzing your carousel...",
  "Extracting key concepts...",
  "Structuring insights...",
  "Building your knowledge page..."
];

export default function ExtractPage() {
  const [, setLocation] = useLocation();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const startUpload = () => {
    setUploadState("uploading");
    setIsDragging(false);
    
    // Simulate upload progress
    let p = 0;
    const uploadInterval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(uploadInterval);
        startProcessing();
      }
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "idle") {
      startUpload();
    }
  };

  const startProcessing = () => {
    setUploadState("processing");
    
    // Simulate processing messages
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx++;
      if (msgIdx < PROCESSING_MESSAGES.length) {
        setMessageIndex(msgIdx);
      } else {
        clearInterval(msgInterval);
        setTimeout(() => {
          setLocation("/result/demo");
        }, 1000);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Subtle floating background gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            
            {uploadState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-bold mb-3">Extract Knowledge</h1>
                  <p className="text-muted-foreground">Drop your Instagram carousel screenshots here to begin.</p>
                </div>

                <div 
                  data-testid="dropzone-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative group cursor-pointer aspect-[3/2] w-full rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 bg-card
                    ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                  `}
                  onClick={() => uploadState === "idle" && startUpload()}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                  
                  <motion.div 
                    animate={isDragging ? { y: -10 } : { y: 0 }}
                    className="relative mb-6 text-primary"
                  >
                    <Layers className="w-16 h-16 text-muted-foreground/30 absolute top-2 left-2" />
                    <UploadCloud className="w-16 h-16 relative z-10 drop-shadow-sm" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-2">Click or drag images here</h3>
                  <p className="text-sm text-muted-foreground max-w-sm text-center">
                    Supports PNG, JPG up to 10 images from a single carousel post.
                  </p>
                </div>
              </motion.div>
            )}

            {uploadState === "uploading" && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.4 }}
                className="bg-card p-10 rounded-3xl shadow-xl shadow-primary/5 border border-border flex flex-col items-center text-center"
              >
                <div className="relative mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-muted border-t-primary rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-medium text-sm">
                    {progress}%
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Uploading your carousel...</h3>
                <p className="text-muted-foreground">Preparing files for analysis</p>
                
                <div className="w-full max-w-xs bg-muted h-2 rounded-full mt-8 overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {uploadState === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card p-10 rounded-3xl shadow-xl shadow-primary/5 border border-border flex flex-col items-center w-full"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-8 relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary/20 rounded-full"
                  />
                  {messageIndex === PROCESSING_MESSAGES.length - 1 ? (
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  )}
                </div>
                
                <div className="h-8 overflow-hidden relative w-full mb-8">
                  <AnimatePresence mode="popLayout">
                    <motion.h3
                      key={messageIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="text-xl font-semibold absolute inset-0 text-center"
                    >
                      {PROCESSING_MESSAGES[messageIndex]}
                    </motion.h3>
                  </AnimatePresence>
                </div>

                {/* Animated Skeleton Placeholder for UI */}
                <div className="w-full space-y-4 border border-border rounded-xl p-6 bg-muted/20">
                  <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted/60 animate-pulse rounded" />
                    <div className="h-3 w-5/6 bg-muted/60 animate-pulse rounded" />
                    <div className="h-3 w-4/6 bg-muted/60 animate-pulse rounded" />
                  </div>
                  <div className="pt-4 flex gap-3">
                     <div className="h-8 w-20 bg-primary/10 animate-pulse rounded-md" />
                     <div className="h-8 w-24 bg-primary/10 animate-pulse rounded-md" />
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
