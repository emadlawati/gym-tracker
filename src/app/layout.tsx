import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import UserSwitcher from "@/components/UserSwitcher";
import { getUserId } from "@/lib/cookies";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Personal workout tracking — log sets, chase PRs, level up",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym Track",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userId = await getUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { name: true, title: true } }) : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js").catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 overscroll-none">
        <div className="max-w-lg mx-auto w-full px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 truncate">
            {user ? `${user.name} — ${user.title}` : ""}
          </span>
          <UserSwitcher />
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-1">
          {children}
        </div>
        <Navbar />
      </body>
    </html>
  );
}
