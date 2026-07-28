import { Outfit } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "DIT | Contrails",
  description: "a media checker for detecting fake media",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <meta property="og:image" content="/logo.png" />
        <link rel="icon" href="/logo.png" />
      </head>

      <body className={`${outfit.className} font-outfit antialiased`}>
        <Analytics />
        <div className="min-w-[1080px]">
          {children}
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
