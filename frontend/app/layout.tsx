import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

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
      <body>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
