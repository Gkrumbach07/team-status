'use client'

import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Sprint {
  value: string;
  label: string;
}

interface SelectedSprintChipsProps {
  selectedSprints: Sprint[];
  onRemove: (sprintValue: string) => void;
}

export function SelectedSprintChips({ selectedSprints, onRemove }: SelectedSprintChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {selectedSprints.map((sprint) => (
        <div key={sprint.value} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
          {sprint.label}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-4 w-4 p-0"
            onClick={() => onRemove(sprint.value)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}