import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Open the canvas",
    description: "Click 'Start Creating' and you're in. No signup required to try it out.",
  },
  {
    number: "02",
    title: "Pick your tools",
    description: "Select from drawing, shapes, text, or connectors from the toolbar.",
  },
  {
    number: "03",
    title: "Create freely",
    description: "Draw, type, drag, and arrange. Your infinite canvas awaits.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-secondary/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Start in seconds
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No learning curve. Just open and create.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -z-10" />
              )}
              
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cta-gradient text-primary-foreground font-bold text-xl mb-4 shadow-glow">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
