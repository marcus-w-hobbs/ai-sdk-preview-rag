import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategorySelect } from './category-select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function UrlForm() {
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/ingest/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          categoryId,
        }),
      })

      if (!response.ok) throw new Error('Submission failed')

      const result = await response.json()
      toast.success('URL submitted successfully')
      setUrl('')
      setCategoryId(undefined)
    } catch (error) {
      toast.error('Failed to submit URL')
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL to import"
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
        type="submit"
        disabled={!url || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner className="mr-2" />
            Submitting...
          </>
        ) : (
          'Submit URL'
        )}
      </Button>
    </form>
  )
} 