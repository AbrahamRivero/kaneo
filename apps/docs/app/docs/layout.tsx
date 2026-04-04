import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { DocsLayout, type DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
export const metadata: Metadata = {
  title: { template: "%s", default: "PalcoDesk" },
  description:
    "Complete documentation for PalcoDesk - the open source project management platform. Learn how to deploy, configure, and use PalcoDesk for your team.",
  keywords: [
    "PalcoDesk documentation",
    "project management docs",
    "self-hosted setup",
    "docker deployment",
    "kubernetes deployment",
    "nginx configuration",
    "traefik setup",
    "postgresql setup",
    "api documentation",
    "installation guide",
  ],
  openGraph: {
    title: "PalcoDesk Documentation",
    description:
      "Complete documentation for PalcoDesk - the open source project management platform. Learn how to deploy, configure, and use PalcoDesk for your team.",
    type: "website",
    url: "https://palcodesk.app/docs",
    siteName: "PalcoDesk",
    images: [
      {
        url: "/og-docs.png",
        width: 1200,
        height: 630,
        alt: "PalcoDesk Documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PalcoDesk Documentation",
    description:
      "Complete documentation for PalcoDesk - the open source project management platform. Learn how to deploy, configure, and use PalcoDesk for your team.",
    images: ["/og-docs.png"],
  },
  alternates: { canonical: "https://palcodesk.app/docs" },
  robots: { index: true, follow: true },
};
const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  githubUrl: "https://github.com/AbrahamRivero/kaneo",
  nav: { ...baseOptions.nav },
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout {...docsOptions}>
      <Script
        defer
        data-domain="PalcoDesk.app"
        src="https://plausible.PalcoDesk.app/js/script.js"
      />
      {children}
    </DocsLayout>
  );
}
