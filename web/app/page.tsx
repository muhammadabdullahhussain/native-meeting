"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Shield,
  Zap,
  Users,
  Globe,
  Sparkles,
  Star,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AuthModal from "../components/AuthModal";

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const openSignUp = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
  };

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const socialProof = [
    "Trusted by 10,000+ members",
    "4.9★ community rating",
    "Verified-first matching",
  ];

  const steps = [
    {
      title: "Set Your Vibe",
      desc: "Pick your interests, availability, and the people you want to meet.",
      icon: Sparkles,
    },
    {
      title: "Discover Nearby",
      desc: "See relevant profiles and communities near your location instantly.",
      icon: MapPin,
    },
    {
      title: "Meet For Real",
      desc: "Move from chat to real plans with safe, moderated interactions.",
      icon: Users,
    },
  ];

  const testimonials = [
    {
      quote:
        "I moved to a new city and made friends in my first week. BondUs feels genuinely human.",
      name: "Areeba K.",
      role: "Designer · Lahore",
      badge: "Community Lead",
    },
    {
      quote:
        "The matching quality is insane. No random noise — only people I actually vibe with.",
      name: "Hamza R.",
      role: "Founder · Karachi",
      badge: "Premium Member",
    },
    {
      quote:
        "As a safety-conscious user, I love how transparent and strict the moderation is.",
      name: "Sana M.",
      role: "Doctor · Islamabad",
      badge: "Verified User",
    },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[85vh] flex items-center pt-16 sm:pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="inline-block mb-6">
                <span className="bg-white/5 border border-white/10 text-primary-300 text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-sm">
                  🚀 Trusted Social Discovery Platform
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 sm:mb-8 tracking-tight leading-tight"
              >
                Connect with your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                  Tribe Nearby
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2"
              >
                Discover like-minded people, join local communities, and build
                real connections. Safe, verified, and hyper-local.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button
                  onClick={openSignUp}
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-base sm:text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  Start Free Today <ArrowRight size={20} />
                </button>
                <Link
                  href="/about"
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold text-base sm:text-lg transition-all backdrop-blur-sm text-center"
                >
                  Learn More
                </Link>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
              >
                {socialProof.map((item) => (
                  <span
                    key={item}
                    className="text-xs md:text-sm text-gray-300 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                  >
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: MapPin,
                title: "Hyper-Local",
                desc: "Find active users within 1km to 100km radius. You control who you see.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Shield,
                title: "Safe & Verified",
                desc: "Strict verification ensures you only connect with real, authentic people.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Zap,
                title: "Smart Match Engine",
                desc: "Our intelligent matching prioritizes shared interests and real compatibility.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group hover:bg-white/10"
              >
                <div
                  className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-10 sm:py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 text-center">
            {[
              { label: "Active Users", value: "10k+", icon: Users },
              { label: "Communities", value: "500+", icon: Globe },
              { label: "Matches Made", value: "50k+", icon: Zap },
              { label: "Cities", value: "50+", icon: MapPin },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex justify-center mb-4 text-primary/50">
                  <stat.icon size={32} />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-widest font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                How BondUs Works
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Three simple steps to go from scrolling alone to building your
                real-world circle.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-5">
                    <step.icon size={24} />
                  </div>
                  <p className="text-xs tracking-widest text-primary/80 font-semibold mb-2">
                    STEP 0{i + 1}
                  </p>
                  <h3 className="text-2xl text-white font-bold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Loved by Real People
              </h2>
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Star size={18} />
                <span className="text-sm font-medium">
                  4.9/5 Average Satisfaction
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-7 rounded-3xl bg-white/5 border border-white/10"
                >
                  <p className="text-gray-200 leading-relaxed mb-6">
                    “{item.quote}”
                  </p>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.role}</p>
                    <span className="inline-flex mt-3 text-xs px-3 py-1 rounded-full bg-primary/20 text-primary-200">
                      {item.badge}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-32 relative">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-primary/20 to-primary/5 border border-white/10 p-6 sm:p-12 md:p-24 text-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 sm:mb-8">
                Ready to find your circle?
              </h2>
              <p className="text-base sm:text-xl text-gray-300 mb-8 sm:mb-12">
                Join thousands of people who are discovering new friends and
                communities every day.
              </p>
              <div className="flex items-center justify-center flex-wrap gap-4">
                <button
                  onClick={openSignUp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 bg-white text-bg hover:bg-gray-100 rounded-xl font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-xl shadow-white/10"
                >
                  Get Started for Free <ArrowRight size={20} />
                </button>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  <Clock3 size={18} />
                  See Premium Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
