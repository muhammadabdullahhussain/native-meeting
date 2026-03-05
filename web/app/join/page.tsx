"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  UserPlus,
  Gift,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

function JoinInner() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") || searchParams.get("ref") || "";
  const [code, setCode] = useState(urlCode);
  const [inviterName, setInviterName] = useState("A friend");
  const [inviter, setInviter] = useState<{
    name: string;
    username?: string;
    avatar?: string;
    city?: string | null;
    headline?: string | null;
    referralCount?: number;
    unlockedGroupPasses?: number;
    isVerified?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tryingOpen, setTryingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
    }
    return "https://bondus-backend.onrender.com";
  }, []);

  useEffect(() => {
    setCode(urlCode);
  }, [urlCode]);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${apiBase}/api/auth/referral/validate/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          const safeName = d.referrerName || "A friend";
          setInviterName(safeName);
          setInviter({
            name: safeName,
            username: d.referrerUsername,
            avatar: d.referrerAvatar,
            city: d.referrerCity || null,
            headline: d.referrerHeadline || null,
            referralCount: d.referralCount || 0,
            unlockedGroupPasses: d.unlockedGroupPasses || 0,
            isVerified: d.isVerified || false,
          });
        } else {
          setInviterName("A friend");
        }
      })
      .catch(() => {
        setInviterName("A friend");
        setError(
          "Referral code could not be verified. You can still continue.",
        );
      })
      .finally(() => setLoading(false));
  }, [code, apiBase]);

  const handleOpenApp = () => {
    if (!code) {
      window.location.href = "/";
      return;
    }
    setTryingOpen(true);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const deepLink = `bondus://join?code=${encodeURIComponent(code)}`;
    const fallbackUrl = "/";

    const start = Date.now();
    setTimeout(() => {
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

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      alert("Copy failed. Select and copy the code manually.");
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on BondUs",
          text: "Use my referral code to join BondUs.",
          url: shareUrl,
        });
      } catch {
        // no-op
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 pt-20 pb-16 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_20%,rgba(99,102,241,0.08),transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass max-w-xl w-full p-5 sm:p-8 md:p-12 rounded-[1.5rem] sm:rounded-[2rem] relative z-10 text-center border border-white/10 shadow-2xl shadow-black/50"
      >
        <div className="relative mx-auto mb-8">
          <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-primary/40 to-purple-500/30 rounded-full -z-10" />
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
            <UserPlus size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
          Join <span className="text-primary">{inviterName}</span> on BondUs
        </h1>
        <p className="text-gray-300/90 mb-6 leading-relaxed">
          Make real connections with people nearby who share your interests.
        </p>
        {error && (
          <div className="mb-6 text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            {error}
          </div>
        )}

        {inviter && (
          <div className="rounded-2xl p-3 sm:p-5 mb-6 sm:mb-8 bg-white/5 border border-white/10 text-left">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  inviter.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(inviter.name)}&background=6366F1&color=fff&size=112`
                }
                alt={inviter.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(inviter.name)}&background=6366F1&color=fff&size=112`;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-semibold truncate">{inviter.name}</span>
                  {inviter.isVerified && (
                    <ShieldCheck size={15} className="text-emerald-300 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">
                  {inviter.headline || "Active member"}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              {inviter.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} /> {inviter.city}
                </span>
              )}
              {typeof inviter.referralCount === "number" && (
                <span>• {inviter.referralCount} friends invited</span>
              )}
              {typeof inviter.unlockedGroupPasses === "number" && (
                <span>• {inviter.unlockedGroupPasses} group passes</span>
              )}
            </div>
          </div>
        )}

        {code ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <Gift className="text-yellow-300" size={18} />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Referral Code
                </div>
                <div className="font-mono text-lg sm:text-xl md:text-2xl font-bold tracking-[0.2em] sm:tracking-[0.3em] text-white select-text">
                  {code}
                </div>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
              aria-label="Copy referral code"
            >
              {copied ? (
                <Check size={18} className="text-emerald-300" />
              ) : (
                <Copy size={18} className="text-gray-200" />
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 mb-8">
            <div className="text-sm text-gray-300 mb-3">
              Enter a referral code to apply benefits
            </div>
            <div className="flex items-center gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={() => setCode(code.trim().toUpperCase())}
                className="px-4 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 text-left">
          {[
            {
              icon: Sparkles,
              title: "Verified people",
              color: "text-emerald-300",
            },
            { icon: UserPlus, title: "Smart matching", color: "text-blue-300" },
            { icon: Gift, title: "Free group pass", color: "text-amber-300" },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3"
            >
              <f.icon className={f.color} size={18} />
              <span className="text-sm text-gray-200">{f.title}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleOpenApp}
            disabled={tryingOpen}
            className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            {tryingOpen ? "Opening..." : "Accept Invite & Join"}{" "}
            <ArrowRight size={20} />
          </button>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Continue on the website
            </a>
            <span className="text-gray-600">•</span>
            <button
              onClick={handleShare}
              className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-1"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            By joining, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
      <div className="w-full px-2 sm:px-6 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-2">How it works</h3>
            <ul className="text-sm text-gray-300 space-y-1.5">
              <li>• Accept invite and create your profile</li>
              <li>• Choose interests and set discovery radius</li>
              <li>• Start connecting with nearby people</li>
            </ul>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-2">Benefits</h3>
            <ul className="text-sm text-gray-300 space-y-1.5">
              <li>• Better matches via shared interests</li>
              <li>• Premium trial with referral</li>
              <li>• Earn group passes by inviting friends</li>
            </ul>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-2">Safety</h3>
            <ul className="text-sm text-gray-300 space-y-1.5">
              <li>• Profile verification</li>
              <li>• Privacy-first location controls</li>
              <li>• Easy reporting and blocking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Join() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <JoinInner />
    </Suspense>
  );
}
