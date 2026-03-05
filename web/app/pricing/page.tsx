"use client";

import { motion } from "framer-motion";
import {
  Check,
  X,
  Star,
  Zap,
  MessageCircle,
  Users,
  Eye,
  Sliders,
} from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      id: "monthly",
      label: "Monthly",
      price: "$3.99",
      perMonth: "$3.99",
      period: "monthly",
      savings: null,
      popular: false,
    },
    {
      id: "biannual",
      label: "6 Months",
      price: "$20",
      perMonth: "$3.33",
      period: "every 6 months",
      savings: "Save 17%",
      popular: false,
    },
    {
      id: "yearly",
      label: "Yearly",
      price: "$32",
      perMonth: "$2.67",
      period: "per year",
      savings: "Save 33% 🔥",
      popular: true,
    },
  ];

  const highlights = [
    {
      icon: MessageCircle,
      title: "Unlimited Chats",
      desc: "No 30-chat limit. Connect with as many people as you want.",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      icon: Users,
      title: "Create Public Groups",
      desc: "Your groups appear in discovery for people with matching interests.",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      icon: Zap,
      title: "Priority Discovery",
      desc: "Your profile appears first in search results near you.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Eye,
      title: "Profile Viewers",
      desc: "See exactly who viewed your profile in the last 7 days.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      icon: Star,
      title: "Premium Badge",
      desc: "Stand out with an exclusive 👑 badge on your profile.",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: Sliders,
      title: "Advanced Filters",
      desc: "Fine-tune your discovery by availability, vibe, and more.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const comparison = [
    { feature: "Message Requests", free: true, premium: true },
    { feature: "Conversations", free: "30 limit", premium: "Unlimited" },
    { feature: "Interests", free: "30 max", premium: "Unlimited" },
    { feature: "Create Public Groups", free: false, premium: true },
    {
      feature: "Group Discovery",
      free: "Via referral (1)",
      premium: "Unlimited",
    },
    { feature: "Premium Profile Badge", free: false, premium: "👑" },
    { feature: "Priority in Search", free: false, premium: true },
    { feature: "See Who Viewed You", free: false, premium: true },
    { feature: "Profile Boost", free: false, premium: "Weekly" },
    { feature: "Advanced Filters", free: "Basic", premium: "All filters" },
  ];

  return (
    <div className="pt-24 sm:pt-32 pb-20">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-block mb-4">
            <span className="text-5xl">👑</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 tracking-tight text-white">
            Go Premium
          </h1>
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-2">
            Unlock the full BondUs experience — no limits, no restrictions,
            pure connection.
          </p>
        </motion.div>
      </div>

      {/* Plans */}
      <div className="container mx-auto px-4 mb-16 sm:mb-32">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] relative flex flex-col ${plan.popular
                  ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-2xl shadow-primary/10 sm:scale-105 z-10"
                  : "bg-white/5 border border-white/10"
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}
              {plan.savings && !plan.popular && (
                <div className="absolute top-6 right-6 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                  {plan.savings}
                </div>
              )}
              {plan.popular && plan.savings && (
                <div className="absolute top-6 right-6 bg-primary/20 text-primary-300 text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
                  {plan.savings}
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">
                {plan.label}
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">
                  {plan.perMonth}
                </span>
                <span className="text-gray-400">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Billed {plan.price} {plan.period}
              </p>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all mt-auto ${plan.popular
                    ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:scale-105"
                    : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
              >
                Choose {plan.label}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="container mx-auto px-4 mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">What You Get</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {highlights.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div
                className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}
              >
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Free vs Premium</h2>
        </div>
        <div className="overflow-x-auto">
          <div className="glass rounded-3xl overflow-hidden border border-white/10 min-w-[340px]">
            <div className="grid grid-cols-3 bg-white/5 p-3 sm:p-4 border-b border-white/10 font-bold text-white">
              <div className="pl-2 sm:pl-4 text-sm">Feature</div>
              <div className="text-center text-gray-400 text-sm">Free</div>
              <div className="text-center text-primary text-sm">Premium</div>
            </div>

            {comparison.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 p-3 sm:p-4 items-center border-b border-white/5 last:border-0 ${i % 2 === 0 ? "bg-white/[0.02]" : ""
                  }`}
              >
                <div className="text-gray-300 pl-2 sm:pl-4 font-medium text-xs sm:text-sm">
                  {row.feature}
                </div>
                <div className="text-center flex justify-center text-gray-400 font-medium text-xs sm:text-sm">
                  {row.free === true ? (
                    <Check size={16} />
                  ) : row.free === false ? (
                    <X size={16} />
                  ) : (
                    row.free
                  )}
                </div>
                <div className="text-center flex justify-center text-primary font-bold text-xs sm:text-sm">
                  {row.premium === true ? <Check size={16} /> : row.premium}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-6">
            🔒 Secure payment · Cancel anytime · 7-day refund policy
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-medium transition-colors"
          >
            Restore Purchase
          </a>
        </div>
      </div>
    </div>
  );
}
