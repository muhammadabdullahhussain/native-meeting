"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  Phone,
  Sparkles,
  Download,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "/about" },
    { name: "Safety", href: "/safety" },
    { name: "Help", href: "/help" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/70 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              I
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              BondUs<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                  pathname === link.href
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.name}
                {pathname === link.href && (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary/30 border border-primary/40"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://wa.me/9203281351814"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-500/10 border border-green-500/20"
            >
              <Phone size={16} />
              Support
            </a>
            <Link
              href="/pricing"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              <Sparkles size={16} />
              Upgrade
            </Link>
            <a
              href="#"
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/10"
            >
              <Download size={16} />
              Get App
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-300" />
                <p className="text-sm text-gray-200">
                  Trusted by 10,000+ verified members
                </p>
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block text-lg font-medium py-2 border-b border-white/5 ${
                    pathname === link.href ? "text-white" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href="https://wa.me/9203281351814"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 bg-green-500/15 border border-green-500/25 text-green-300 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-green-500/20"
              >
                <Phone size={18} />
                WhatsApp Support
              </a>
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="w-full mt-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles size={18} />
                View Premium
              </Link>
              <a
                href="#"
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <Download size={18} />
                Download App <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
