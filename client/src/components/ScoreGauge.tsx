"use client";

import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 160 }: ScoreGaugeProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return { stroke: "#22c55e", text: "text-green-400", label: "Excellent" };
    if (s >= 70) return { stroke: "#3b82f6", text: "text-blue-400", label: "Good" };
    if (s >= 50) return { stroke: "#eab308", text: "text-yellow-400", label: "Average" };
    if (s >= 30) return { stroke: "#f97316", text: "text-orange-400", label: "Below Avg" };
    return { stroke: "#ef4444", text: "text-red-400", label: "Poor" };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* Score circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className={`text-3xl font-bold ${color.text}`}
          >
            {score}
          </motion.span>
          <span className="text-xs text-gray-500 mt-0.5">/ 100</span>
        </div>
      </div>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className={`text-sm font-semibold ${color.text}`}
      >
        {color.label}
      </motion.span>
    </div>
  );
}
