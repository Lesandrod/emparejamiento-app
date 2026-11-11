import { Space_Grotesk, Inter, Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "UFC FIGHT NIGHT • Neo Matchmaker Studio",
  description: "Sistema oficial de emparejamiento y cartelera UFC en Modo Neón",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`h-full ${orbitron.variable} ${spaceGrotesk.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full bg-[#07080d] text-[#e2e2e8] font-sans flex flex-col antialiased selection:bg-[#00f2fe] selection:text-black">
        {children}
      </body>
    </html>
  );
}
