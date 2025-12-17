console.log('Thread Summary: ChatGPT Scraper loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    console.log('ChatGPT: Extracting conversation...')
    
    try {
      const messages = []
      
      // Find all article elements with conversation turns
      const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]')
      console.log('Found', articles.length, 'potential message turns')
      
      articles.forEach((article, index) => {
        // Get the role from data attribute
        const authorRole = article.querySelector('[data-message-author-role]')
        if (!authorRole) return
        
        const role = authorRole.getAttribute('data-message-author-role')
        
        // Get the message content
        // ChatGPT uses markdown prose divs for content
        const contentDiv = article.querySelector('.markdown.prose')
        if (!contentDiv) return
        
        const content = contentDiv.innerText.trim()
        
        if (content && role) {
          messages.push({
            role: role, // 'user' or 'assistant'
            content: content
          })
        }
      })
      
      console.log('Successfully extracted', messages.length, 'messages')
      sendResponse({ messages: messages })
      
    } catch (error) {
      console.error('ChatGPT extraction error:', error)
      sendResponse({ messages: [] })
    }
  }
  
  return true
})