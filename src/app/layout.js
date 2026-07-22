import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "AcroSystem",
  description: "Sistema de gestión para Acrofobia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} dark h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
