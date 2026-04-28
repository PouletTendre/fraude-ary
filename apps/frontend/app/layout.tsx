import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/hooks/useSettings";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fraude-Ary",
  description: "Portfolio tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <QueryProvider>
          <SettingsProvider>
            <ToastProvider>{children}</ToastProvider>
          </SettingsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}