"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 pointer-events-none" />
      
      <div className="text-center relative z-10 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 border border-white/10 p-12 rounded-[2.5rem] backdrop-blur-xl"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertTriangle size={40} />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Something went wrong!
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
          >
            <RefreshCw size={20} />
            Try again
          </button>
        </motion.div>
      </div>
    </div>
  );
}
