"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <title>Interesta – Connect with your tribe</title>
        <meta
          name="description"
          content="Modern social discovery for real people, nearby."
        />
        <link rel="icon" href="/icon.svg" />
      </head>
      <body className="font-sans text-white bg-bg relative">
        <div className="glow-bg" />
        <NavBar />
        <main className="pt-20">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
