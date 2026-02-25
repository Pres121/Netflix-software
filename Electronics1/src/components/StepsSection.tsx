import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Fill out the form", link: "Click" },
  { num: "02", title: "Your device arrives at our service center, we run diagnostics and inform you of the repair costs." },
  { num: "03", title: "The device is repaired and shipped back to your preferred address." },
];

const StepsSection = () => {
  return (
    <div className="border-t border-border/30 bg-background">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + i * 0.15 }}
              whileHover={{ y: -4 }}
              className="step-card group"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl border border-border/50 text-foreground font-display font-bold text-base mb-5 group-hover:border-primary/50 transition-colors">
                {step.num}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.title}</p>
              {step.link && (
                <p className="text-sm font-bold text-foreground underline underline-offset-4 mt-2 cursor-pointer hover:text-primary transition-colors">
                  {step.link}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepsSection;
