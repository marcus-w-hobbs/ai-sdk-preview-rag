import type { Metadata } from "next";
import "./preview/globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 