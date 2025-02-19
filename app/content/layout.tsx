import Link from 'next/link'

export const metadata = {
  title: 'AI SDK Preview RAG',
  description: 'A modern RAG implementation using the latest AI SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className="min-h-full bg-gray-50 antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">AI SDK Preview</h1>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>

          <footer className="border-t border-gray-200 bg-white">
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
      </body>
    </html>
  )
}
