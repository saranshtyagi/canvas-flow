import { motion } from "framer-motion";
import { Pencil, Shapes, Type, Palette, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Pencil,
    title: "Freehand Drawing",
    description: "Sketch your ideas naturally with smooth, pressure-sensitive drawing tools.",
    color: "primary",
  },
  {
    icon: Shapes,
    title: "Smart Shapes",
    description: "Drop in rectangles, circles, arrows, and more with just a click.",
    color: "accent",
  },
  {
    icon: Type,
    title: "Rich Text",
    description: "Add labels, notes, and annotations anywhere on your canvas.",
    color: "primary",
  },
  {
    icon: Palette,
    title: "Custom Styles",
    description: "Choose colors, stroke widths, and fills to match your vision.",
    color: "accent",
  },
  {
    icon: Users,
    title: "Real-time Collab",
    description: "Work together seamlessly with live cursors and instant sync.",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for performance. Your canvas stays smooth at any scale.",
    color: "accent",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 bg-background">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need to create
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools that feel simple. Start creating in seconds.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl bg-card-gradient border border-border p-6 hover:shadow-medium transition-all duration-300"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${
                  feature.color === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
