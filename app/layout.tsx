import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "./components/MobileNav";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Proov - Платформа для футболистов",
  description: "Докажи что ты игрок. Premium футбольная платформа для скаутов и игроков.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-inter bg-[#080808] text-white">
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
