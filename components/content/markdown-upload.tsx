import { useState } from 'react'
import { toast } from 'sonner'
import { UploadZone } from './upload-zone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategorySelect } from './category-select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function MarkdownUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleFileUpload() {
    if (!file || !name) return
    const content = await file.text()
    handleSubmit(content)
  }

  async function handleSubmit(markdownContent: string) {
    if (!markdownContent || !name) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ingest/markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: markdownContent,
          name,
          categoryId,
        }),
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      toast.success('Markdown uploaded successfully')
      setFile(null)
      setContent('')
      setName('')
      setCategoryId(undefined)
    } catch (error) {
      toast.error('Failed to upload Markdown')
      console.error('Upload error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="file">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file">Upload File</TabsTrigger>
          <TabsTrigger value="paste">Paste Content</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4">
          <UploadZone
            onFileSelect={setFile}
            accept={{
              'text/markdown': ['.md', '.markdown'],
              'text/plain': ['.txt']
            }}
            maxSize={5 * 1024 * 1024} // 5MB
          />
          
          {file && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-name">Document Name</Label>
                <Input
                  id="file-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for this document"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <CategorySelect
                  value={categoryId}
                  onValueChange={setCategoryId}
                />
              </div>

              <Button
                onClick={handleFileUpload}
                disabled={!name || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload Markdown'
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paste" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paste-name">Document Name</Label>
            <Input
              id="paste-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this document"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your Markdown content here"
              className="min-h-[200px] font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <CategorySelect
              value={categoryId}
              onValueChange={setCategoryId}
            />
          </div>

          <Button
            onClick={() => handleSubmit(content)}
            disabled={!content || !name || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Content'
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
} 