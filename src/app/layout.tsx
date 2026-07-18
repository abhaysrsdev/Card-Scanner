import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Card Scanner",
  description: "Production-ready web application for scanning visiting cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
