import { Poppins } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "DIT | Tech Mahindra",
  description: "a media checker for detecting deepfakes",
  // You can also define icons here for more control, but just
  // placing the file in app/ is enough for the basic case.
  // See optional step below.
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 
        The <head> tag is now managed by Next.js through your `metadata` export.
        You don't need to add it here manually. The <link rel="icon"> tags
        will be automatically injected.
      */}
      <body className={poppins.className}>
        <Analytics />
        <div className="min-w-[1080px] font-poppins ">{children}</div>
        <SpeedInsights />
      </body>
    </html>
  );
}