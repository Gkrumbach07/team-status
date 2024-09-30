'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SettingsModal } from './SettingsModal';

export function InitialSetup() {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
		<SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <h1 className="text-3xl font-bold mb-4">Welcome to Sprint Metrics Dashboard</h1>
      <p className="text-lg mb-8">Please configure your settings to get started.</p>
      <Button onClick={() => setIsSettingsOpen(true)} size="lg">
        Set Up Settings
      </Button>
    </div>
  );
}