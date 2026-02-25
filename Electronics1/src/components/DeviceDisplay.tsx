import { motion, AnimatePresence } from "framer-motion";
import type { DeviceType } from "./DeviceSelector";

import phoneImg from "@/assets/device-phone.png";
import tabletImg from "@/assets/device-tablet.png";
import headphonesImg from "@/assets/device-headphones.png";
import controllerImg from "@/assets/device-controller.png";
import laptopImg from "@/assets/device-laptop.png";

const deviceImages: Record<DeviceType, string> = {
  phone: phoneImg,
  tablet: tabletImg,
  headphones: headphonesImg,
  controller: controllerImg,
  laptop: laptopImg,
};

const deviceLabels: Record<DeviceType, string> = {
  phone: "Broken Screen?",
  tablet: "Slow Tablet?",
  headphones: "Broken Headphones?",
  controller: "Faulty Controller?",
  laptop: "Computer Issues?",
};

interface DeviceDisplayProps {
  activeDevice: DeviceType;
}

const DeviceDisplay = ({ activeDevice }: DeviceDisplayProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      {/* Ambient glow behind device */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-25 bg-accent" />

      {/* Label above device */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`label-${activeDevice}`}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.3 }}
          className="text-foreground font-medium text-base mb-6 z-10"
        >
          {deviceLabels[activeDevice]}
        </motion.p>
      </AnimatePresence>

      {/* Device image with 3D transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDevice}
          initial={{ opacity: 0, scale: 0.75, rotateY: -40, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.75, rotateY: 40, filter: "blur(8px)" }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10"
          style={{ perspective: "1000px" }}
        >
          <motion.img
            src={deviceImages[activeDevice]}
            alt={deviceLabels[activeDevice]}
            className="h-[460px] w-auto object-contain drop-shadow-2xl mix-blend-lighten"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DeviceDisplay;
