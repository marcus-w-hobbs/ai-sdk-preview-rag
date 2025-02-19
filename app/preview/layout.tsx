import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-sdk-preview-rag.vercel.app"),
  title: "Retrieval Augmented Generation Preview",
  description:
    "Augment language model generations with vector based retrieval using the Vercel AI SDK",
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
} 