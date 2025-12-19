console.log('Thread Summary: ChatGPT Scraper loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    console.log('ChatGPT: Extracting conversation...')
    
    scrollToLoadAllMessages().then(() => {
      try {
        const messages = []
        const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]')
        console.log('ChatGPT: Found', articles.length, 'articles')
        
        articles.forEach((article, index) => {
          const authorRole = article.querySelector('[data-message-author-role]')
          if (!authorRole) return
          
          const role = authorRole.getAttribute('data-message-author-role')
          
          let content = ''
          
          // For user messages - use whitespace-pre-wrap
          if (role === 'user') {
            const whitespaceDiv = article.querySelector('.whitespace-pre-wrap')
            if (whitespaceDiv) {
              content = whitespaceDiv.innerText || whitespaceDiv.textContent || ''
            }
          }
          
          // For assistant messages - use markdown.prose but get ALL text from parent
          if (role === 'assistant') {
            const markdownDiv = article.querySelector('.markdown.prose')
            if (markdownDiv) {
              // Try multiple extraction methods
              content = markdownDiv.innerText || markdownDiv.textContent || ''
              
              // If still empty, try getting from parent container
              if (!content || content.trim().length === 0) {
                const parentContainer = markdownDiv.closest('[data-message-author-role]')
                if (parentContainer) {
                  content = parentContainer.innerText || parentContainer.textContent || ''
                }
              }
              
              // Last resort - get all text from the article
              if (!content || content.trim().length === 0) {
                content = article.innerText || article.textContent || ''
                // Remove the "ChatGPT" prefix if present
                content = content.replace(/^ChatGPT\s*/i, '')
              }
            }
          }
          
          content = content.trim()
          
          if (content && role) {
            console.log(`ChatGPT: Extracted message ${index + 1} (${role}): ${content.substring(0, 50)}...`)
            messages.push({
              role: role,
              content: content
            })
          } else {
            console.warn(`ChatGPT: Skipped article ${index} - no content found`)
          }
        })
        
        console.log('ChatGPT: Successfully extracted', messages.length, 'messages')
        sendResponse({ messages: messages })
        
      } catch (error) {
        console.error('ChatGPT extraction error:', error)
        sendResponse({ messages: [] })
      }
    })
  }
  
  return true
})

async function scrollToLoadAllMessages() {
  console.log('ChatGPT: Starting auto-scroll to load all messages...')
  
  const mainElement = document.querySelector('main')
  const scrollContainer = mainElement || window
  
  console.log('ChatGPT: Scroll container:', scrollContainer === window ? 'window' : 'main element')
  
  return new Promise((resolve) => {
    let lastMessageCount = 0
    let stableCount = 0
    let scrollAttempts = 0
    const maxScrollAttempts = 20
    
    const scrollCycle = setInterval(() => {
      scrollAttempts++
      console.log(`ChatGPT: Scroll attempt ${scrollAttempts}/${maxScrollAttempts}`)
      
      if (scrollContainer === window) {
        window.scrollTo(0, 0)
      } else {
        scrollContainer.scrollTop = 0
      }
      
      setTimeout(() => {
        if (scrollContainer === window) {
          window.scrollTo(0, document.body.scrollHeight)
        } else {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
        
        const currentMessages = document.querySelectorAll('article[data-testid^="conversation-turn-"]').length
        console.log(`ChatGPT: Messages currently visible: ${currentMessages}`)
        
        if (currentMessages === lastMessageCount) {
          stableCount++
        } else {
          stableCount = 0
          lastMessageCount = currentMessages
        }
        
        if (stableCount >= 3 || scrollAttempts >= maxScrollAttempts) {
          clearInterval(scrollCycle)
          console.log(`ChatGPT: Finished scrolling. Total messages found: ${currentMessages}`)
          setTimeout(resolve, 1000)
        }
      }, 400)
    }, 800)
  })
}