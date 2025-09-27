
import React, { useState, useEffect, useCallback } from 'react';
import { getRepoContents } from '../services/githubService';
import type { GitHubRepoContent } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface FileTreeProps {
  owner: string;
  repo: string;
  onFileSelect: (file: GitHubRepoContent) => void;
  selectedFilePath: string | null;
  addLog: (message: string) => void;
}

interface FileTreeItemProps {
  item: GitHubRepoContent;
  owner: string;
  repo: string;
  onFileSelect: (file: GitHubRepoContent) => void;
  selectedFilePath: string | null;
  addLog: (message: string) => void;
  level: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ item, owner, repo, onFileSelect, selectedFilePath, addLog, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<GitHubRepoContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isDirectory = item.type === 'dir';

  const handleToggle = useCallback(async () => {
    if (!isDirectory) return;

    if (!isExpanded && children.length === 0) {
      setIsLoading(true);
      addLog(`Fetching content for directory: ${item.path}`);
      try {
        const contents = await getRepoContents(owner, repo, item.path, addLog);
        setChildren(contents);
        addLog(`Successfully fetched content for directory: ${item.path}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addLog(`ERROR fetching directory content for ${item.path}: ${errorMessage}`);
        // Optionally show an error message for this specific folder
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  }, [isDirectory, isExpanded, children.length, owner, repo, item.path, addLog]);

  const handleItemClick = () => {
    if (isDirectory) {
      handleToggle();
    } else {
      onFileSelect(item);
    }
  };
  
  const isSelected = selectedFilePath === item.path;

  return (
    <li className="my-0.5">
      <div
        onClick={handleItemClick}
        className={`flex items-center p-1 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-600/30 text-white' : 'hover:bg-gray-700/50'
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.25}rem` }}
      >
        {isDirectory ? (
          <>
            <ChevronRightIcon className={`w-4 h-4 mr-1.5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
            <FolderIcon className="w-5 h-5 mr-2 text-sky-400 flex-shrink-0" />
          </>
        ) : (
          <FileIcon className="w-5 h-5 mr-2 ml-[1.375rem] text-gray-400 flex-shrink-0" />
        )}
        <span className="truncate text-sm">{item.name}</span>
      </div>
      {isExpanded && (
        <ul>
          {isLoading ? (
            <li className="flex items-center py-1" style={{ paddingLeft: `${(level + 1) * 1.5 + 0.25}rem` }}>
              <LoadingSpinner className="w-4 h-4" />
              <span className="ml-2 text-xs text-gray-500">Loading...</span>
            </li>
          ) : (
            children.map(child => (
              <FileTreeItem
                key={child.sha}
                item={child}
                owner={owner}
                repo={repo}
                onFileSelect={onFileSelect}
                selectedFilePath={selectedFilePath}
                addLog={addLog}
                level={level + 1}
              />
            ))
          )}
        </ul>
      )}
    </li>
  );
};


export const FileTree: React.FC<FileTreeProps> = ({ owner, repo, onFileSelect, selectedFilePath, addLog }) => {
  const [tree, setTree] = useState<GitHubRepoContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRootContents = async () => {
      setIsLoading(true);
      setError(null);
      addLog('Fetching root directory content...');
      try {
        const contents = await getRepoContents(owner, repo, '', addLog);
        setTree(contents);
        addLog('Successfully fetched root directory content.');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Failed to load repository structure.');
        addLog(`ERROR fetching root content: ${errorMessage}`);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRootContents();
  }, [owner, repo, addLog]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
        <span className="ml-2 text-gray-400">Loading tree...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-400">{error}</div>;
  }

  return (
    <div className="p-2">
      <ul>
        {tree.map(item => (
          <FileTreeItem
            key={item.sha}
            item={item}
            owner={owner}
            repo={repo}
            onFileSelect={onFileSelect}
            selectedFilePath={selectedFilePath}
            addLog={addLog}
            level={0}
          />
        ))}
      </ul>
    </div>
  );
};
