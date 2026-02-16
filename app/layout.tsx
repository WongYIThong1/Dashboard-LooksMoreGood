import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { NoInspectGuard } from "@/components/no-inspect-guard";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

function resolveSiteUrl() {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromPublic) return fromPublic;

  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prodHost) return `https://${prodHost}`;

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SQLBots AI Security Platform",
    template: "%s | SQLBots",
  },
  description:
    "An AI-powered cloud platform that automates SQL scanning, intelligent detection, and workflow management at scale.",
  applicationName: "SQLBots",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "SQLBots",
    title: "SQLBots AI Security Platform",
    description:
      "An AI-powered cloud platform that automates SQL scanning, intelligent detection, and workflow management at scale.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SQLBots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SQLBots AI Security Platform",
    description:
      "An AI-powered cloud platform that automates SQL scanning, intelligent detection, and workflow management at scale.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${inter.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <NoInspectGuard />
          <Toaster position="top-right" duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
