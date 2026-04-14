import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "yourclaw",
  description: "One click. One cloud instance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
