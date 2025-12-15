// Content script for Claude.ai - Simple & Reliable Version
console.log('Thread Summary: Scraper v2 loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const messages = extractConversation()
    sendResponse({ messages })
  }
  return true
})

function extractConversation() {
  const messages = []
  
  // Strategy: Find all divs with data-test-render-count
  // These wrap individual message turns
  const messageTurns = document.querySelectorAll('[data-test-render-count]')
  
  console.log(`Found ${messageTurns.length} potential message turns`)
  
  messageTurns.forEach((turn, index) => {
    // Check for user message
    const userContent = turn.querySelector('[data-testid="user-message"]')
    if (userContent) {
      const text = extractVisibleText(userContent)
      if (text.trim().length > 0) {
        messages.push({
          role: 'user',
          content: text.trim(),
          timestamp: new Date().toISOString(),
          index: index
        })
      }
    }
    
    // Check for assistant message
    const assistantContent = turn.querySelector('.font-claude-response')
    if (assistantContent) {
      const text = extractVisibleText(assistantContent)
      if (text.trim().length > 0) {
        messages.push({
          role: 'assistant',
          content: text.trim(),
          timestamp: new Date().toISOString(),
          index: index
        })
      }
    }
  })
  
  console.log(`Successfully extracted ${messages.length} messages`)
  return messages
}

function extractVisibleText(element) {
  // Get all text content, preserving line breaks
  return element.innerText || element.textContent || ''
}