import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, HelpCircle, ArrowUpRight } from "lucide-react";
import { FloatingNavbar } from "@/components/floating-navbar";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Support — Periodic Table for Gemini",
  description:
    "Support, FAQ, and bug reporting for Periodic Table for Gemini Chrome extension.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-950">
      <FloatingNavbar />

      <main className="flex-1 px-6 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
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
                Element models that Gemini has actually released light up
                automatically on the Periodic Table. Any unannounced elements
                remain interactive &quot;Coming soon&quot; placeholders across
                the 118-element grid.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-2">
              <h3 className="font-semibold text-zinc-950">
                How do you handle privacy and chat data?
              </h3>
              <p>
                Periodic Table for Gemini runs 100% locally with zero tracking
                or external requests. Read our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-zinc-950 underline underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                for full details.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
