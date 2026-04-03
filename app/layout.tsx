import "./globals.css";
import "@/components/agent/frontend/styles.css";
import type { Metadata } from "next";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";

export const metadata: Metadata = {
  title: "SANNATA.me",
  description: "Portal",
  themeColor: "#1f4d7a",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icons/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icons/icon-64.png", type: "image/png", sizes: "64x64" },
      {
        url: "/icons/master.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#1f4d7a"
        />
      </head>
      <body>
        {children}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
