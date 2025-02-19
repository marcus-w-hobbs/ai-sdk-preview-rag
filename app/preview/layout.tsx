import type { Metadata } from "next";
import Link from 'next/link';

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
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">RAG Preview</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/content" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Upload
          </Link>
        </div>
      </footer>
    </div>
  );
} 