import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Phone,
  ShieldCheck,
  Sparkles,
  Download,
  ArrowUpRight,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const sections = [
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Pricing", href: "/pricing" },
        { name: "Help Center", href: "/help" },
        { name: "Safety Center", href: "/safety" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Community Guidelines", href: "/legal" },
        { name: "Privacy Policy", href: "/legal" },
        { name: "Terms of Service", href: "/legal" },
        { name: "Law Enforcement", href: "/legal" },
      ],
    },
    {
      title: "Support",
      links: [
        {
          name: "WhatsApp Support",
          href: "https://wa.me/9203281351814",
          external: true,
        },
        { name: "Premium Plans", href: "/pricing" },
        { name: "Join with Referral", href: "/join" },
        { name: "Contact Team", href: "/help" },
      ],
    },
  ];

  return (
    <footer className="bg-bg border-t border-white/10 py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-primary-300 mb-2 inline-flex items-center gap-2">
              <Sparkles size={14} />
              Premium Community Access
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Ready to meet your tribe nearby?
            </h3>
            <p className="text-gray-400">
              Join verified people, discover local communities, and build real
              connections.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-colors"
            >
              <Sparkles size={16} />
              View Premium
            </Link>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/10"
            >
              <Download size={16} />
              Download App
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                I
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Interesta<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Connect with like-minded people nearby. Discover communities,
              events, and friendships that matter.
            </p>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram, Linkedin, Github].map(
                (Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors hover:scale-110 active:scale-95"
                  >
                    <Icon size={20} />
                  </a>
                ),
              )}
            </div>
            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
              <a
                href="https://wa.me/9203281351814"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-300 hover:text-green-200 font-medium transition-colors"
              >
                <Phone size={18} />
                <span>Support: +92 328 1351814</span>
              </a>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-primary/80">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.name}
                        <ArrowUpRight size={13} />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
          <div>
            <p>&copy; {currentYear} Interesta Inc. All rights reserved.</p>
            <p className="text-xs text-gray-600 mt-1">
              Crafted for authentic people and meaningful local communities.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-emerald-300 text-xs">
              <ShieldCheck size={13} />
              Verified-first Platform
            </span>
            <Link
              href="/legal"
              className="hover:text-white transition-colors text-xs"
            >
              Privacy
            </Link>
            <Link
              href="/legal"
              className="hover:text-white transition-colors text-xs"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
