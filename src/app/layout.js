import { Poppins } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
});


export const metadata = {
  title: "DIT | Tech Mahindra",
  description: "a media checker for detecting deepfakes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" /> */}
        <meta property="og:image" content="/logo.svg" />
        <link rel="icon" href="/logo.svg" />
      </head>

      <body className={poppins.className}>
        <Analytics />
        <div className="min-w-[1080px] ">
          {children}
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
