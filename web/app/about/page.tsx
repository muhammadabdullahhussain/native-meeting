"use client";

import { motion } from "framer-motion";
import {
  Users,
  Heart,
  Shield,
  Globe,
  Trophy,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Authenticity",
      desc: "We believe in real connections. No bots, no fakes, just genuine people looking for their tribe.",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: Shield,
      title: "Safety First",
      desc: "Your safety is non-negotiable. We use advanced verification and moderation to keep our community secure.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: Globe,
      title: "Hyper-Local",
      desc: "Community starts where you are. Discover people, events, and groups right in your neighborhood.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Users,
      title: "Inclusivity",
      desc: "Everyone is welcome here. We celebrate diversity and foster a supportive environment for all.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  const milestones = [
    { icon: Users, value: "10,000+", label: "Active Members" },
    { icon: MessageSquare, value: "1.2M+", label: "Conversations Started" },
    { icon: Trophy, value: "4.9★", label: "User Satisfaction" },
    { icon: Sparkles, value: "50+", label: "Cities Connected" },
  ];

  return (
    <div className="pt-32 pb-20 overflow-hidden">
      <div className="container mx-auto px-4 mb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white tracking-tight">
              We&apos;re building the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                future of connection.
              </span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Interesta isn&apos;t just another social app. It&apos;s a movement
              to bring people back together in the real world, based on shared
              passions and genuine interests.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-32">
        <div className="glass rounded-[3rem] p-8 md:p-16 relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Our Mission
              </h2>
              <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                <p>
                  In a world that&apos;s more connected than ever digitally,
                  we&apos;ve never been more isolated physically. We&apos;re
                  changing that.
                </p>
                <p>
                  Our mission is to help you find your people. Whether
                  you&apos;re into hiking, coding, painting, or gaming,
                  there&apos;s a community waiting for you nearby.
                </p>
                <p>
                  We prioritize meaningful interactions over mindless scrolling.
                  Every feature in Interesta is designed to get you offline and
                  into the real world.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-5xl font-bold text-white">I</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Interesta HQ</h3>
                <p className="text-gray-400 mt-2">
                  Built with ❤️ for the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {milestones.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
                <item.icon size={20} />
              </div>
              <p className="text-2xl md:text-3xl text-white font-bold">
                {item.value}
              </p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Our Core Values
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div
                className={`w-14 h-14 ${val.bg} rounded-2xl flex items-center justify-center mb-6`}
              >
                <val.icon className={`w-7 h-7 ${val.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{val.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {val.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
