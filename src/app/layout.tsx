import type { Metadata, Viewport } from "next";
import { Montserrat, Vidaloka } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const vidaloka = Vidaloka({
  variable: "--font-vidaloka",
  weight: "400",
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
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4B2D1E",
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
      className={`${montserrat.variable} ${vidaloka.variable} h-full antialiased bg-background`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
