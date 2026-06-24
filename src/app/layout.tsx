import type { Metadata, Viewport } from "next";
import { Montserrat, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";
import { PwaInstallBanner } from "@/components/shared/PwaInstallBanner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Delicias Caseras | Inventario",
  description: "Sistema de inventario y ventas para Delicias Caseras",
  applicationName: "Delicias Caseras",
  appleWebApp: {
    capable: true,
    title: "Delicias",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B2A20",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${fraunces.variable} h-full antialiased bg-background`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Captura beforeinstallprompt antes de que React hidrate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});`,
          }}
        />
        {children}
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
        <PwaInstallBanner />
      </body>
    </html>
  );
}
