import { useState } from 'react'
import { toast } from 'sonner'
import { UploadZone } from './upload-zone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategorySelect } from './category-select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface UploadError {
  message: string
  field?: 'file' | 'name' | 'category'
}

export function PdfUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<string>()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<UploadError | null>(null)

  function validateFile(file: File): UploadError | null {
    if (file.size === 0)
      return { message: 'File is empty', field: 'file' }
    
    if (file.size > MAX_FILE_SIZE)
      return { 
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        field: 'file'
      }
    
    if (file.type !== 'application/pdf')
      return { message: 'Only PDF files are accepted', field: 'file' }
    
    return null
  }

  function handleFileSelect(newFile: File | null) {
    setError(null)
    if (!newFile) {
      setFile(null)
      return
    }

    const fileError = validateFile(newFile)
    if (fileError) {
      setError(fileError)
      toast.error(fileError.message)
      return
    }

    setFile(newFile)
  }

  async function handleUpload() {
    if (!file || !name) return

    setError(null)
    setIsUploading(true)
    console.log('Starting PDF upload:', { 
      fileName: file.name,
      fileSize: file.size,
      name,
      categoryId 
    })
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    if (categoryId) formData.append('categoryId', categoryId)

    try {
      console.log('Sending request to /api/ingest/pdf')
      const response = await fetch('/api/ingest/pdf', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Upload failed:', result)
        const errorMessage = result.error || 'Upload failed'
        setError({ message: errorMessage })
        toast.error(errorMessage)
        return
      }

      console.log('Upload successful:', result)
      toast.success('PDF uploaded and processed successfully')
      setFile(null)
      setName('')
      setCategoryId(undefined)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF'
      setError({ message: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <UploadZone
        onFileSelect={handleFileSelect}
        accept={{
          'application/pdf': ['.pdf']
        }}
        maxSize={MAX_FILE_SIZE}
        error={error?.field === 'file' ? error.message : undefined}
      />
      
      {file && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setError(null)
                setName(e.target.value)
              }}
              placeholder="Enter a name for this document"
              required
              error={error?.field === 'name' ? error.message : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <CategorySelect
              value={categoryId}
              onValueChange={(value) => {
                setError(null)
                setCategoryId(value)
              }}
              error={error?.field === 'category' ? error.message : undefined}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!name || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Processing PDF...
              </>
            ) : (
              'Upload PDF'
            )}
          </Button>

          {error && !error.field && (
            <div className="text-sm text-red-500 mt-2">
              {error.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 