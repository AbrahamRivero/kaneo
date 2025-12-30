"use client";

import { ArrowRight, ExternalLink, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import DemoSection from "./laptop-animation";

export default function Hero() {
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-[max(-7rem,calc(50%-52rem))] top-0 -z-10 transform-gpu blur-3xl sm:left-[max(-11rem,calc(50%-52rem))] lg:left-[max(-15rem,calc(50%-52rem))] xl:left-[max(-19rem,calc(50%-52rem))]"
          aria-hidden="true"
        >
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-br from-indigo-500 to-indigo-200 opacity-30"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
        <div
          className="absolute left-[max(45rem,calc(50%+8rem))] top-0 -z-10 transform-gpu blur-3xl xl:left-[max(49rem,calc(50%+12rem))]"
          aria-hidden="true"
        >
          <div
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-indigo-500 to-indigo-200 opacity-30"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center lg:pt-32">
        <div id="headline" className="mb-8">
          <h1 className="mx-auto mt-8 max-w-4xl font-display text-4xl font-medium tracking-tight text-zinc-900 dark:text-white sm:text-7xl animate-fade-in">
            Project management{" "}
            <span className="relative whitespace-nowrap text-indigo-600 dark:text-indigo-400">
              <span className="relative">made simple</span>
            </span>{" "}
            for teams
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400 animate-fade-in-delay">
            An open source project management platform focused on simplicity and
            efficiency. Self-host it, customize it, make it yours.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-delay-2">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-lg py-2 bg-white text-zinc-900 hover:bg-zinc-50 hover:scale-[1.02] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 h-12 px-8 border border-zinc-200 dark:border-zinc-700"
              aria-label="Documentation"
              tabIndex={0}
              // biome-ignore lint/a11y/useSemanticElements: <explanation>
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  window.location.href = "/docs";
                }
              }}
            >
              <Terminal className="mr-2 h-4 w-4" />
              Documentation
            </Link>
          </div>
        </div>

        <div className="mt-16 sm:mt-24 animate-fade-in-delay-3">
          <DemoSection />
        </div>
      </div>
    </div>
  );
}
