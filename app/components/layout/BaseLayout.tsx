import { ReactNode } from 'react';

interface BaseLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showSidebar?: boolean;
}

export default function BaseLayout({ 
  children, 
  showFooter = true, 
  showSidebar = false 
}: BaseLayoutProps) {
  return (
    <div className="relative min-h-screen flex">
      {showSidebar && (
        <aside className="w-64 border-r border-neutral-200 dark:border-neutral-700">
          {/* Sidebar content will be injected here */}
        </aside>
      )}
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        
        {showFooter && (
          <footer className="fixed bottom-0 left-0 w-full bg-neutral-100 dark:bg-neutral-800 py-4 z-10">
            <nav className="container mx-auto flex justify-center space-x-6">
              <a 
                href="/preview" 
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Chat
              </a>
              <a 
                href="/content" 
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Upload
              </a>
            </nav>
          </footer>
        )}
      </main>
    </div>
  );
} 