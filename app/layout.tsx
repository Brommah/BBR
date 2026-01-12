import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GlobalProviders } from "@/components/global-providers";
import { AppLayoutWrapper } from "@/components/app-layout-wrapper";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Broersma Engineer OS",
  description: "High-performance backoffice for Broersma Bouwadvies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${inter.variable} antialiased`}
      >
        <GlobalProviders>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
          <Toaster />
        </GlobalProviders>
      </body>
    </html>
  );
}
