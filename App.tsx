import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Header } from './components/Header';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { ErrorMessage } from './components/ErrorMessage';
import { Chat } from './components/Chat';
import { getFileContent } from './services/githubService';
import type { GitHubRepoContent, ChatMessage } from './types';

const REPO_OWNER = 'rokorobot';
const REPO_NAME = 'gfchat-mock-play';

// This will be provided by the environment
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please set it in your environment.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default function App(): React.ReactElement {
  const [selectedFile, setSelectedFile] = useState<GitHubRepoContent | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiReplying, setIsAiReplying] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Resizable panel state
  const [chatPanelHeight, setChatPanelHeight] = useState(300);
  const mainPanelRef = useRef<HTMLElement>(null);


  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prevLogs => [logMessage, ...prevLogs.slice(0, 99)]);
    // Also log to console for easier debugging
    if (message.startsWith('ERROR')) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }, []);

  const handleFileSelect = useCallback(async (file: GitHubRepoContent) => {
    if (file.type !== 'file' || !file.download_url) {
      addLog(`Ignoring selection of non-file item: ${file.name}`);
      return;
    }
    
    addLog(`File selected: ${file.path}`);
    setSelectedFile(file);
    setIsLoadingContent(true);
    setFileContent(null);
    setContentError(null);
    setChatMessages([]);
    setChatError(null);

    try {
      addLog(`Fetching content for ${file.name} from ${file.download_url}`);
      const content = await getFileContent(file.download_url);
      setFileContent(content);
      addLog(`Successfully fetched content for ${file.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch file content:', error);
      setContentError('Failed to load file content. Please try again.');
      addLog(`ERROR fetching content for ${file.name}: ${errorMessage}`);
    } finally {
      setIsLoadingContent(false);
    }
  }, [addLog]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedFile || !fileContent) return;

    const userMessage: ChatMessage = { sender: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsAiReplying(true);
    setChatError(null);

    try {
      const systemInstruction = "You are an expert software engineer and code assistant. Your goal is to help the user understand and improve the code. Answer their questions clearly and concisely. When providing code examples, use markdown code blocks with language identifiers.";
      const userPrompt = `I have a question about the file named "${selectedFile.name}". Here is its content:\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nMy question is: ${message}`;
      
      const stream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
              systemInstruction: systemInstruction,
          }
      });
      
      let fullResponse = "";
      setChatMessages(prev => [...prev, { sender: 'ai', text: "" }]);

      for await (const chunk of stream) {
          fullResponse += chunk.text;
          setChatMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { sender: 'ai', text: fullResponse };
              return newMessages;
          });
      }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setChatError(`Failed to get response from AI. ${errorMessage}`);
        addLog(`ERROR getting AI response: ${errorMessage}`);
        // Remove the empty AI message placeholder on error
        setChatMessages(prev => prev.filter(msg => msg.text !== "" || msg.sender !== 'ai'));
    } finally {
        setIsAiReplying(false);
    }
}, [selectedFile, fileContent, addLog]);

  const handleDrag = useCallback((e: MouseEvent) => {
    if (mainPanelRef.current) {
        const { bottom } = mainPanelRef.current.getBoundingClientRect();
        const newHeight = bottom - e.clientY;
        
        const maxHeight = mainPanelRef.current.offsetHeight - 200; // Leave 200px for code viewer
        const minHeight = 150;

        if (newHeight > minHeight && newHeight < maxHeight) {
            setChatPanelHeight(newHeight);
        }
    }
  }, []);

  const stopDrag = useCallback(() => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
  }, [handleDrag]);

  const startDrag = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
  }, [handleDrag, stopDrag]);


  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-300 font-sans flex flex-col overflow-hidden">
      <Header owner={REPO_OWNER} name={REPO_NAME} />
      <div className="flex flex-grow overflow-hidden">
        <aside className="w-1/3 max-w-sm min-w-[250px] bg-gray-800/50 border-r border-gray-700/50 overflow-y-auto">
          <FileTree
            owner={REPO_OWNER}
            repo={REPO_NAME}
            onFileSelect={handleFileSelect}
            selectedFilePath={selectedFile?.path ?? null}
            addLog={addLog}
          />
        </aside>
        <main ref={mainPanelRef} className="flex-1 flex flex-col overflow-hidden">
          {contentError && (
            <div className="p-4 flex-shrink-0">
              <ErrorMessage message={contentError} />
            </div>
          )}
          <div className="flex-1 overflow-hidden min-h-0">
            <CodeViewer
              fileName={selectedFile?.name ?? null}
              content={fileContent}
              isLoading={isLoadingContent}
            />
          </div>
          <div
            onMouseDown={startDrag}
            className="flex-shrink-0 h-2 bg-gray-700/50 cursor-row-resize hover:bg-blue-600 transition-colors duration-200"
            aria-label="Resize chat panel"
            role="separator"
          />
          <div style={{ height: `${chatPanelHeight}px` }} className="flex-shrink-0 bg-gray-800/30">
             <Chat
              fileName={selectedFile?.name ?? null}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isAiReplying}
              error={chatError}
            />
          </div>
        </main>
      </div>
    </div>
  );
}