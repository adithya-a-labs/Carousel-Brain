import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Brain, Zap, Layers, BookOpen, Check } from "lucide-react";
import {
  hover,
  scrollViewport,
  staggerContainer,
  staggerItem,
  tap,
  transition,
} from "@/lib/motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col items-center">

        {/* ── Hero ── */}
        <section className="relative w-full max-w-5xl mx-auto px-4 pt-28 pb-20 text-center">
          {/* Glow orbs */}
          <div className="orb w-[600px] h-[500px] top-[-100px] left-1/2 -translate-x-1/2 animate-float-slow"
            style={{ background: "radial-gradient(circle, hsl(248 70% 68% / 0.18) 0%, transparent 70%)" }} />
          <div className="orb w-[350px] h-[350px] top-16 left-[5%] animate-float-medium"
            style={{ background: "radial-gradient(circle, hsl(280 70% 68% / 0.13) 0%, transparent 70%)" }} />
          <div className="orb w-[300px] h-[300px] top-32 right-[5%] animate-float-slow"
            style={{ background: "radial-gradient(circle, hsl(220 80% 68% / 0.12) 0%, transparent 70%)", animationDelay: "4s" }} />

          <motion.div
            variants={staggerContainer(0.1, 0.08)}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center relative z-10"
          >
            {/* Badge */}
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border"
              style={{
                background: "linear-gradient(135deg, hsl(248 70% 58% / 0.12), hsl(280 60% 65% / 0.08))",
                borderColor: "hsl(248 70% 58% / 0.25)",
                color: "hsl(248 70% 50%)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Turn raw pixels into structured thought
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={staggerItem}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 max-w-4xl"
            >
              Turn saved carousels into{" "}
              <span className="gradient-text italic" style={{ fontFamily: "Georgia, serif" }}>
                actionable knowledge.
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={staggerItem}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
            >
              Upload educational Instagram posts and transform them into summaries, learning paths, concepts, and action steps.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={staggerItem} className="flex flex-col items-center">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/extract"
                  data-testid="button-start-extracting"
                  className="group relative overflow-hidden flex items-center gap-2 text-white px-8 py-4 rounded-2xl text-[17px] font-semibold transition-all"
                  style={{
                    background: "linear-gradient(135deg, hsl(248 70% 56%), hsl(270 65% 60%))",
                    boxShadow: "0 4px 20px hsl(248 70% 58% / 0.45), 0 1px 0 rgba(255,255,255,0.15) inset"
                  }}
                >
                  <motion.span
                    whileHover={hover.glow}
                    whileTap={tap.deep}
                    className="flex items-center gap-2"
                  >
                    Start extracting
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </motion.span>
                  {/* Shimmer */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </span>
                </Link>
                <Link
                  href="/result/demo"
                  data-testid="link-see-example"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-8 py-4 rounded-2xl text-[17px] font-medium transition-colors hover:bg-black/4"
                >
                  See example
                </Link>
              </div>
              <p
                className="mt-3.5 text-sm text-muted-foreground/65 tracking-wide"
                data-testid="text-demo-helper"
              >
                No signup required for demo
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Transformation Preview ── */}
        <section className="w-full max-w-5xl mx-auto px-4 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={transition.enter}
            className="relative rounded-3xl overflow-hidden border premium-surface"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))",
              borderColor: "hsl(248 70% 58% / 0.15)",
              boxShadow: "0 24px 80px hsl(248 70% 58% / 0.12), 0 4px 16px hsl(248 70% 58% / 0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
            }}
          >
            {/* Top gradient bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(248 70% 58%), hsl(270 65% 62%), hsl(220 80% 62%))" }} />

            <div className="flex flex-col md:flex-row">
              {/* Left — raw */}
              <div className="w-full md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center"
                style={{ background: "linear-gradient(135deg, hsl(240 20% 97%), hsl(248 30% 96%))" }}>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">Raw carousel</div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full animate-pulse"
                    style={{ background: "linear-gradient(135deg, hsl(248 70% 68%), hsl(280 60% 72%))" }} />
                  <div>
                    <div className="w-20 h-2.5 bg-foreground/20 rounded mb-1.5" />
                    <div className="w-14 h-2 bg-foreground/10 rounded" />
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-2xl relative overflow-hidden border border-white/60"
                  style={{ background: "linear-gradient(135deg, hsl(248 40% 90%), hsl(280 35% 88%))", boxShadow: "0 4px 20px rgba(80,60,180,0.1)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layers className="w-14 h-14 text-primary/20" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
                    <div className="h-2 bg-white/40 rounded" />
                    <div className="h-2 w-4/5 bg-white/30 rounded" />
                    <div className="h-2 w-3/5 bg-white/25 rounded" />
                  </div>
                </div>
              </div>

              {/* Center transform badge */}
              <div className="absolute top-1/2 left-5/12 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 65% 62%))", boxShadow: "0 4px 16px hsl(248 70% 58% / 0.5)" }}>
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              {/* Right — structured */}
              <div className="w-full md:w-7/12 p-8 flex flex-col justify-center gap-5 bg-white/60">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Structured knowledge</div>
                <div>
                  <div className="h-5 w-3/4 rounded-md mb-3" style={{ background: "linear-gradient(90deg, hsl(240 15% 15%), hsl(240 12% 22%))" }} />
                  <div className="flex gap-2 mb-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "hsl(248 70% 58% / 0.12)", color: "hsl(248 70% 50%)" }}>Productivity</span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "hsl(280 60% 58% / 0.12)", color: "hsl(280 60% 46%)" }}>Psychology</span>
                  </div>
                  <div className="space-y-2 mb-5">
                    <div className="h-2.5 w-full bg-foreground/10 rounded" />
                    <div className="h-2.5 w-5/6 bg-foreground/8 rounded" />
                    <div className="h-2.5 w-4/6 bg-foreground/6 rounded" />
                  </div>
                  <div className="space-y-2">
                    {[Check, Check, Check].map((Icon, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/60"
                        style={{ background: "hsl(240 20% 98%)" }}>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, hsl(248 70% 58%), hsl(270 60% 62%))" }}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="h-2 rounded flex-1" style={{ width: `${70 - i * 8}%`, background: "hsl(240 12% 78%)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── How it works ── */}
        <section className="w-full py-28 border-y relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, hsl(248 50% 98%), hsl(270 40% 97%))",
            borderColor: "hsl(248 40% 90%)"
          }}>
          <div className="orb w-[500px] h-[400px] top-0 left-1/2 -translate-x-1/2"
            style={{ background: "radial-gradient(circle, hsl(248 70% 68% / 0.1) 0%, transparent 70%)" }} />

          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "hsl(248 70% 58%)" }}>Process</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg">Three effortless steps to build your knowledge base.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Layers,
                  title: "1. Save & Upload",
                  desc: "Screenshot that insightful 10-slide carousel you just found on Instagram.",
                  gradient: "linear-gradient(135deg, hsl(248 70% 58% / 0.15), hsl(248 70% 58% / 0.05))",
                  iconBg: "linear-gradient(135deg, hsl(248 70% 58%), hsl(260 65% 62%))",
                },
                {
                  icon: Brain,
                  title: "2. AI Extraction",
                  desc: "Our engine reads the text, understands the context, and distills the core ideas.",
                  gradient: "linear-gradient(135deg, hsl(270 65% 62% / 0.15), hsl(270 65% 62% / 0.05))",
                  iconBg: "linear-gradient(135deg, hsl(270 65% 58%), hsl(290 60% 62%))",
                },
                {
                  icon: BookOpen,
                  title: "3. Review & Learn",
                  desc: "Get a beautifully formatted knowledge page with action steps and learning paths.",
                  gradient: "linear-gradient(135deg, hsl(220 80% 62% / 0.15), hsl(220 80% 62% / 0.05))",
                  iconBg: "linear-gradient(135deg, hsl(220 80% 58%), hsl(240 75% 62%))",
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, ...transition.enter }}
                  whileHover={hover.card}
                  className="relative p-8 rounded-3xl border overflow-hidden cursor-default premium-surface premium-surface-interactive"
                  style={{
                    borderColor: "rgba(120,100,220,0.12)",
                  }}
                >
                  <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ background: step.gradient }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-md"
                      style={{ background: step.iconBg, boxShadow: "0 4px 14px rgba(80,60,180,0.25)" }}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Philosophy ── */}
        <section className="w-full max-w-3xl mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={scrollViewport}
            transition={transition.enter}
            className="relative p-12 rounded-3xl border premium-surface"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.85), rgba(248,246,255,0.9))",
              borderColor: "hsl(248 60% 58% / 0.15)",
              boxShadow: "0 20px 60px hsl(248 60% 58% / 0.08)"
            }}
          >
            <div className="orb w-[300px] h-[200px] top-0 left-1/2 -translate-x-1/2"
              style={{ background: "radial-gradient(circle, hsl(270 70% 68% / 0.12) 0%, transparent 70%)" }} />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-serif italic mb-6 leading-relaxed"
                style={{ color: "hsl(240 20% 18%)" }}>
                "We consume hundreds of ideas daily, but retain almost none."
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
                CarouselBrain is built for people who care about learning. It's not just about saving content — it's about transforming passive consumption into active, structured knowledge you can actually use.
              </p>
              <Link
                href="/extract"
                className="inline-flex items-center gap-2 font-semibold transition-all"
                style={{ color: "hsl(248 70% 55%)" }}
              >
                Start building your library <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="w-full border-t border-border/50 py-8 text-center text-muted-foreground/60 text-sm">
        <p>© {new Date().getFullYear()} CarouselBrain. Built for curious minds.</p>
      </footer>
    </div>
  );
}
