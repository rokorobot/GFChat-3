import React, { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

// Make hljs available on the window object from the CDN script
declare global {
  interface Window {
    hljs: any;
  }
}

interface CodeViewerProps {
  fileName: string | null;
  content: string | null;
  isLoading: boolean;
}

const getLanguage = (filename: string | null): string => {
  if (!filename) return 'plaintext';
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'html':
      return 'xml'; // Use xml for html highlighting
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'sh':
      return 'shell';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'plaintext';
  }
};


export const CodeViewer: React.FC<CodeViewerProps> = ({ fileName, content, isLoading }) => {
  const codeRef = useRef<HTMLElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current && content && !isLoading && window.hljs) {
      codeRef.current.textContent = content;
      const language = getLanguage(fileName);
      codeRef.current.className = `language-${language}`;
      window.hljs.highlightElement(codeRef.current);
    }
  }, [content, fileName, isLoading]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <p className="text-lg">Select a file to view its content</p>
    </div>
  );

  return (
    <div className="flex-1 bg-[#282c34] flex flex-col overflow-hidden">
      {fileName && (
        <div className="flex-shrink-0 bg-gray-800/50 px-4 py-2 border-b border-gray-700/50 text-sm text-gray-300">
          {fileName}
        </div>
      )}
      <div className="flex-1 relative overflow-auto p-4">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <LoadingSpinner />
          </div>
        ) : content !== null ? (
          <>
            <button
              onClick={handleCopy}
              className="absolute top-6 right-6 z-10 flex items-center px-2 py-1 bg-gray-600/50 text-gray-300 rounded-md text-xs hover:bg-gray-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label={isCopied ? 'Copied code' : 'Copy code'}
            >
              {isCopied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1 text-green-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-1" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <pre className="text-sm !bg-[#282c34]">
              <code ref={codeRef} />
            </pre>
          </>
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};