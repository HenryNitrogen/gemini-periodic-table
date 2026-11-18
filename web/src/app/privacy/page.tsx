import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { FloatingNavbar } from "@/components/floating-navbar";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Privacy Policy & Support — Periodic Table for Gemini",
  description:
    "Privacy Policy and support contact for Periodic Table for Gemini Chrome extension.",
};

export default function PrivacyPage() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy Policy & Support</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
            Privacy Policy
          </h1>
          <p className="mt-2 font-mono text-xs text-zinc-400">
            Last updated: November 2026
          </p>

          <div className="mt-10 space-y-8 text-sm text-zinc-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-zinc-950">
                1. Zero Data Collection
              </h2>
              <p>
                <strong>Periodic Table for Gemini</strong> (&quot;the Extension&quot;)
                operates 100% locally inside your browser. The Extension does{" "}
                <strong>not</strong> collect, read, store, share, or transmit any
                personal information, browsing history, Gemini prompts, chat
                contents, or usage analytics.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-zinc-950">
                2. Local Storage Only
              </h2>
              <p>
                The Extension uses{" "}
                <code className="font-mono text-xs text-zinc-800">
                  chrome.storage.local
                </code>{" "}
                solely on your device to remember whether the Periodic Table overlay
                is enabled on{" "}
                <code className="font-mono text-xs text-zinc-800">
                  gemini.google.com
                </code>{" "}
                and to persist your preview state in the standalone demo page. No
                data ever leaves your browser.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-zinc-950">
                3. No Third-Party Services
              </h2>
              <p>
                The Extension makes zero external network requests, loads no remote
                code, and communicates with no third-party servers.
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-2">
              <h2 className="text-base font-semibold text-zinc-950 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Support & Contact</span>
              </h2>
              <p>
                If you have any questions, bug reports, or privacy inquiries,
                please contact us at{" "}
                <a
                  href="mailto:ptable@coldestwins.com"
                  className="font-mono text-sm font-medium text-zinc-950 underline underline-offset-4"
                >
                  ptable@coldestwins.com
                </a>{" "}
                or visit our{" "}
                <Link
                  href="/support"
                  className="font-medium text-zinc-950 underline underline-offset-4"
                >
                  Support Center
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
