import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-4 overflow-hidden bg-hero-gradient">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Now in Beta — Free to use</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
          >
            Think visually.
            <br />
            <span className="text-gradient-primary">Create together.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10"
          >
            A beautiful infinite canvas for brainstorming, sketching, and bringing your ideas to life. 
            Simple, fast, and delightfully intuitive.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/canvas">
              <Button variant="hero" size="xl" className="group">
                Start Creating
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="glass" size="xl">
              Watch Demo
            </Button>
          </motion.div>
        </div>

        {/* Canvas Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20"
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Floating elements around the preview */}
            <motion.div
              className="absolute -top-6 -left-6 w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="w-8 h-8 rounded-lg bg-accent-gradient" />
            </motion.div>
            
            <motion.div
              className="absolute -top-4 -right-8 w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
              animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
            >
              <div className="w-6 h-6 rounded-full bg-cta-gradient" />
            </motion.div>

            <motion.div
              className="absolute -bottom-4 left-1/4 w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <div className="w-5 h-1 rounded-full bg-muted-foreground" />
            </motion.div>

            {/* Main preview card */}
            <div className="rounded-3xl bg-card-gradient border border-border shadow-medium overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground">Untitled Board</span>
                </div>
              </div>
              
              {/* Canvas area */}
              <div className="relative h-80 sm:h-96 bg-background/50 p-8">
                {/* Simulated canvas elements */}
                <motion.div
                  className="absolute top-8 left-8 w-32 h-24 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  <span className="text-xs font-medium text-primary/70">Idea 1</span>
                </motion.div>

                <motion.div
                  className="absolute top-16 right-12 w-40 h-20 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                >
                  <span className="text-xs font-medium text-accent">Concept</span>
                </motion.div>

                <motion.div
                  className="absolute bottom-12 left-1/3 w-36 h-28 rounded-xl bg-secondary border border-border flex items-center justify-center p-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="h-1.5 w-full rounded bg-muted-foreground/30" />
                    <div className="h-1.5 w-4/5 rounded bg-muted-foreground/20" />
                    <div className="h-1.5 w-2/3 rounded bg-muted-foreground/20" />
                  </div>
                </motion.div>

                {/* Connection line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <motion.path
                    d="M 120 60 Q 200 100 280 76"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
