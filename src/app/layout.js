import { Outfit } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "DIT | Contrails",
  description: "a media checker for detecting deepfakes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <meta property="og:image" content="/logo.svg" />
        <link rel="icon" href="/logo.svg" />
      </head>

      <body className={outfit.className}>{children}</body>
    </html>
  );
}
