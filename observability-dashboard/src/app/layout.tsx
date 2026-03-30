import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenya Pipeline Observatory",
  description: "Real-time observability for Kenya Food Prices ETL pipeline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}