import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { RouteGuard } from "@/lib/route-guard";
import { FirestoreProvider } from "@/components/FirestoreProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Project KILOS - Energy Warrior",
  description: "Transform from an energy couch potato into a KILOS Warrior",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KILOS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D1117',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased overflow-x-hidden">
        <AuthProvider>
          <FirestoreProvider>
           <RouteGuard>
            <div className="max-w-md mx-auto relative">
              {children}
            </div>
          </RouteGuard>
          </FirestoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
