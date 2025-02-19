import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI SDK Preview RAG",
  description: "AI SDK Preview with RAG capabilities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
} 