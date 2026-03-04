"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus, Gift } from "lucide-react";

export default function Join() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || searchParams.get("ref");
  const [inviterName, setInviterName] = useState("A friend");
  const [loading, setLoading] = useState(true);
  const [tryingOpen, setTryingOpen] = useState(false);

  useEffect(() => {
    if (code) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://interesta-backend.onrender.com"}/api/auth/referral/validate/${code}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.referrerName) {
            setInviterName(data.data.referrerName);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [code]);

  const handleOpenApp = () => {
    if (!code) {
      window.location.href = "/";
      return;
    }
    setTryingOpen(true);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const deepLink = `interesta://join?code=${encodeURIComponent(code)}`;
    const fallbackUrl = "/";

    const start = Date.now();
    const timeout = setTimeout(() => {
      if (Date.now() - start < 1600) {
        window.location.href = fallbackUrl;
      }
    }, 1500);

    if (isIOS) {
      window.location.href = deepLink;
    } else if (isAndroid) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } else {
      window.location.href = fallbackUrl;
    }

    setTimeout(() => setTryingOpen(false), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass max-w-lg w-full p-8 md:p-12 rounded-[2.5rem] relative z-10 text-center border border-white/10 shadow-2xl shadow-black/50"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/30">
          <UserPlus size={32} className="text-white" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {loading ? (
            <span className="animate-pulse bg-white/10 rounded px-4 py-2 block w-48 mx-auto">
              &nbsp;
            </span>
          ) : (
            <>
              Join <span className="text-primary">{inviterName}</span> on
              Interesta
            </>
          )}
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          You&apos;ve been invited to join the most authentic social discovery
          app. Connect, chat, and meet real people nearby.
        </p>

        {code && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex items-center gap-3 justify-center">
            <Gift className="text-yellow-400" size={20} />
            <span className="text-sm font-medium text-gray-300">
              Referral Code applied:{" "}
              <span className="text-white font-bold tracking-wider">
                {code}
              </span>
            </span>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleOpenApp}
            disabled={tryingOpen}
            className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            {tryingOpen ? "Opening..." : "Accept Invite & Join"}{" "}
            <ArrowRight size={20} />
          </button>
          <a
            href="/"
            className="block text-sm text-gray-400 hover:text-white transition"
          >
            Continue on the website
          </a>
          <p className="text-xs text-gray-500 mt-4">
            By joining, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
