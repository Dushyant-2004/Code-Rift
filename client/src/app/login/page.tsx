"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import MagneticButton from "@/components/MagneticButton";
import { Zap, Mail, Chrome } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push("/review");
  }, [user, router]);

  const handleGoogle = useCallback(async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast.success("Welcome to CodeRift!");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle]);

  const handleEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fill in all fields");
    if (password.length < 6) return toast.error("Password must be 6+ characters");

    try {
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast.success("Account created!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }, [email, password, isSignUp, signInWithEmail, signUpWithEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-60 sm:w-96 h-60 sm:h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 sm:w-96 h-60 sm:h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="p-5 sm:p-8 rounded-2xl bg-surface-800/50 border border-white/5 backdrop-blur-xl shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
              CodeRift
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-1.5 sm:mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 text-center mb-6 sm:mb-8">
            {isSignUp ? "Sign up to start reviewing code" : "Sign in to continue"}
          </p>

          {/* Google Sign In */}
          <MagneticButton
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-gray-300 font-medium text-sm sm:text-base transition-all mb-5 sm:mb-6"
          >
            <Chrome className="h-5 w-5" />
            Continue with Google
          </MagneticButton>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-surface-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-surface-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>

            <MagneticButton
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl text-white font-semibold shadow-lg shadow-brand-500/20 transition-all"
            >
              <Mail className="h-4 w-4" />
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </MagneticButton>
          </form>

          <p className="text-xs sm:text-sm text-gray-400 text-center mt-5 sm:mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-brand-400 hover:text-brand-300 font-medium hover:underline transition-colors"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
