import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PdfUpload } from './pdf-upload'
import { MarkdownUpload } from './markdown-upload'
import { UrlForm } from './url-form'
import { BatchUpload } from './batch-upload'

export function ContentIngestion() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="markdown">Markdown</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="pdf">
            <PdfUpload />
          </TabsContent>

          <TabsContent value="markdown">
            <MarkdownUpload />
          </TabsContent>

          <TabsContent value="url">
            <UrlForm />
          </TabsContent>

          <TabsContent value="batch">
            <BatchUpload />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 