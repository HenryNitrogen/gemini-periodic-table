import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, HelpCircle, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Support — Periodic Table for Gemini",
  description:
    "Support, FAQ, and bug reporting for Periodic Table for Gemini Chrome extension.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-950 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors mb-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Periodic Table for Gemini</span>
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-medium text-zinc-700 mb-6">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Support & Help Center</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
          Support
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Need help with <strong>Periodic Table for Gemini</strong>? Reach out
          anytime or browse the quick troubleshooting guide below.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:ptable@coldestwins.com"
            className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors block"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Mail className="h-4 w-4" />
              <span>Email Support</span>
            </div>
            <p className="mt-2 font-mono text-xs text-zinc-600">
              ptable@coldestwins.com
            </p>
          </a>

          <a
            href="https://github.com/HenryNitrogen/gemini-periodic-table/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 transition-colors block"
          >
            <div className="flex items-center justify-between text-sm font-semibold text-zinc-950">
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>GitHub Issues</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Report bugs or request new features
            </p>
          </a>
        </div>

        <div className="mt-10 space-y-6 text-sm text-zinc-600 leading-relaxed">
          <h2 className="text-base font-semibold text-zinc-950">
            Frequently Asked Questions
          </h2>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-2">
            <h3 className="font-semibold text-zinc-950">
              Why are some models or Thinking levels locked?
            </h3>
            <p>
              The extension reflects your active Google Gemini account&apos;s
              permissions. If a tier-gated model (such as 4 Carbon) or a
              Thinking level is locked on your account, it will display a lock
              badge and cannot be activated.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-2">
            <h3 className="font-semibold text-zinc-950">
              Why are 115 elements marked &quot;Coming soon&quot;?
            </h3>
            <p>
              Only 3 Gemini 4 element models (Hydrogen, Carbon, and Argon) are
              currently released. The remaining 115 elements are interactive
              placeholders completing the 118-element Periodic Table layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
