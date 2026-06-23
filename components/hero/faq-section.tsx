"use client";

import { motion } from "framer-motion";
import { FaqItem } from "./faq-item";

export function FaqSection() {
  return (
    <section id="faq" className="py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-white/50 text-lg">Everything you need to know about the MyTurn Closed Beta.</p>
        </motion.div>

        <div className="space-y-4">
          <FaqItem
            question="How do I get access to the Closed Beta?"
            answer="Currently, MyTurn is invite-only. You can request access by joining our waitlist on this page. We admit new groups in rolling batches every week."
          />
          <FaqItem
            question="Is MyTurn free?"
            answer="Yes! During our beta phase, all features are 100% free. Our goal is to gather feedback and build the best possible experience before a public launch."
          />
          <FaqItem
            question="How does the picking algorithm work?"
            answer="The spin algorithm is randomized, but it utilizes a 'fairness' system to ensure everyone in your group gets a turn before the cycle completely resets."
          />
          <FaqItem
            question="What platforms are supported?"
            answer="Both iOS and Android mobile phones are supported from all brands."
          />
          <FaqItem
            question="Who can see my vlogs?"
            answer="Only the people you invite to your specific private group. There are no public profiles, no search engines, and no followers."
          />
        </div>
      </div>
    </section>
  );
}
