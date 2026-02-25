import { useState } from "react";
import { motion } from "framer-motion";
import DeviceDisplay from "./DeviceDisplay";
import DeviceSelector from "./DeviceSelector";
import FeaturesGrid from "./FeaturesGrid";
import type { DeviceType } from "./DeviceSelector";

const HeroSection = () => {
  const [activeDevice, setActiveDevice] = useState<DeviceType>("phone");

  return (
    <section className="hero-gradient relative overflow-hidden">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(210 40% 98%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 40% 98%) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex items-stretch min-h-[600px]">
          {/* Left content */}
          <div className="flex-1 flex flex-col justify-center py-16 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-3 mb-5"
            >
              <div className="w-8 h-0.5 bg-primary" />
              <span className="text-primary font-semibold text-sm tracking-wider uppercase">
                We Are Kron.it
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg font-medium text-foreground/70 mb-1 font-display"
            >
              Your Partner For Repairs Of All
            </motion.h2>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="text-5xl lg:text-6xl font-bold font-display leading-[1.1] mb-8"
            >
              Electronic<br />Devices
            </motion.h1>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="self-start bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-full text-sm animate-pulse-glow hover:brightness-110 transition-all"
            >
              I Need A Repair
            </motion.button>

            <FeaturesGrid />
          </div>

          {/* Center device display */}
          <div className="flex-1 flex items-center justify-center relative">
            <DeviceDisplay activeDevice={activeDevice} />
          </div>

          {/* Right device selector */}
          <div className="flex items-center py-16">
            <DeviceSelector activeDevice={activeDevice} onDeviceChange={setActiveDevice} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
