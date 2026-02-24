import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "TFT Bible Class",
  description:
    "Deepen your faith at your own pace with TFT Bible Class, a serene online Bible study sanctuary.",
  openGraph: {
    title: "TFT Bible Class",
    description:
      "Deepen your faith at your own pace with TFT Bible Class.",
    type: "website"
  }
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen bg-surface font-body text-slate-800 antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            {props.children}
          </div>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
