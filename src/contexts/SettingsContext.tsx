'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadFromLocalStorage, saveToLocalStorage } from '@/utils/localStorage';

interface Sprint {
  value: string;
  label: string;
}

interface Settings {
  GITHUB_TOKEN: string;
  JIRA_ACCESS_TOKEN: string;
  JIRA_HOST: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  JIRA_BOARD_ID: string;
  showIndividualContributions: boolean;
  selectedSprints: Sprint[];
  visibleColumns: string[];
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultVisibleColumns = [
  'pointsCompleted', 'jirasCompleted', 'avgTimeToMergePR', 'reviewsGiven',
  'qaValidations', 'avgReviewComments', 'avgTimeInProgress', 'reviewCommentsGiven', 'avgTimeToQAContact',
  'bugCount', 'storyCount', 'taskCount', 'subTaskCount'
];

const defaultSettings: Settings = {
  GITHUB_TOKEN: '',
  JIRA_ACCESS_TOKEN: '',
  JIRA_HOST: '',
  GITHUB_OWNER: '',
  GITHUB_REPO: '',
  JIRA_BOARD_ID: '',
  showIndividualContributions: true,
  selectedSprints: [],
  visibleColumns: defaultVisibleColumns,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedSettings = loadFromLocalStorage('settings', defaultSettings);
    setSettings(loadedSettings);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveToLocalStorage('settings', settings);
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}