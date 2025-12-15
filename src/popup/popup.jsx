import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

function Popup() {
  const [status, setStatus] = useState('Ready')
  const [messageCount, setMessageCount] = useState(0)
  const [messages, setMessages] = useState([])

  const handleExtract = async () => {
    setStatus('Extracting conversation...')
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      chrome.tabs.sendMessage(tab.id, { action: 'extract' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message)
          return
        }
        
        if (response && response.messages && response.messages.length > 0) {
          setMessageCount(response.messages.length)
          setMessages(response.messages)
          setStatus(`✅ Found ${response.messages.length} messages!`)
          
          // Log to console for debugging
          console.log('Extracted messages:', response.messages)
        } else {
          setStatus('❌ No conversation found')
        }
      })
    } catch (error) {
      setStatus('Error: ' + error.message)
    }
  }

  return (
    <div className="popup-container">
      <h1>Thread Summary</h1>
      <p className="status">{status}</p>
      
      <button onClick={handleExtract} className="extract-btn">
        Extract Conversation
      </button>
      
      {messageCount > 0 && (
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