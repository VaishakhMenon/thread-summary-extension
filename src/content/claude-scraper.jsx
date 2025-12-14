// Content script that runs on claude.ai
console.log('Thread Summary: Content script loaded on Claude.ai')

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const messages = extractConversation()
    sendResponse({ messages })
  }
  return true
})

function extractConversation() {
  const messages = []
  
  // Find all message containers on Claude.ai
  // This selector might need adjustment based on Claude's current DOM
  const messageElements = document.querySelectorAll('[data-test-render-count]')
  
  messageElements.forEach((element, index) => {
    const text = element.textContent || element.innerText
    
    // Determine role (simple heuristic for now)
    const isUser = index % 2 === 0
    
    messages.push({
      role: isUser ? 'user' : 'assistant',
      content: text.trim(),
      timestamp: new Date().toISOString()
    })
  })
  
  console.log('Extracted messages:', messages)
  return messages
}
