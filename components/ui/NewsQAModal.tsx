'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, MessageSquare } from 'lucide-react';
import type { CategoryNews } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NewsQAModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: CategoryNews;
  weekOf: string;
}

const CATEGORY_LABELS = {
  tech: 'San Francisco Technology',
  politics: 'San Francisco Politics',
  economy: 'San Francisco Economy',
  'sf-local': 'San Francisco Local News',
};

/**
 * NewsQAModal Component
 * 
 * AI-powered Q&A interface for exploring news articles in depth
 */
export default function NewsQAModal({ isOpen, onClose, news, weekOf }: NewsQAModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryLabel = CATEGORY_LABELS[news.category];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setIsMinimized(false);
      // Initialize with welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm here to help you explore ${categoryLabel} news from the week of ${weekOf}. 

I can help you understand:
• The main developments and their implications
• Connections between different stories
• How these events impact San Francisco residents
• Background and context you might have missed

What would you like to know?`
        }
      ]);
    }
  }, [isOpen, categoryLabel, weekOf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/news-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          news,
          weekOf,
          conversationHistory: messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('News QA error:', error);
      const errorMessage = error instanceof Error && error.name === 'AbortError'
        ? 'The request timed out. Please try a shorter question or try again later.'
        : 'Sorry, I encountered an error processing your question. Please try again.';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const categoryColors = {
    tech: 'border-blue-500 bg-blue-50',
    politics: 'border-purple-500 bg-purple-50',
    economy: 'border-green-500 bg-green-50',
    'sf-local': 'border-orange-500 bg-orange-50',
  };

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-auto">
      <div className={`bg-white border-2 ${categoryColors[news.category]} shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-14 ml-auto' : 'w-full h-screen sm:w-96 sm:h-[600px]'
      } flex flex-col`}>
        {/* Header */}
        <div 
          className={`border-b-2 ${categoryColors[news.category]} px-4 py-3 flex items-center justify-between cursor-pointer`}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-mono font-bold truncate">Ask About {categoryLabel}</h3>
              {!isMinimized && (
                <p className="text-xs font-mono text-gray-600 truncate mt-0.5">
                  Week of {weekOf}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="hover:bg-white/50 p-1 transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="hover:bg-white/50 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Facts */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-300">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-700">
                <span className="font-bold">{news.sources.length} sources</span>
                <span>•</span>
                <span className="font-bold">{news.keywords.length} keywords</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 font-mono text-xs leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-black text-white border-2 border-black'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 border border-gray-300 px-3 py-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                      </div>
                      <span className="text-gray-600">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <p className="text-xs font-mono font-bold text-gray-600 mb-2">Try asking:</p>
                <div className="space-y-1">
                  {[
                    'What are the key developments this week?',
                    'How does this impact SF residents?',
                    'What should I watch for next?',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInputValue(suggestion)}
                      className="block w-full text-left text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      → {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t-2 border-gray-300 p-3 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about this news..."
                  className="flex-1 px-3 py-2 border border-gray-300 font-mono text-base sm:text-xs focus:outline-none focus:border-black"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-black text-white font-mono text-xs font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

