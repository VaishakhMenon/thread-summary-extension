import { useState, useEffect } from 'react'
import './popup.css'

function App() {
  const [extractedMessages, setExtractedMessages] = useState([])
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('Ready to extract and summarize')
  const [isLoading, setIsLoading] = useState(false)
  const [platform, setPlatform] = useState('Unknown')
  const [stats, setStats] = useState({ messageCount: 0, wordCount: 0 })

  // Detect current platform
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = tabs[0].url
        if (url.includes('claude.ai')) setPlatform('Claude')
        else if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) setPlatform('ChatGPT')
        else if (url.includes('gemini.google.com')) setPlatform('Gemini')
        else if (url.includes('grok.com') || url.includes('x.ai')) setPlatform('Grok')
        else setPlatform('Unknown')
      }
    })
  }, [])

  const handleExtractAndSummarize = async () => {
    setIsLoading(true)
    setStatus('🔍 Extracting conversation...')
    setSummary('')
    setExtractedMessages([])

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab || !tab.id) {
        setStatus('❌ Error: No active tab found')
        setIsLoading(false)
        return
      }

      // Check if we're on a supported platform
      const url = tab.url || ''
      const supportedPlatforms = [
        'claude.ai',
        'chat.openai.com',
        'chatgpt.com',
        'gemini.google.com',
        'grok.com',
        'x.ai'
      ]
      
      const isSupported = supportedPlatforms.some(platform => url.includes(platform))
      
      if (!isSupported) {
        setStatus('❌ Please navigate to Claude, ChatGPT, Gemini, or Grok')
        setIsLoading(false)
        return
      }

      // Send message to content script to extract
      chrome.tabs.sendMessage(tab.id, { action: 'extract' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError)
          setStatus('❌ Content script not loaded. Try refreshing the page.')
          setIsLoading(false)
          return
        }

        if (response && response.messages && response.messages.length > 0) {
          setExtractedMessages(response.messages)
          
          // Calculate stats
          const messageCount = response.messages.length
          const wordCount = response.messages.reduce((total, msg) => {
            return total + msg.content.split(/\s+/).length
          }, 0)
          setStats({ messageCount, wordCount })

          setStatus(`✅ Extracted ${messageCount} messages (${wordCount.toLocaleString()} words). Summarizing...`)

          // Send to background for summarization
          chrome.runtime.sendMessage(
            { action: 'summarize', messages: response.messages },
            (summaryResponse) => {
              if (chrome.runtime.lastError) {
                setStatus('❌ Error: ' + chrome.runtime.lastError.message)
                setIsLoading(false)
                return
              }

              if (summaryResponse && summaryResponse.success) {
                setSummary(summaryResponse.summary)
                setStatus(`✅ Summary generated! (${messageCount} messages analyzed)`)
              } else {
                setStatus('❌ Failed: ' + (summaryResponse?.error || 'Unknown error'))
              }
              setIsLoading(false)
            }
          )
        } else {
          setStatus('❌ No messages found. Make sure you\'re on a conversation page.')
          setIsLoading(false)
        }
      })
    } catch (error) {
      console.error('Error:', error)
      setStatus('❌ Error: ' + error.message)
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (extractedMessages.length === 0) {
      setStatus('❌ No messages to export. Extract first!')
      return
    }

    // Create CSV content
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    let csvContent = 'Timestamp,Platform,Role,Message_Number,Word_Count,Content\n'
    
    extractedMessages.forEach((msg, index) => {
      const wordCount = msg.content.split(/\s+/).length
      // Escape content for CSV (handle quotes and newlines)
      const escapedContent = '"' + msg.content.replace(/"/g, '""').replace(/\n/g, ' ') + '"'
      csvContent += `${timestamp},${platform},${msg.role},${index + 1},${wordCount},${escapedContent}\n`
    })

    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${platform}-conversation-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setStatus('📊 CSV exported successfully!')
    setTimeout(() => setStatus(`✅ Extracted ${stats.messageCount} messages`), 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setStatus('📋 Copied to clipboard!')
    setTimeout(() => setStatus(`✅ Summary generated! (${stats.messageCount} messages analyzed)`), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${platform}-conversation-summary-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setStatus('💾 Downloaded summary!')
    setTimeout(() => setStatus(`✅ Summary generated! (${stats.messageCount} messages analyzed)`), 2000)
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h1>Thread Summary</h1>
        <div className="platform-badge">{platform}</div>
      </div>

      <div className="status-bar">
        <span className={isLoading ? 'status loading' : 'status'}>{status}</span>
      </div>

      {stats.messageCount > 0 && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">Messages:</span>
            <span className="stat-value">{stats.messageCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Words:</span>
            <span className="stat-value">{stats.wordCount.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleExtractAndSummarize}
        disabled={isLoading || platform === 'Unknown'}
        className="primary-button"
      >
        {isLoading ? '⏳ Processing...' : '✨ Extract & Summarize'}
      </button>

      {platform === 'Unknown' && (
        <div className="warning">
          ⚠️ Please open a conversation on Claude, ChatGPT, Gemini, or Grok
        </div>
      )}

      {extractedMessages.length > 0 && (
        <div className="preview-section">
          <h3>Preview (first 3 messages):</h3>
          {extractedMessages.slice(0, 3).map((msg, idx) => (
            <div key={idx} className="message-preview">
              <strong>{msg.role === 'user' ? 'User:' : 'Assistant:'}</strong>
              <p>{msg.content.substring(0, 150)}...</p>
            </div>
          ))}
          
          {/* CSV Export button - shows after extraction */}
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleExportCSV} className="action-button" style={{ width: '100%' }}>
              📊 Export to CSV
            </button>
          </div>
        </div>
      )}

      {summary && (
        <div className="summary-section">
          <div className="summary-header">
            <h3>Summary</h3>
            <div className="button-group">
              <button onClick={handleCopy} className="action-button">
                📋 Copy
              </button>
              <button onClick={handleDownload} className="action-button">
                💾 Download
              </button>
            </div>
          </div>
          <div className="summary-content">
            <pre>{summary}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default App