"use client"

//import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TaskSidebar } from "@/components/task/sidebar/task-sidebar";

import "./globals.css";
import { TaskHeader } from "@/components/task/header/task-header";
import { KeyboardShortcutsProvider } from "@/hooks/use-keyboard-shortcuts";
import AuthProvider from "@/components/providers/auth-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "@/lib/query-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* export const metadata: Metadata = {
  title: "Task Management",
  description: "Simple board interface for managing tasks",
}; */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <KeyboardShortcutsProvider>
                <SidebarProvider>
                  <TaskSidebar />
                  <div className="flex-1 flex flex-col overflow-hidden h-screen">
                    <TaskHeader />
                    {children}
                  </div>
                </SidebarProvider>
              </KeyboardShortcutsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
