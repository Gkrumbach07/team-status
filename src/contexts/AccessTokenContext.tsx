import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AccessTokenContextType {
  githubToken: string;
  jiraAccessToken: string;
  setGithubToken: (token: string) => void;
  setJiraAccessToken: (token: string) => void;
}

const AccessTokenContext = createContext<AccessTokenContextType | undefined>(undefined);

interface AccessTokenProviderProps {
  children: ReactNode;
}

export const AccessTokenProvider: React.FC<AccessTokenProviderProps> = ({ children }) => {
  const [githubToken, setGithubToken] = useState<string>('');
  const [jiraAccessToken, setJiraAccessToken] = useState<string>('');

  return (
    <AccessTokenContext.Provider value={{ githubToken, jiraAccessToken, setGithubToken, setJiraAccessToken }}>
      {children}
    </AccessTokenContext.Provider>
  );
};

export const useAccessToken = () => {
  const context = useContext(AccessTokenContext);
  if (context === undefined) {
    throw new Error('useAccessToken must be used within an AccessTokenProvider');
  }
  return context;
};