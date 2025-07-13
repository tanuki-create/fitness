'use client'; // This is a client component

import { useEffect } from 'react';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";
import { fontSans } from "@/lib/fonts";
import { createClient } from '@/lib/supabase/client';

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
