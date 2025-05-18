import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconSend, IconRobot, IconUser, IconTrash, IconRefresh } from '@tabler/icons-react';
import { renderMarkdown } from '../utils/markdownHelper';

export const ChatInterface = () => {
  // UI messages (what the user sees)
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hey there! What would you like to know about me or my work?", 
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  
  // Gemini chat history (for multi-turn conversation)
  const [chatHistory, setChatHistory] = useState([]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Network URL and API Key retrieved from environment variables
  // These are accessed directly from process.env
  const NETWORK_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.NEXT_PUBLIC_NETWORK_URL || '';
  // API_KEY is no longer used with domain-based security
  // const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus the input field when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Add user message to UI
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Determine API URL based on current environment
      let apiUrl;
      
      // If we're in a browser, use relative URL which automatically adapts to the current domain
      if (typeof window !== 'undefined') {
        // Use relative URL which works in all environments
        apiUrl = '/api/chat';
      } else {
        // Server-side fallback (should rarely be needed)
        // Remove trailing slash from NETWORK_URL if it exists
        const baseUrl = NETWORK_URL ? NETWORK_URL.replace(/\/$/, '') : '';
        apiUrl = `${baseUrl}/api/chat`;
      }
      
      console.log('Sending message to API:', apiUrl);
      console.log('Chat history length:', chatHistory.length);
      
      // Format the current user message for Gemini
      const geminiUserMessage = {
        role: 'user',
        parts: [{ text: inputMessage }]
      };
      
      // Log current chat history being sent
      if (chatHistory.length > 0) {
        console.log('Chat history roles:', chatHistory.map(msg => msg.role).join(', '));
      }
      
      // Call the API endpoint with the current message and chat history
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage,
          messages: chatHistory.length > 0 ? chatHistory : [geminiUserMessage] // Use Gemini format
        }),
      });
      
      if (response.status === 403) {
        throw new Error('Access denied: Domain not authorized');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get response from API: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the chat history with the new messages from the API
      if (data.history && Array.isArray(data.history)) {
        console.log('Received updated chat history with', data.history.length, 'messages');
        setChatHistory(data.history);
      }
      
      // Small delay to simulate natural conversation
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: data.message,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          category: data.category,
          source: data.source
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: error.message.includes('Domain not authorized') ? 
            "This domain is not authorized to access the chat API." : 
            "Sorry, I encountered an error. Please try again later.",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          error: true,
          source: 'error'
        }]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const clearChat = () => {
    // Reset both the displayed messages and the chat history
    setMessages([{
      id: Date.now(),
      text: "Hey there! What would you like to know about me or my work?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
      source: 'sri_direct'
    }]);
    
    // Clear the Gemini chat history
    setChatHistory([]);
    console.log('Chat cleared - history reset');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSourceBadgeInfo = (source) => {
    switch(source) {
      case 'sri_direct':
        return {
          text: 'Sri',
          className: 'bg-emerald-500/20 text-emerald-300'
        };
      case 'sri_semantic_search':
        return {
          text: 'Sri AI',
          className: 'bg-blue-500/20 text-blue-300'
        };
      case 'sri_fallback':
        return {
          text: 'Sri (Preset)',
          className: 'bg-yellow-500/20 text-yellow-300'
        };
      case 'error':
        return {
          text: 'Error',
          className: 'bg-red-500/20 text-red-300'
        };
      default:
        return {
          text: 'Sri',
          className: 'bg-neutral-500/20 text-neutral-300'
        };
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-800/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/50 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 overflow-hidden">
            <img src="/pfp.png" alt="AI Sri Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-white font-medium flex items-center">
              AI Sri 
              <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 bg-blue-500/30 text-blue-300 rounded-md">BETA</span>
            </h2>
            <p className="text-xs text-neutral-400">Digital Version of Sri</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-400 mr-2">
            {chatHistory.length > 0 ? `${chatHistory.length} messages in history` : 'New conversation'}
          </div>
          <button 
            onClick={clearChat}
            className="p-2 hover:bg-neutral-800/80 rounded-full transition-colors"
            title="Clear chat"
          >
            <IconTrash size={18} className="text-neutral-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[75%] rounded-3xl px-4 py-3 ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-neutral-700/70 text-white rounded-tl-none'
              } ${message.error ? 'bg-red-500/70' : ''}`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                    <img src="/pfp.png" alt="AI Avatar" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  {message.sender === 'bot' ? (
                    <div 
                      className="text-sm break-words prose prose-sm prose-invert max-w-none" 
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }} 
                    />
                  ) : (
                    <p className="text-sm break-words">{message.text}</p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    {message.sender === 'bot' && message.source && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        getSourceBadgeInfo(message.source).className
                      }`}>
                        {getSourceBadgeInfo(message.source).text}
                      </span>
                    )}
                    <p className="text-[10px] text-right opacity-70 ml-auto">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                {message.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <IconUser size={14} className="text-blue-300" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-neutral-700/70 rounded-3xl rounded-tl-none px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center overflow-hidden">
                  <img src="/pfp.png" alt="AI Avatar Typing" className="w-full h-full object-cover" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 border-t border-white/10 bg-neutral-900/50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-neutral-800/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className={`p-3 rounded-xl ${
              inputMessage.trim() && !isTyping
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            } transition-colors`}
          >
            <IconSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}; 