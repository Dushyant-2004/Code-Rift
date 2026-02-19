"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Code2,
  Shield,
  Zap,
  BarChart3,
  Bug,
  Sparkles,
  Terminal,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

/* ── Typing hook ── */
function useTypingEffect(words: string[], typingSpeed = 80, deletingSpeed = 50, pauseTime = 2000) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && text === current) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      timeout = setTimeout(
        () => {
          setText(
            isDeleting
              ? current.substring(0, text.length - 1)
              : current.substring(0, text.length + 1)
          );
        },
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

  return text;
}

/* ── Floating particles ── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-brand-400/30 rounded-full"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 4,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated code preview ── */
const codeLines = [
  { indent: 0, text: "function analyzeCode(input) {", color: "text-purple-400" },
  { indent: 1, text: "const issues = scanner.detect(input);", color: "text-cyan-300" },
  { indent: 1, text: "const score = quality.evaluate(input);", color: "text-cyan-300" },
  { indent: 1, text: "const fixes = ai.suggest(issues);", color: "text-green-400" },
  { indent: 1, text: "return { score, issues, fixes };", color: "text-yellow-300" },
  { indent: 0, text: "}", color: "text-purple-400" },
];

function AnimatedCodeBlock() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines < codeLines.length) {
      const t = setTimeout(() => setVisibleLines((v) => v + 1), 400);
      return () => clearTimeout(t);
    }
  }, [visibleLines]);

  return (
    <div className="relative rounded-2xl bg-surface-900/80 border border-white/[0.06] p-5 font-mono text-xs sm:text-sm backdrop-blur-sm overflow-hidden">
      {/* Window dots */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[10px] text-gray-500">review.js</span>
      </div>
      {/* Code lines */}
      <div className="space-y-1">
        {codeLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={i < visibleLines ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <span className="w-6 text-right text-gray-600 mr-4 select-none text-[10px]">
              {i + 1}
            </span>
            <span style={{ paddingLeft: `${line.indent * 1.5}rem` }} className={line.color}>
              {line.text}
            </span>
            {i === visibleLines - 1 && (
              <span className="ml-0.5 w-[2px] h-4 bg-brand-400 animate-pulse" />
            )}
          </motion.div>
        ))}
      </div>
      {/* Scanning overlay */}
      <AnimatePresence>
        {visibleLines >= codeLines.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 pt-3 border-t border-white/5"
          >
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Analysis complete — Score: 94/100</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Gradient glow */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-brand-500/5 rounded-full blur-3xl" />
    </div>
  );
}

/* ── Stats counter ── */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Features ── */
const features = [
  {
    icon: Bug,
    title: "Bug Detection",
    desc: "Catch hidden bugs, logic errors, and edge cases before they reach production.",
    gradient: "from-red-500/20 to-orange-500/20",
    iconColor: "text-red-400",
    borderHover: "hover:border-red-500/30",
  },
  {
    icon: Shield,
    title: "Security Audit",
    desc: "Scan for XSS, injection attacks, and unsafe patterns in real time.",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400",
    borderHover: "hover:border-green-500/30",
  },
  {
    icon: Zap,
    title: "Performance",
    desc: "Identify bottlenecks and get optimization suggestions instantly.",
    gradient: "from-yellow-500/20 to-amber-500/20",
    iconColor: "text-yellow-400",
    borderHover: "hover:border-yellow-500/30",
  },
  {
    icon: BarChart3,
    title: "Quality Score",
    desc: "Get a 0-100 score with a full breakdown of your code health.",
    gradient: "from-brand-500/20 to-cyan-500/20",
    iconColor: "text-brand-400",
    borderHover: "hover:border-brand-500/30",
  },
];

const stats = [
  { label: "Lines Analyzed", value: 1200000, suffix: "+" },
  { label: "Bugs Caught", value: 45000, suffix: "+" },
  { label: "Languages", value: 20, suffix: "+" },
  { label: "Avg Response", value: 2, suffix: "s" },
];

/* ── Main Page ── */
export default function HomePage() {
  const { user } = useAuth();
  const typedText = useTypingEffect(
    ["Code Reviews", "Bug Detection", "Security Audits", "Performance Tips"],
    90,
    50,
    1800
  );

  return (
    <div className="relative overflow-hidden">
      <FloatingParticles />

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── HERO ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs sm:text-sm mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ship better code, faster
            </motion.div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Instant AI
              </span>
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-cyan-400 bg-clip-text text-transparent">
                {typedText}
              </span>
              <span className="inline-block w-[3px] h-[0.85em] bg-brand-400 ml-1 animate-pulse align-middle rounded-sm" />
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 text-sm sm:text-lg text-gray-400 max-w-lg leading-relaxed"
            >
              Paste your code and get a detailed review in seconds — bugs, security
              vulnerabilities, performance issues, and actionable fixes.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-col sm:flex-row items-start gap-3"
            >
              <Link href={user ? "/review" : "/login"}>
                <MagneticButton className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl text-white font-semibold text-sm sm:text-base shadow-lg shadow-brand-500/25 transition-all">
                  Start Reviewing
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </MagneticButton>
              </Link>
              <Link href={user ? "/dashboard" : "/login"}>
                <MagneticButton className="flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-gray-300 font-semibold text-sm sm:text-base transition-all">
                  <Terminal className="h-4 w-4" />
                  View Dashboard
                </MagneticButton>
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 flex items-center gap-4 text-xs text-gray-500"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500/70" />
                Free to use
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500/70" />
                No setup required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500/70" />
                20+ languages
              </div>
            </motion.div>
          </motion.div>

          {/* Right — Code preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="hidden lg:block"
          >
            <AnimatedCodeBlock />
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="text-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <div className="text-2xl sm:text-3xl font-bold text-white">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              ship clean code
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            One paste. Full analysis. Instant results.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.12 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative p-5 sm:p-6 rounded-2xl bg-surface-800/40 border border-white/5 ${f.borderHover} transition-all duration-300 overflow-hidden`}
              >
                {/* Glow on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
                />
                <div className="relative">
                  <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            Three steps.{" "}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              Zero friction.
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.15 } },
          }}
          className="grid sm:grid-cols-3 gap-6 sm:gap-8"
        >
          {[
            {
              step: "01",
              icon: Code2,
              title: "Paste your code",
              desc: "Drop any code snippet — supports 20+ languages.",
            },
            {
              step: "02",
              icon: Sparkles,
              title: "AI analyzes it",
              desc: "Instant scan for bugs, security, and performance.",
            },
            {
              step: "03",
              icon: GitBranch,
              title: "Get actionable fixes",
              desc: "Review suggestions and ship with confidence.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="relative text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/20 transition-all"
              >
                <span className="text-5xl font-black text-brand-500/10 absolute top-3 right-4 select-none">
                  {item.step}
                </span>
                <div className="mx-auto h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-brand-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-8 sm:p-14 text-center overflow-hidden border border-brand-500/10"
        >
          {/* CTA Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-cyan-500/5 rounded-3xl" />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Ready to write better code?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-lg mx-auto">
              Join thousands of developers using CodeRift to catch bugs, improve code quality,
              and ship faster.
            </p>
            <Link href={user ? "/review" : "/login"}>
              <MagneticButton className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl text-white font-semibold shadow-xl shadow-brand-500/20 transition-all">
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </MagneticButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer spacer */}
      <div className="h-16" />
    </div>
  );
}
