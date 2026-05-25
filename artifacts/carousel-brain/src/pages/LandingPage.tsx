import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Brain, Zap, Layers, BookOpen } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl mx-auto px-4 pt-32 pb-24 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Turn raw pixels into structured thought</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.1] mb-6">
              Turn saved carousels into <span className="text-primary italic font-serif">actionable knowledge.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Upload educational Instagram posts and transform them into beautiful summaries, learning paths, concepts, and action steps.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/extract" 
                className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-medium transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
                data-testid="button-start-extracting"
              >
                Start extracting <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                href="/result/demo" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-8 py-4 rounded-xl text-lg font-medium transition-colors"
                data-testid="link-see-example"
              >
                See example
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Animated Mock Section */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative bg-card rounded-3xl shadow-xl shadow-black/5 border border-border overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-background/50 pointer-events-none" />
            <div className="flex flex-col md:flex-row h-full">
              {/* Left side: "Raw content" */}
              <div className="w-full md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-border bg-muted/30 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
                  <div>
                    <div className="w-24 h-3 bg-muted-foreground/30 rounded mb-2" />
                    <div className="w-16 h-2 bg-muted-foreground/20 rounded" />
                  </div>
                </div>
                <div className="aspect-square rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-muted" />
                  <Layers className="w-16 h-16 text-muted-foreground/40 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
              
              {/* Right side: "Structured Knowledge" */}
              <div className="w-full md:w-7/12 p-8 flex flex-col justify-center gap-4 bg-card">
                <div className="w-full max-w-sm">
                  <div className="h-6 w-3/4 bg-foreground/90 rounded mb-4" />
                  <div className="space-y-2 mb-6">
                    <div className="h-3 w-full bg-muted-foreground/20 rounded" />
                    <div className="h-3 w-5/6 bg-muted-foreground/20 rounded" />
                    <div className="h-3 w-4/6 bg-muted-foreground/20 rounded" />
                  </div>
                  <div className="flex gap-2 mb-6">
                    <div className="h-6 w-16 bg-primary/10 rounded-full" />
                    <div className="h-6 w-20 bg-primary/10 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-muted/50 rounded-lg flex items-center px-3 gap-3">
                       <div className="w-4 h-4 rounded-sm bg-primary/40" />
                       <div className="h-2 w-1/2 bg-muted-foreground/30 rounded" />
                    </div>
                    <div className="h-10 w-full bg-muted/50 rounded-lg flex items-center px-3 gap-3">
                       <div className="w-4 h-4 rounded-sm bg-primary/40" />
                       <div className="h-2 w-2/3 bg-muted-foreground/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Center transformation icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hidden md:flex">
              <Zap className="w-8 h-8" />
            </div>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="w-full bg-muted/30 py-32 border-y border-border">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg">Three effortless steps to build your knowledge base.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Layers, title: "1. Save & Upload", desc: "Screenshot that insightful 10-slide carousel you just found on Instagram." },
                { icon: Brain, title: "2. AI Extraction", desc: "Our engine reads the text, understands the context, and distills the core ideas." },
                { icon: BookOpen, title: "3. Review & Learn", desc: "Get a beautifully formatted knowledge page with action steps and learning paths." }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-card p-8 rounded-2xl border border-border shadow-sm"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="w-full max-w-3xl mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-serif italic text-foreground/90 mb-8">
              "We consume hundreds of ideas daily, but retain almost none."
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              CarouselBrain is built for people who care about learning. It's not just about saving content—it's about transforming passive consumption into active, structured knowledge that you can actually use.
            </p>
            <Link 
              href="/extract" 
              className="inline-flex text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Start building your library &rarr;
            </Link>
          </motion.div>
        </section>

      </main>
      
      <footer className="w-full border-t border-border py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} CarouselBrain. Crafted with care.</p>
      </footer>
    </div>
  );
}
