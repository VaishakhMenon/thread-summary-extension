import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

function Popup() {
  const [status, setStatus] = useState('Ready')
  const [messageCount, setMessageCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleExtract = async () => {
    setStatus('Extracting conversation...')
    setIsLoading(true)
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      // Extract messages from content script
      chrome.tabs.sendMessage(tab.id, { action: 'extract' }, async (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message)
          setIsLoading(false)
          return
        }
        
        if (response && response.messages && response.messages.length > 0) {
          const extractedMessages = response.messages
          setMessageCount(extractedMessages.length)
          setMessages(extractedMessages)
          setStatus(`✅ Found ${extractedMessages.length} messages! Generating summary...`)
          
          console.log('Extracted messages:', extractedMessages)
          
          // Send to background worker for summarization
          chrome.runtime.sendMessage(
            { action: 'summarize', messages: extractedMessages },
            (response) => {
              if (chrome.runtime.lastError) {
                setStatus('❌ Error: ' + chrome.runtime.lastError.message)
                setIsLoading(false)
                return
              }
              
              if (response && response.success) {
                setSummary(response.summary)
                setStatus(`✅ Summary generated from ${extractedMessages.length} messages!`)
              } else {
                setStatus('❌ Failed to generate summary: ' + (response?.error || 'Unknown error'))
                console.error('Summarization error:', response?.error)
              }
              setIsLoading(false)
            }
          )
        } else {
          setStatus('❌ No conversation found')
          setIsLoading(false)
        }
      })
    } catch (error) {
      setStatus('Error: ' + error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="popup-container">
      <h1>Thread Summary</h1>
      <p className="status">{status}</p>
      
      <button 
        onClick={handleExtract} 
        className="extract-btn"
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Extract & Summarize'}
      </button>
      
      {summary && (
        <div className="summary-section">
          <h2>Summary</h2>
          <div className="summary-content">
            {summary}
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(summary)}
            className="copy-btn"
          >
            📋 Copy Summary
          </button>
        </div>
      )}
      
      {messageCount > 0 && !summary && !isLoading && (
        <div className="preview">
          <h3>Preview (first 3 messages):</h3>
          {messages.slice(0, 3).map((msg, i) => (
            <div key={i} className="message-preview">
              <strong>{msg.role}:</strong>
              <p>{msg.content.substring(0, 100)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<Popup />)