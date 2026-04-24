import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/hooks/useSettings";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fraude-Ary | Portfolio Tracker",
  description: "Multi-asset portfolio tracking platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme || theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  var html = document.documentElement;
                  html.classList.remove('light', 'dark');
                  html.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <SettingsProvider>
              <ToastProvider>{children}</ToastProvider>
            </SettingsProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}