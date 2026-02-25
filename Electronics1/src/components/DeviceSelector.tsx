import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Tablet, Headphones, Gamepad2, Monitor } from "lucide-react";

export type DeviceType = "phone" | "tablet" | "headphones" | "controller" | "laptop";

const devices: { type: DeviceType; icon: React.ElementType; label: string }[] = [
  { type: "phone", icon: Smartphone, label: "Telefon" },
  { type: "tablet", icon: Tablet, label: "Tablica" },
  { type: "headphones", icon: Headphones, label: "Slušalke" },
  { type: "controller", icon: Gamepad2, label: "Konzola" },
  { type: "laptop", icon: Monitor, label: "Računalnik" },
];

interface DeviceSelectorProps {
  activeDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

const DeviceSelector = ({ activeDevice, onDeviceChange }: DeviceSelectorProps) => {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.6 }}
      className="flex flex-col gap-3"
    >
      {devices.map((device, i) => {
        const isActive = activeDevice === device.type;
        return (
          <motion.button
            key={device.type}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.1 + i * 0.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDeviceChange(device.type)}
            className={`relative w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isActive
                ? "device-selector-active border-primary"
                : "border-border/50 bg-secondary/30 hover:border-muted-foreground/50"
            }`}
            aria-label={device.label}
          >
            <device.icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            {isActive && (
              <motion.div
                layoutId="device-indicator"
                className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default DeviceSelector;
