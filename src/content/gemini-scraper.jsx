console.log('Thread Summary: Gemini Scraper loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    console.log('Gemini: Extracting conversation...')
    
    try {
      const messages = []
      
      // Find all message containers in the chat history
      const chatContainer = document.querySelector('[data-test-id="chat-history-container"]')
      if (!chatContainer) {
        console.log('Gemini: Chat container not found')
        sendResponse({ messages: [] })
        return
      }
      
      // Get all user queries
      const userQueries = chatContainer.querySelectorAll('user-query')
      const modelResponses = chatContainer.querySelectorAll('model-response')
      
      console.log('Found', userQueries.length, 'user messages')
      console.log('Found', modelResponses.length, 'assistant messages')
      
      // Process messages in order by walking the DOM
      const allMessages = chatContainer.querySelectorAll('user-query, model-response')
      
      allMessages.forEach((element) => {
        let role, content
        
        if (element.tagName.toLowerCase() === 'user-query') {
          role = 'user'
          // Try to find the query content
          const queryContent = element.querySelector('.query-content, .user-query-container')
          content = queryContent ? queryContent.innerText.trim() : element.innerText.trim()
        } else if (element.tagName.toLowerCase() === 'model-response') {
          role = 'assistant'
          // Try to find the response content
          const responseContent = element.querySelector('message-content, .model-response-text')
          content = responseContent ? responseContent.innerText.trim() : element.innerText.trim()
        }
        
        if (content && role) {
          messages.push({
            role: role,
            content: content
          })
        }
      })
      
      console.log('Successfully extracted', messages.length, 'messages')
      sendResponse({ messages: messages })
      
    } catch (error) {
      console.error('Gemini extraction error:', error)
      sendResponse({ messages: [] })
    }
  }
  
  return true
})