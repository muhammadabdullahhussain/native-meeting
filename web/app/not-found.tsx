"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 pointer-events-none" />

      <div className="text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 text-primary">
            <AlertCircle size={48} />
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tighter">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Page Not Found
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has
            been moved.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            <Home size={20} />
            Back Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
