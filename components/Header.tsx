
import React from 'react';
import { GitHubIcon } from './icons/GitHubIcon';

interface HeaderProps {
  owner: string;
  name: string;
}

export const Header: React.FC<HeaderProps> = ({ owner, name }) => {
  return (
    <header className="flex-shrink-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 p-3 flex items-center shadow-md z-10">
      <GitHubIcon className="w-8 h-8 text-white mr-3" />
      <h1 className="text-xl font-semibold text-white">
        <span className="font-light">{owner}</span> / <span className="font-bold">{name}</span>
      </h1>
    </header>
  );
};
