import React from 'react';
import { SprintSummary as SprintSummaryType } from '@/types/metrics'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SprintSummaryProps {
  summary: SprintSummaryType;
  visibleColumns: string[];
  onColumnToggle: (column: string) => void;
}

export default function SprintSummary({ summary, visibleColumns, onColumnToggle }: SprintSummaryProps) {
  const columns = [
    { key: 'pointsCompleted', label: 'Points Completed' },
    { key: 'jirasCompleted', label: 'Jiras Completed' },
    { key: 'avgTimeToMergePR', label: 'Avg Time to Merge PR' },
    { key: 'reviewsGiven', label: 'Reviews Given' },
    { key: 'qaValidations', label: 'QA Validations' },
    { key: 'avgReviewComments', label: 'Avg Review Comments' },
    { key: 'avgTimeInProgress', label: 'Avg Time in Progress' },
    { key: 'reviewCommentsGiven', label: 'Review Comments Given' },
    { key: 'avgTimeToQAContact', label: 'Avg Time to QA Contact' },
    { key: 'bugCount', label: 'Bug Count' },
    { key: 'storyCount', label: 'Story Count' },
    { key: 'taskCount', label: 'Task Count' },
    { key: 'subTaskCount', label: 'Sub-task Count' },
  ];

  const formatValue = (key: keyof SprintSummaryType, value: number | undefined): string => {
    if (value === undefined) return '0';
    if (key.startsWith('avg')) {
      return value.toFixed(2);
    }
    return value.toString();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sprint Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {columns.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={visibleColumns.includes(key)}
              onCheckedChange={() => onColumnToggle(key)}
            />
            <Label htmlFor={key}>
              {label}: {formatValue(key as keyof SprintSummaryType, summary[key as keyof SprintSummaryType])}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}