// Get DOM elements
const categorySelect = document.getElementById('category') as HTMLSelectElement
const saveButton = document.getElementById('save') as HTMLButtonElement
const statusDiv = document.getElementById('status') as HTMLDivElement

// Load categories on popup open
async function loadCategories() {
  try {
    const response = await fetch('http://localhost:3000/api/categories')
    if (!response.ok) throw new Error('Failed to load categories')
    
    const categories = await response.json()
    categories.forEach((category: { id: string, name: string }) => {
      const option = document.createElement('option')
      option.value = category.id
      option.textContent = category.name
      categorySelect.appendChild(option)
    })
  } catch (error) {
    showStatus('Failed to load categories', 'error')
  }
}

// Handle save button click
saveButton.addEventListener('click', async () => {
  saveButton.disabled = true
  showStatus('Saving page...')

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.url) throw new Error('No active tab')

    // Save the page
    const response = await fetch('http://localhost:3000/api/ingest/url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: tab.url,
        categoryId: categorySelect.value || undefined
      })
    })

    if (!response.ok) throw new Error('Failed to save page')

    showStatus('Page saved successfully!', 'success')
    setTimeout(() => window.close(), 1500)
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : 'Failed to save page',
      'error'
    )
    saveButton.disabled = false
  }
})

function showStatus(message: string, type: 'error' | 'success' | 'info' = 'info') {
  statusDiv.textContent = message
  statusDiv.className = `status ${type}`
}

// Initialize popup
loadCategories() 