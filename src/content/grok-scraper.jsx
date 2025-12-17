console.log('Thread Summary: Grok Scraper loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    console.log('Grok: Extracting conversation...')
    
    try {
      const messages = []
      
      // Find all response containers
      const responseContainers = document.querySelectorAll('[id^="response-"]')
      console.log('Found', responseContainers.length, 'response containers')
      
      responseContainers.forEach((container, index) => {
        // Try to find the message bubble
        const messageBubble = container.querySelector('.message-bubble')
        if (!messageBubble) return
        
        // Get the markdown content
        const markdownContent = messageBubble.querySelector('.response-content-markdown, .markdown')
        if (!markdownContent) return
        
        const content = markdownContent.innerText.trim()
        
        // Determine role by checking classes or position
        // Grok alternates: first is usually user, then assistant, etc.
        // Or we can check for specific styling classes
        const role = (index % 2 === 0) ? 'user' : 'assistant'
        
        if (content) {
          messages.push({
            role: role,
            content: content
          })
        }
      })
      
      console.log('Successfully extracted', messages.length, 'messages')
      sendResponse({ messages: messages })
      
    } catch (error) {
      console.error('Grok extraction error:', error)
      sendResponse({ messages: [] })
    }
  }
  
  return true
})