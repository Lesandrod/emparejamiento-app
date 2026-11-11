import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

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
  title: "UFC FIGHT NIGHT • Matchmaker Studio",
  description: "Sistema oficial de emparejamiento y cartelera UFC",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`h-full ${spaceGrotesk.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full bg-[#090a0d] text-[#f1f1f4] font-sans flex flex-col antialiased selection:bg-[#d4af37] selection:text-black">
        {children}
      </body>
    </html>
  );
}
