"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

function GitHubMark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 28);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
      <header
        className={cn(
          "pointer-events-auto flex items-center justify-between gap-4 whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled
            ? "mt-4 w-[94%] max-w-4xl rounded-full border border-zinc-200/90 bg-white/85 px-5 py-2.5 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.1)] backdrop-blur-xl"
            : "mt-0 w-full max-w-none rounded-none border-b border-zinc-200/70 bg-white/95 px-6 sm:px-12 py-4 shadow-none backdrop-blur-md"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-zinc-950 font-semibold tracking-tight text-sm shrink-0 whitespace-nowrap"
        >
          <Image
            src="/logo.png"
            alt="Periodic Table for Gemini"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover"
          />
          <span>Periodic Table for Gemini</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-zinc-500 whitespace-nowrap">
          <Link href="/#demo" className="hover:text-zinc-950 transition-colors">
            Demo
          </Link>
          <Link href="/#showcase" className="hover:text-zinc-950 transition-colors">
            Showcase
          </Link>
          <Link href="/#features" className="hover:text-zinc-950 transition-colors">
            Architecture
          </Link>
          <Link href="/#source" className="hover:text-zinc-950 transition-colors">
            Source Code
          </Link>
          <Link href="/#install" className="hover:text-zinc-950 transition-colors">
            Install
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/HenryNitrogen/gemini-periodic-table"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
          >
            <GitHubMark className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
          <a
            href="https://chromewebstore.google.com/detail/periodic-table-for-gemini/akmnlllibcniifmopljohofbjkecggcm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-all"
          >
            <span>Add to Chrome</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 hidden sm:inline" />
          </a>
        </div>
      </header>
    </div>
  );
}
