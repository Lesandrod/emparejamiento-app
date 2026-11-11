import { Oswald, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-fighter",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Fight Night • Sparring Matchmaker",
  description: "Cartelera oficial de combates y sorteo de sparring en tiempo real",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${oswald.variable} ${jetbrainsMono.variable} ${plusJakarta.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0a0c10] text-[#e2e8f0]">
        {children}
      </body>
    </html>
  );
}
