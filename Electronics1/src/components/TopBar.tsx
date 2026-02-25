import { motion } from "framer-motion";
import { Phone, Mail, FileText } from "lucide-react";

const TopBar = () => {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="top-bar-gradient border-b border-border/30 py-2.5 px-6 text-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>Contact Phone (8AM - 3PM):</span>
          <span className="font-semibold text-foreground">+386 (0)30 685 808</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span>Email:</span>
          <span className="font-semibold text-foreground">info@kron.it</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>Quick Contact (Express):</span>
          <span className="font-semibold text-foreground underline cursor-pointer hover:text-primary transition-colors">
            Fill Out Form ↗
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar;
