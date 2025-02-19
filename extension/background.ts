import { extract } from '@extractus/article-extractor'

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save to RAG',
    contexts: ['page']
  })

  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save Selection to RAG',
    contexts: ['selection']
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url) return

  try {
    if (info.menuItemId === 'save-page') {
      const article = await extract(tab.url)
      if (!article) throw new Error('Failed to extract content')

      await saveContent({
        url: tab.url,
        title: article.title || tab.title || 'Untitled',
        content: article.content || '',
        metadata: {
          author: article.author,
          publishedDate: article.published,
          siteName: article.siteName
        }
      })
    } else if (info.menuItemId === 'save-selection') {
      await saveContent({
        url: tab.url,
        title: tab.title || 'Untitled Selection',
        content: info.selectionText || '',
        metadata: {
          type: 'selection',
          source: tab.url
        }
      })
    }

    // Notify content script of successful save
    chrome.tabs.sendMessage(tab.id!, { type: 'SAVE_SUCCESS' })
  } catch (error) {
    console.error('Save error:', error)
    chrome.tabs.sendMessage(tab.id!, { 
      type: 'SAVE_ERROR',
      error: error instanceof Error ? error.message : 'Failed to save content'
    })
  }
})

interface SaveContentParams {
  url: string
  title: string
  content: string
  metadata?: Record<string, any>
}

async function saveContent(params: SaveContentParams) {
  const response = await fetch('http://localhost:3000/api/ingest/url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: params.url,
      name: params.title,
      content: params.content,
      metadata: params.metadata
    })
  })

  if (!response.ok) {
    throw new Error('Failed to save content')
  }

  return response.json()
} 