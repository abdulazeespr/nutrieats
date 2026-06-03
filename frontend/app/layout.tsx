import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriEats — Eat what you love. Know what you eat.",
  description:
    "Food delivery with full nutritional transparency. Track your daily nutrients and make informed choices.",
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
