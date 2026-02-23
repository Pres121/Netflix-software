import { Star, ArrowUpRight, Gauge, Shield, Fuel, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import lexusHero from "@/assets/lexus-hero.png";

const features = [
  { icon: Gauge, title: "471 Horsepower", desc: "5.0L V8 engine delivering breathtaking acceleration" },
  { icon: Shield, title: "Lexus Safety+", desc: "Advanced pre-collision and lane departure systems" },
  { icon: Fuel, title: "Hybrid Available", desc: "LC 500h with multi-stage hybrid for efficiency" },
  { icon: Wrench, title: "4-Year Warranty", desc: "Complimentary maintenance for total peace of mind" },
];

const Index = () => {
  return (
    <div className="bg-[hsl(30,15%,88%)]">
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col">
        <div className="relative flex-1 mx-3 mt-3 rounded-[2rem] hero-gradient overflow-hidden flex flex-col">
          {/* Navigation */}
          <nav className="relative z-30 flex items-center justify-between px-10 lg:px-14 py-4">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight">
                Lexus<span className="font-normal">Motors</span>
              </span>
              <span className="text-primary text-sm">✦</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
              <span className="cursor-pointer hover:text-foreground transition-colors">Models ▾</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Experience</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Pricing ▾</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Dealers</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 120 }}
            >
              <Button className="glass-badge px-5 py-2 rounded-full text-sm font-medium">
                Book a Drive 🚗
              </Button>
            </motion.div>
          </nav>

          {/* Main Hero Area */}
          <div className="relative flex-1">
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none translate-x-[5%] translate-y-[5%]"
              initial={{ opacity: 0, scale: 0.92, y: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, type: "spring", stiffness: 90 }}
            >
              <img
                src={lexusHero}
                alt="Lexus LC 500 luxury coupe"
                className="w-[70%] max-w-[800px] min-w-[300px] h-auto object-contain drop-shadow-2xl mix-blend-multiply"
              />
            </motion.div>

            <div className="absolute top-[8%] left-[30%] z-20 hidden lg:block">
              <div className="glass-badge px-4 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm">
                <span>🏆</span>
                <span>Award-winning craftsmanship<br />& precision engineering!</span>
                <span>🏆</span>
              </div>
            </div>

            <div className="absolute top-[30%] right-[5%] z-20 hidden lg:block">
              <div className="glass-badge px-4 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm">
                <span>⚡</span>
                <span>Pure Performance —<br />Guaranteed Excellence</span>
                <span>⚡</span>
              </div>
            </div>

            <div className="absolute left-10 lg:left-14 top-[18%] z-20">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 star-color fill-current" />
                ))}
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.2rem] xl:text-[5rem] font-black leading-[0.93] tracking-tight text-foreground">
                The New<br />
                Level of<br />
                Luxury<br />
                for Your<br />
                Drive
              </h1>
            </div>

            <div className="absolute right-10 lg:right-14 bottom-[12%] z-20 hidden lg:block">
              <div className="glass-badge rounded-2xl p-4 text-center w-[150px] shadow-sm">
                <div className="w-full h-14 rounded-lg overflow-hidden mb-2 bg-muted">
                  <img src={lexusHero} alt="Lexus fleet" className="w-full h-full object-cover object-center scale-[1.8]" />
                </div>
                <div className="text-2xl font-bold leading-tight">2.7k+</div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  Just Trust Us —<br />We'll Take Care of It
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="relative z-30 footer-surface px-10 lg:px-14 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["hsl(30,60%,55%)","hsl(200,40%,50%)","hsl(350,50%,55%)","hsl(160,40%,45%)","hsl(45,55%,50%)"].map((bg, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-footer" style={{ background: bg }} />
                ))}
              </div>
              <span className="text-lg font-bold ml-1 text-footer-foreground">5k+</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 120, delay: 0.2 }}
            >
              <Button className="bg-background text-foreground px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2">
                Reserve Yours
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-primary mb-3 tracking-widest uppercase">Why Lexus</p>
          <h2 className="font-display text-3xl lg:text-4xl font-black text-foreground mb-12">
            Engineered for Excellence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.15, type: "spring", stiffness: 120 }}
              >
                <Card className="rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-surface mx-3 mb-3 rounded-2xl px-10 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="font-bold text-footer-foreground mb-4">Models</h4>
              <ul className="space-y-2 text-sm text-footer-foreground/60">
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">LC 500</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">LC 500h</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">IS 500</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">LS 500</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-footer-foreground mb-4">Experience</h4>
              <ul className="space-y-2 text-sm text-footer-foreground/60">
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Test Drive</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Virtual Tour</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Comparisons</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Reviews</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-footer-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-footer-foreground/60">
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Find a Dealer</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Service</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Warranty</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-footer-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-footer-foreground/60">
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">About</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Press</li>
                <li className="hover:text-footer-foreground cursor-pointer transition-colors">Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-footer-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-footer-foreground">
                Lexus<span className="font-normal">Motors</span>
              </span>
              <span className="text-primary text-sm">✦</span>
            </div>
            <p className="text-xs text-footer-foreground/40">© 2026 LexusMotors. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
