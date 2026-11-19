import React from "react";
import Link from "next/link";
import Image from "next/image";

const REPO_URL = "https://github.com/HenryNitrogen/gemini-periodic-table";
const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/periodic-table-for-gemini/akmnlllibcniifmopljohofbjkecggcm";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/90 bg-white py-12 px-6">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Periodic Table for Gemini"
            width={24}
            height={24}
            className="h-6 w-6 rounded object-cover"
          />
          <span className="font-semibold text-zinc-950">
            Periodic Table for Gemini
          </span>
          <span>·</span>
          <span>Open-Source under MIT License</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-950 hover:underline underline-offset-4"
          >
            Chrome Web Store
          </a>
          <Link href="/privacy" className="hover:text-zinc-950 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/support" className="hover:text-zinc-950 transition-colors">
            Support
          </Link>
          <a
            href="mailto:ptable@coldestwins.com"
            className="hover:text-zinc-950 transition-colors"
          >
            ptable@coldestwins.com
          </a>
          <a
            href="https://x.com/UFO2002616/status/2122321834331005104"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-950 transition-colors"
          >
            Concept by @UFO2002616
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-zinc-950 hover:underline underline-offset-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub Repository</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
