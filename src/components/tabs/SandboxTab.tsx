import React, { useState } from 'react'
import { Send, Bot, User, Wrench, CheckCircle, RefreshCw, Trash2, ArrowRight } from 'lucide-react'
import { SandboxMessage } from '../../types'

interface SandboxTabProps {
  endpoint: string
  apiKey: string
  model: string
  isConnected: boolean
}

export const SandboxTab: React.FC<SandboxTabProps> = ({
  endpoint,
  apiKey,
  model,
  isConnected
}) => {
  const [messages, setMessages] = useState<SandboxMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am connected with built-in tools (Weather, Calculator, Web Search, PDF Reader, Image OCR, Email, Database). Try asking me something like:\n• "What is the weather in Tokyo right now?"\n• "Calculate (450 * 12) / 3"\n• "Extract text from document.pdf for pages 1-3"\n• "Perform OCR text extraction on image.png"\n• "Search the latest news about AI Agents"'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputText.trim() || !model || isLoading) return
    const userMsg: SandboxMessage = { role: 'user', content: inputText.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputText('')
    setIsLoading(true)

    try {
      if (window.electronAPI?.sandboxChat) {
        // Step 1: Send to model with available tools
        const completion = await window.electronAPI.sandboxChat({
          endpoint,
          apiKey,
          model,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
            name: m.name,
            tool_call_id: m.tool_call_id,
            tool_calls: m.tool_calls
          }))
        })

        // Check if model emitted tool calls
        if (completion.toolCalls && completion.toolCalls.length > 0) {
          const assistantToolMsg: SandboxMessage = {
            role: 'assistant',
            content: completion.fullText || '',
            tool_calls: completion.toolCalls
          }
          
          let currentChat = [...updatedMessages, assistantToolMsg]
          setMessages(currentChat)

          // Step 2: Execute mock tools and generate tool outputs
          for (const tc of completion.toolCalls) {
            let parsedArgs = {}
            try {
              parsedArgs = JSON.parse(tc.function.arguments)
            } catch {
              parsedArgs = { _raw: tc.function.arguments }
            }

            const toolExec = await window.electronAPI.executeMockTool(tc.function.name, parsedArgs)
            const toolMsg: SandboxMessage = {
              role: 'tool',
              tool_call_id: tc.id,
              name: tc.function.name,
              content: JSON.stringify(toolExec.result)
            }
            currentChat = [...currentChat, toolMsg]
          }
          setMessages(currentChat)

          // Step 3: Second turn — send tool outputs back to model to get final answer
          const finalTurn = await window.electronAPI.sandboxChat({
            endpoint,
            apiKey,
            model,
            messages: currentChat.map(m => ({
              role: m.role,
              content: m.content,
              name: m.name,
              tool_call_id: m.tool_call_id,
              tool_calls: m.tool_calls
            }))
          })

          if (finalTurn.fullText) {
            setMessages([...currentChat, { role: 'assistant', content: finalTurn.fullText }])
          }
        } else {
          // Normal text response without tools
          setMessages([...updatedMessages, { role: 'assistant', content: completion.fullText || '(Empty response)' }])
        }
      }
    } catch (err: any) {
      setMessages([...updatedMessages, { role: 'assistant', content: `⚠️ Error: ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation reset. Ask a question to test tool execution.'
      }
    ])
  }

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto h-[calc(100vh-130px)] flex flex-col">
      {/* Header */}
      <div className="bg-surface p-4 rounded-xl border border-surface-light flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent-cyan" /> Interactive Mock Tool Execution Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Tests full multi-turn execution loop (Prompt → Tool Call → Mock Execution → Final Response).
          </p>
        </div>
        <button
          onClick={handleClearChat}
          className="p-2 bg-surface-light hover:bg-surface-lighter rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-surface rounded-xl border border-surface-light p-4 overflow-y-auto space-y-4 font-mono text-xs">
        {messages.map((m, idx) => {
          if (m.role === 'user') {
            return (
              <div key={idx} className="flex items-start justify-end space-x-2">
                <div className="bg-primary-600/90 text-white rounded-xl px-4 py-2.5 max-w-xl whitespace-pre-wrap shadow-md">
                  {m.content}
                </div>
                <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            )
          }

          if (m.role === 'tool') {
            return (
              <div key={idx} className="flex items-start space-x-2 max-w-xl mx-auto">
                <div className="w-full bg-surface-light border border-accent-emerald/30 rounded-lg p-3 text-slate-300">
                  <div className="flex items-center space-x-1.5 text-accent-emerald font-bold mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Mock Tool Executed: [{m.name}]</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap bg-background p-2 rounded">
                    {m.content}
                  </div>
                </div>
              </div>
            )
          }

          if (m.tool_calls && m.tool_calls.length > 0) {
            return (
              <div key={idx} className="flex items-start space-x-2">
                <div className="w-7 h-7 rounded-lg bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 text-accent-cyan" />
                </div>
                <div className="bg-surface-light/80 border border-surface-lighter rounded-xl p-3 max-w-xl space-y-2">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    Model Requested Tool Calling:
                  </div>
                  {m.tool_calls.map((tc, tcIdx) => (
                    <div key={tcIdx} className="bg-background p-2 rounded border border-surface-light font-mono text-[11px]">
                      <span className="text-accent-cyan font-bold">{tc.function.name}</span>
                      <span className="text-slate-400">({tc.function.arguments})</span>
                    </div>
                  ))}
                  {m.content && <p className="text-slate-300 mt-1">{m.content}</p>}
                </div>
              </div>
            )
          }

          return (
            <div key={idx} className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-lg bg-accent-emerald/20 border border-accent-emerald/40 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-accent-emerald" />
              </div>
              <div className="bg-surface-light rounded-xl px-4 py-2.5 max-w-xl whitespace-pre-wrap text-slate-200 shadow-md">
                {m.content}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-cyan" />
            <span>Agent is thinking and processing tool requests...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center space-x-2 bg-surface p-2 rounded-xl border border-surface-light flex-shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question requiring tools (e.g. 'What is the weather in Tokyo right now?')..."
          disabled={isLoading || !model}
          className="flex-1 bg-transparent px-3 py-2 text-xs font-mono text-slate-200 outline-none placeholder:text-slate-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim() || !model}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-primary-600/20"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
