import type { Metadata } from "next";
import Link from "next/link";

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
  return (
    <div className="relative min-h-screen">
      {children}
      <footer className="fixed bottom-0 left-0 w-full bg-neutral-100 dark:bg-neutral-800 py-4">
        <div className="container mx-auto flex justify-center">
          <Link 
            href="/content" 
            className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            Upload
          </Link>
        </div>
      </footer>
    </div>
  );
} 