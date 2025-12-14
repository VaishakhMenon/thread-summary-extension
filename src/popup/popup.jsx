import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

function Popup() {
  const [status, setStatus] = useState('Ready')

  const handleExtract = async () => {
    setStatus('Extracting conversation...')
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { action: 'extract' }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message)
          return
        }
        
        if (response && response.messages && response.messages.length > 0) {
          setStatus(`✅ Found ${response.messages.length} messages!`)
          console.log('Extracted:', response.messages)
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
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<Popup />)