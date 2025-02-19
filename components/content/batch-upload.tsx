import { useState } from 'react'
import { toast } from 'sonner'
import { UploadZone } from './upload-zone'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CategorySelect } from './category-select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

interface BatchFile {
  file: File
  name: string
  type: 'pdf' | 'markdown'
}

export function BatchUpload() {
  const [files, setFiles] = useState<BatchFile[]>([])
  const [categoryId, setCategoryId] = useState<string>()
  const [isUploading, setIsUploading] = useState(false)

  function handleFileSelect(file: File | null) {
    if (!file) return
    
    const type = file.type === 'application/pdf' ? 'pdf' : 'markdown'
    setFiles(prev => [...prev, {
      file,
      name: file.name,
      type
    }])
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0) return

    setIsUploading(true)
    const formData = new FormData()
    
    // Add files to formData
    files.forEach((file, index) => {
      formData.append(`file-${file.name}`, file.file)
    })

    // Add metadata
    formData.append('items', JSON.stringify(
      files.map(file => ({
        type: file.type,
        name: file.name
      }))
    ))
    
    if (categoryId) formData.append('categoryId', categoryId)

    try {
      const response = await fetch('/api/ingest/batch', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      toast.success(`Successfully processed ${result.results.length} files`)
      setFiles([])
      setCategoryId(undefined)
    } catch (error) {
      toast.error('Failed to process files')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <UploadZone
        onFileSelect={handleFileSelect}
        accept={{
          'application/pdf': ['.pdf'],
          'text/markdown': ['.md', '.markdown'],
          'text/plain': ['.txt']
        }}
        maxSize={10 * 1024 * 1024} // 10MB per file
      />
      
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selected Files</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span className="text-sm truncate">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <CategorySelect
              value={categoryId}
              onValueChange={setCategoryId}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Uploading {files.length} files...
              </>
            ) : (
              `Upload ${files.length} files`
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 