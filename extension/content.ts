// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SAVE_SUCCESS') {
    showNotification('Content saved successfully', 'success')
  } else if (message.type === 'SAVE_ERROR') {
    showNotification(message.error || 'Failed to save content', 'error')
  }
})

function showNotification(message: string, type: 'success' | 'error') {
  // Create notification element
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    padding: 12px 24px;
    border-radius: 4px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `

  if (type === 'success') {
    notification.style.backgroundColor = '#10B981'
    notification.style.color = 'white'
  } else {
    notification.style.backgroundColor = '#EF4444'
    notification.style.color = 'white'
  }

  notification.textContent = message

  // Add animation keyframes
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `
  document.head.appendChild(style)

  // Add to page and remove after delay
  document.body.appendChild(notification)
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse'
    setTimeout(() => {
      notification.remove()
      style.remove()
    }, 300)
  }, 3000)
} 