import { motion } from "framer-motion";
import { Zap, Settings, DollarSign, Shield } from "lucide-react";

const features = [
  { icon: Zap, text: "Fast Diagnostics" },
  { icon: Settings, text: "Quality Service" },
  { icon: DollarSign, text: "Affordable Prices" },
  { icon: Shield, text: "1 Year Warranty" },
];

const FeaturesGrid = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="glass-card overflow-hidden mt-8 max-w-[420px]"
    >
      <div className="grid grid-cols-2">
        {features.map((feature, i) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 + i * 0.1 }}
            className={`flex items-center gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors cursor-default
              ${i % 2 === 0 ? "border-r border-border/30" : ""}
              ${i < 2 ? "border-b border-border/30" : ""}
            `}
          >
            <feature.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground">{feature.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FeaturesGrid;
