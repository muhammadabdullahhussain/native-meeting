"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";

export default function Legal() {
  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-4">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Scale size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Legal & Privacy
          </h1>
          <p className="text-xl text-gray-400">
            Our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
            Terms of Service
          </h2>
          <div className="text-gray-400 space-y-4 leading-relaxed">
            <p>
              <strong>1. Acceptance of Terms</strong>
              <br />
              By accessing BondUs, you agree to comply with these terms.
            </p>
            <p>
              <strong>2. User Conduct</strong>
              <br />
              You agree not to use the service for any illegal or unauthorized
              purpose. Harassment, hate speech, and spam are strictly
              prohibited.
            </p>
            <p>
              <strong>3. Content</strong>
              <br />
              You retain ownership of the content you post, but you grant
              BondUs a license to use, display, and distribute your content.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
            Privacy Policy
          </h2>
          <div className="text-gray-400 space-y-4 leading-relaxed">
            <p>
              <strong>1. Information Collection</strong>
              <br />
              We collect information you provide directly to us, such as when
              you create an account, update your profile, or communicate with
              us.
            </p>
            <p>
              <strong>2. Use of Information</strong>
              <br />
              We use the information we collect to provide, maintain, and
              improve our services, and to communicate with you.
            </p>
            <p>
              <strong>3. Data Security</strong>
              <br />
              We implement reasonable security measures to protect your
              information.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
