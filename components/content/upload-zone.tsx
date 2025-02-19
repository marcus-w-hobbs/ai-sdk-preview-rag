import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { UploadIcon } from '@radix-ui/react-icons'

interface UploadZoneProps {
  onFileSelect: (file: File | null) => void
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
  error?: string
}

export function UploadZone({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  error
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  })

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-muted/50',
          isDragActive && 'border-primary bg-muted/50',
          (isDragReject || error) && 'border-destructive bg-destructive/10',
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <UploadIcon className="h-8 w-8" />
          <p className="text-sm text-center">
            {isDragActive
              ? 'Drop the file here...'
              : isDragReject
                ? 'File type not accepted'
                : error
                  ? error
                  : 'Drag and drop a file here, or click to select'}
          </p>
          <p className="text-xs">
            Max file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>
    </div>
  )
} 