"use client";

import { motion } from "framer-motion";
import {
  HelpCircle,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Help() {
  const faqs = [
    {
      q: "Is BondUs free?",
      a: "Yes! BondUs is free to download and use. We offer optional premium features for power users.",
    },
    {
      q: "How do I verify my profile?",
      a: "Go to Profile > Settings > Verification. You can verify via phone number or connect social accounts.",
    },
    {
      q: "What is the 'nearby' radius?",
      a: "You can set your discovery radius from 1km up to 100km in your Discovery Preferences.",
    },
    {
      q: "Can I create my own community?",
      a: "Absolutely! Any user can create a group based on interests. Premium users can create unlimited groups.",
    },
  ];

  const quickHelp = [
    {
      icon: MessageCircle,
      title: "Account & Login",
      desc: "Profile access, verification, and password help.",
    },
    {
      icon: ShieldCheck,
      title: "Safety & Reports",
      desc: "Report users, block profiles, and moderation support.",
    },
    {
      icon: Sparkles,
      title: "Premium & Billing",
      desc: "Plan upgrades, restore purchase, and billing history.",
    },
  ];

  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-4">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <HelpCircle size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Help Center
          </h1>
          <p className="text-xl text-gray-400">
            Frequently Asked Questions & Support
          </p>
        </motion.div>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <h3 className="text-lg font-bold text-white mb-2 flex justify-between items-center">
              {faq.q}
              <ChevronRight
                size={20}
                className="text-gray-500 group-hover:text-white transition-colors"
              />
            </h3>
            <p className="text-gray-400">{faq.a}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickHelp.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-5 bg-white/5 border border-white/10"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4">
              <item.icon size={20} />
            </div>
            <h3 className="text-white font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-400 mb-4">Still need help?</p>
        <a
          href="https://wa.me/9203281351814"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-white font-medium underline"
        >
          Contact Support on WhatsApp
        </a>
      </div>
    </div>
  );
}
