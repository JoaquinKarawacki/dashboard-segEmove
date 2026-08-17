import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";
import "./globals.css";

// Tipografía de marca de SEG Ingeniería (ver guía de estilos compartida).
const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  variable: "--font-red-hat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Dashboard Cargadores DC — SEG",
  description: "Dashboard de transacciones de los cargadores DC de SEG Ingeniería",
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={redHatDisplay.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
