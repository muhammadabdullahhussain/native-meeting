"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, CheckCircle, BadgeCheck, PhoneCall } from "lucide-react";

export default function Safety() {
  const trustPoints = [
    "24/7 automated risk detection",
    "Human moderation in real-time",
    "Verified-profile prioritization",
  ];

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-4 text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Safety Center
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your safety is our #1 priority. We use advanced technology and human
            moderation to keep Interesta safe.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {[
            {
              icon: Shield,
              title: "Verified Profiles",
              desc: "Every profile goes through a strict verification process. We use phone verification and optional ID checks to ensure authenticity.",
            },
            {
              icon: Lock,
              title: "Data Encryption",
              desc: "Your chats and personal data are encrypted. We never sell your data to third parties.",
            },
            {
              icon: Eye,
              title: "Active Moderation",
              desc: "Our team and AI systems monitor content 24/7. Reports are handled within minutes.",
            },
            {
              icon: CheckCircle,
              title: "Community Guidelines",
              desc: "We have zero tolerance for harassment, hate speech, or spam. Violators are banned immediately.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 text-primary">
                <item.icon size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {item.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 mt-16">
        <div className="max-w-5xl mx-auto rounded-3xl bg-white/5 border border-white/10 p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Your safety layer, always active
            </h3>
            <div className="inline-flex items-center gap-2 text-emerald-300 text-sm font-medium">
              <BadgeCheck size={18} />
              Trust & Security Enabled
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            {trustPoints.map((point) => (
              <div
                key={point}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-300"
              >
                {point}
              </div>
            ))}
          </div>
          <a
            href="https://wa.me/9203281351814"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <PhoneCall size={18} />
            Contact Safety Support
          </a>
        </div>
      </div>
    </div>
  );
}
