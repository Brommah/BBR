import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GlobalProviders } from "@/components/global-providers";
import { AppLayoutWrapper } from "@/components/app-layout-wrapper";

const geist = Geist({
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
        className={`${geist.variable} antialiased`}
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
