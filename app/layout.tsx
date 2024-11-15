import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter } from 'next/font/google'
import "./globals.css";
import SupabaseProvider from "@/providers/SupabaseProvider";
import UserProvider from "@/providers/UserProvider";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "ImageCrafter",
  description: "Create stunning image designs with text and effects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SupabaseProvider>
          <UserProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              suppressHydrationWarning
            >
              <div className="min-h-screen bg-background">
                {children}
                <Analytics />
                <SpeedInsights />
                <Toaster />
              </div>
            </ThemeProvider>
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
