import { Rajdhani, Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-ufc",
  weight: ["500", "600", "700"],
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-fighter",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600", "700"],
});

export const metadata = {
  title: "Fight Night • Sparring Matchmaker",
  description: "Cartelera oficial de combates y emparejamiento estilo UFC",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${rajdhani.variable} ${oswald.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#050711] text-[#f1f5f9]">
        {children}
      </body>
    </html>
  );
}
