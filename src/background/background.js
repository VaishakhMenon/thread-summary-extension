import Anthropic from '@anthropic-ai/sdk'

console.log('Thread Summary: Background service worker loaded')

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    console.log('Received summarize request with', request.messages.length, 'messages')
    
    // Handle async summarization
    handleSummarization(request.messages)
      .then(summary => {
        sendResponse({ success: true, summary })
      })
      .catch(error => {
        console.error('Summarization error:', error)
        sendResponse({ success: false, error: error.message })
      })
    
    // Return true to indicate async response
    return true
  }
})

async function handleSummarization(messages) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  
  if (!apiKey) {
    throw new Error('API key not found')
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  })

  // Format conversation
  const conversationText = messages.map((msg, index) => {
    const role = msg.role === 'user' ? 'USER' : 'ASSISTANT'
    const content = msg.content.substring(0, 1000)
    return `[${index + 1}] ${role}:\n${content}\n`
  }).join('\n---\n\n')

  console.log('Calling Claude API...')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `Please analyze this AI conversation thread and provide a comprehensive summary.

CONVERSATION:
${conversationText}

Please provide:

1. **Main Topic**: What is this conversation about? (2-3 sentences)

2. **Key Points**: What are the 3-5 most important points discussed?

3. **Technical Decisions & Approaches**:
   - ✅ **What Worked**: Approaches that succeeded and should be continued
   - ❌ **What Didn't Work**: Approaches that failed or were abandoned (and why)
   - 🔄 **Pivots**: Major direction changes and their reasoning

4. **Outcomes**: What was accomplished or decided?

5. **Action Items**: Any next steps or tasks mentioned?

Format the response in clear markdown. Be specific about technical details where relevant. Focus on actionable insights that would help someone pick up this work later.`
    }]
  })

  return response.content[0].text
}