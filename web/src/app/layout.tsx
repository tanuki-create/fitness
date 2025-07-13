'use client'; // This is a client component

import { useEffect } from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";
import { fontSans } from "@/lib/fonts";
import { createClient } from '@/lib/supabase/client';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const supabase = createClient();

    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's no session (neither normal nor anonymous), sign in anonymously
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Error signing in anonymously:', error);
        } else {
          console.log('Signed in anonymously:', data.user);
        }
      }
    };

    handleAuth();
  }, []);

  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
