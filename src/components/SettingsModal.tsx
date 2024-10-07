'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from '@/contexts/SettingsContext';
import { useAccessToken } from '@/contexts/AccessTokenContext';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const { githubToken, jiraAccessToken, setGithubToken, setJiraAccessToken } = useAccessToken();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localGithubToken, setLocalGithubToken] = useState(githubToken);
  const [localJiraAccessToken, setLocalJiraAccessToken] = useState(jiraAccessToken);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalGithubToken(githubToken);
    setLocalJiraAccessToken(jiraAccessToken);
  }, [settings, githubToken, jiraAccessToken]);

  const handleSave = () => {
    updateSettings(localSettings);
    setGithubToken(localGithubToken);
    setJiraAccessToken(localJiraAccessToken);
    onClose();
  };

  const handleInputChange = (key: string, value: string) => {
    if (key === 'GITHUB_TOKEN') {
      setLocalGithubToken(value);
    } else if (key === 'JIRA_ACCESS_TOKEN') {
      setLocalJiraAccessToken(value);
    } else {
      setLocalSettings({ ...localSettings, [key]: value });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setLocalSettings({ ...localSettings, showIndividualContributions: checked });
  };

  const placeholders = {
    GITHUB_TOKEN: 'Enter your GitHub token',
    JIRA_ACCESS_TOKEN: 'Enter your Jira access token',
    JIRA_HOST: 'e.g., your-domain.atlassian.net',
    GITHUB_OWNER: 'Enter GitHub owner/organization',
    GITHUB_REPO: 'Enter GitHub repository name',
    JIRA_BOARD_ID: 'Enter Jira board ID',
  };

  const formatLabel = (key: string) => {
    return key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
          <DialogDescription>
            Configure your integration settings. Access tokens are stored in memory for security.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(localSettings).map(([key, value]) => {
            if (key === 'selectedSprints' || key === 'visibleColumns') {
              return null; // Skip these fields
            }
            if (key === 'showIndividualContributions') {
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value as boolean}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor={key} className="text-sm font-medium">
                    Show Individual Contributions
                  </Label>
                </div>
              );
            }
            return (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right text-sm font-medium">
                  {formatLabel(key)}
                </Label>
                <Input
                  id={key}
                  value={key === 'GITHUB_TOKEN' ? localGithubToken : key === 'JIRA_ACCESS_TOKEN' ? localJiraAccessToken : value as string}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="col-span-3"
                  placeholder={placeholders[key as keyof typeof placeholders]}
                  type={key.includes('TOKEN') ? 'password' : 'text'}
                />
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full sm:w-auto">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}