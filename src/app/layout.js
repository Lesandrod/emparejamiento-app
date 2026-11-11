import { Rajdhani, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-ufc",
  weight: ["500", "600", "700"],
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  variable: "--font-hud",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600", "700"],
});

export const metadata = {
  title: "UFC Neo Fight Night • Sparring Matchmaker",
  description: "Plataforma de emparejamiento de combates en tiempo real - Interfaz HUD Cyberpunk",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${rajdhani.variable} ${chakraPetch.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#050711] text-[#f1f5f9]">
        {children}
      </body>
    </html>
  );
}
