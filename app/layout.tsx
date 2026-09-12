import "./globals.css";
import type { Metadata } from "next";
import { prototypeMode } from "@/lib/prototype-mode";

export const metadata: Metadata = {
  title: {
    default: "Arogya Chikitsalaya",
    template: "Arogya Chikitsalaya — %s"
  },
  description: "Secure patient management and appointment portal for Arogya Chikitsalaya",
  applicationName: "Arogya Chikitsalaya"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {prototypeMode ? (
          <div className="prototype-banner">Prototype - demo data only, do not enter real patient information</div>
        ) : null}
        {children}
      </body>
    </html>
  );
}
