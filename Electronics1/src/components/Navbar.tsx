import { motion } from "framer-motion";
import { ChevronDown, ArrowRight, Menu } from "lucide-react";

const navItems = ["Homepage", "About Us", "Partnership", "Status", "Blog"];

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="py-4 px-6 border-b border-border/20"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <h2 className="text-2xl font-bold font-display tracking-wider">
            KR<span className="text-primary">O</span>N
          </h2>
          <div className="flex items-center gap-8">
            {navItems.map((item, i) => (
              <motion.a
                key={item}
                href="#"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 relative group"
              >
                {item}
                {item === "About Us" && <ChevronDown className="h-3 w-3" />}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.a
            href="#"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors"
          >
            Start Your Repair <ArrowRight className="h-4 w-4" />
          </motion.a>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-2 hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
