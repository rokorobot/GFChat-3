import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

declare global {
  interface Window {
    hljs: any;
  }
}

// Internal component for rendering markdown-like content with code highlighting
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rootRef.current && window.hljs) {
      const codeBlocks = rootRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block: HTMLElement) => {
        window.hljs.highlightElement(block);
      });
    }
  }, [content]);

  const renderContent = () => {
    if (!content && content !== '') return null;
    // Split by code blocks, keeping the delimiters
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const langMatch = part.match(/^```(\w+)?\n/);
        const language = langMatch && langMatch[1] ? langMatch[1] : 'plaintext';
        const code = part.replace(/^```\w*\n/, '').replace(/```$/, '');
        return (
          <pre key={index} className="bg-gray-900/80 rounded-md p-3 my-2 text-sm overflow-x-auto">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        );
      }
      // For non-code parts, preserve whitespace and newlines
      return part && <div key={index} className="whitespace-pre-wrap">{part}</div>;
    });
  };

  return <div ref={rootRef}>{renderContent()}</div>;
};

const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
  </svg>
);

interface ChatProps {
  fileName: string | null;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const Chat: React.FC<ChatProps> = ({ fileName, messages, onSendMessage, isLoading, error }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to shrink if text is deleted
      textareaRef.current.style.height = 'auto';
      // Set height to scroll height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading && fileName) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!fileName) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800/30 text-gray-500">
        <p>Select a file to start chatting about its content.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800/30">
      <header className="flex-shrink-0 bg-gray-900/80 p-2 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-300">Chat about <span className="font-bold text-white">{fileName}</span></h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm">
            Ask me anything about <span className="font-semibold">{fileName}</span>.
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl lg:max-w-3xl rounded-lg px-4 py-2 text-sm ${
              msg.sender === 'user' ? 'bg-blue-600/50 text-white' : 'bg-gray-700/50 text-gray-300'
            }`}>
              <MarkdownRenderer content={msg.text} />
              {isLoading && msg.sender === 'ai' && index === messages.length - 1 && (
                 <div className="flex items-center text-xs text-gray-400 mt-2">
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    <span>Thinking...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className="px-4 pb-2 flex-shrink-0"><ErrorMessage message={error} /></div>}
      <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-gray-800/50">
        <div className="flex items-end bg-gray-900 rounded-lg pr-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something about the code..."
            className="w-full bg-transparent p-2 text-gray-300 focus:outline-none resize-none overflow-y-auto"
            rows={1}
            disabled={isLoading}
            aria-label="Chat input"
            style={{maxHeight: '150px'}}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 mb-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};