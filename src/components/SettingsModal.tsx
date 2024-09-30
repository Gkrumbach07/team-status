import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/localStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showIndividualContributions: boolean;
  onToggleIndividualContributions: () => void;
  initialEnvVars: Partial<EnvVars>;
}

export interface EnvVars {
  GITHUB_TOKEN: string;
  JIRA_ACCESS_TOKEN: string;
  JIRA_HOST: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  JIRA_BOARD_ID: string;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  showIndividualContributions, 
  onToggleIndividualContributions,
  initialEnvVars
}: SettingsModalProps) {
  const [envVars, setEnvVars] = useState<EnvVars>({
    GITHUB_TOKEN: '',
    JIRA_ACCESS_TOKEN: '',
    JIRA_HOST: '',
    GITHUB_OWNER: '',
    GITHUB_REPO: '',
    JIRA_BOARD_ID: '',
  });

  useEffect(() => {
    const loadedEnvVars = loadFromLocalStorage('envVars', {}) as Partial<EnvVars>;
    const mergedEnvVars = { ...initialEnvVars, ...loadedEnvVars };
    setEnvVars(prevEnvVars => ({ ...prevEnvVars, ...mergedEnvVars }));
  }, [initialEnvVars]);

  const handleEnvVarChange = (key: keyof EnvVars, value: string) => {
    setEnvVars(prevEnvVars => ({ ...prevEnvVars, [key]: value }));
  };

  const handleSaveEnvVars = () => {
    saveToLocalStorage('envVars', envVars);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your view of the metrics dashboard and configure environment variables.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-individual" 
              checked={showIndividualContributions} 
              onCheckedChange={onToggleIndividualContributions}
            />
            <Label htmlFor="show-individual">Show individual contributions in table</Label>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Environment Variables</h3>
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{key}</Label>
                <Input
                  id={key}
                  type={key.includes('TOKEN') ? 'password' : 'text'}
                  value={value}
                  onChange={(e) => handleEnvVarChange(key as keyof EnvVars, e.target.value)}
                />
              </div>
            ))}
          </div>
          <Button onClick={handleSaveEnvVars}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}