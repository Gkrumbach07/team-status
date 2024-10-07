'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import SprintSelector from './SprintSelector'
import TeamMetricsTable from './TeamMetricsTable'
import SprintSummary from './SprintSummary'
import { SettingsModal } from './SettingsModal'
import { SelectedSprintChips } from './SelectedSprintChips'
import { Metrics, SprintSummary as SprintSummaryType } from '@/types/metrics'
import { Settings as SettingsIcon } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext';
import { InitialSetup } from './InitialSetup'
import { useAuthHeaders } from '@/utils/authHeaders'

interface Sprint {
  value: string;
  label: string;
}

export default function SprintMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const { settings, updateSettings } = useSettings()

  const authHeaders = useAuthHeaders();
  const areSettingsConfigured = () => {
    return !!(
      settings.GITHUB_TOKEN &&
      settings.JIRA_ACCESS_TOKEN &&
      settings.JIRA_HOST &&
      settings.GITHUB_OWNER &&
      settings.GITHUB_REPO &&
      settings.JIRA_BOARD_ID
    );
  };

  const fetchMetricsData = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatus('Fetching metrics...');

    try {
      const response = await fetch('/api/fetchMetrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          sprints: settings.selectedSprints.map(sprint => sprint.value),
          settings: settings,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const update = JSON.parse(line);
              if (update.status) setStatus(update.status);
              if (update.progress !== undefined) setProgress(update.progress);
              if (update.metrics) setMetrics(update.metrics);
            } catch (error) {
              console.error('Error parsing line:', line, error);
            }
          }
        }
      }

      if (buffer) {
        try {
          const update = JSON.parse(buffer);
          if (update.status) setStatus(update.status);
          if (update.progress !== undefined) setProgress(update.progress);
          if (update.metrics) setMetrics(update.metrics);
        } catch (error) {
          console.error('Error parsing final buffer:', buffer, error);
        }
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSprint = (sprintValue: string) => {
    updateSettings({
      selectedSprints: settings.selectedSprints.filter(sprint => sprint.value !== sprintValue)
    });
  }

  const handleSelectSprints = (sprints: Sprint[]) => {
    updateSettings({ selectedSprints: sprints });
  }

  const handleColumnToggle = (column: string) => {
    updateSettings({
      visibleColumns: settings.visibleColumns.includes(column)
        ? settings.visibleColumns.filter(col => col !== column)
        : [...settings.visibleColumns, column]
    });
  }

  const calculateSummary = (metrics: Metrics): SprintSummaryType => {
    const totalPointsCompleted = metrics.pointsCompleted.reduce((sum, point) => sum + (point.value || 0), 0);
    const totalJirasCompleted = metrics.jirasCompleted.length;
    const avgTimeToMergePR = metrics.timeToMergePR.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToMergePR.length;
    const totalReviewsGiven = metrics.reviewsGiven.length;
    const totalQAValidations = metrics.qaValidations.length;
    const avgReviewComments = metrics.reviewComments.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.reviewComments.length;
    const avgTimeInProgress = metrics.timeInProgress.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeInProgress.length;
    const totalReviewCommentsGiven = metrics.reviewCommentsGiven.reduce((sum, point) => sum + (point.value || 0), 0);
    const avgTimeToQAContact = metrics.timeToQAContact.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToQAContact.length;
    const totalBugCount = metrics.bugCount.length;
    const totalStoryCount = metrics.storyCount.length;
    const totalTaskCount = metrics.taskCount.length;
    const totalSubTaskCount = metrics.subTaskCount.length;

    return {
      pointsCompleted: totalPointsCompleted,
      jirasCompleted: totalJirasCompleted,
      avgTimeToMergePR,
      reviewsGiven: totalReviewsGiven,
      qaValidations: totalQAValidations,
      avgReviewComments,
      avgTimeInProgress,
      reviewCommentsGiven: totalReviewCommentsGiven,
      avgTimeToQAContact,
      bugCount: totalBugCount,
      storyCount: totalStoryCount,
      taskCount: totalTaskCount,
      subTaskCount: totalSubTaskCount,
    };
  };

  if (!areSettingsConfigured()) {
    return <InitialSetup />;
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <SprintSelector onSelect={handleSelectSprints} selectedSprints={settings.selectedSprints} />
          <Button 
            onClick={fetchMetricsData} 
            disabled={loading || settings.selectedSprints.length === 0}
          >
            {loading ? 'Fetching...' : 'Fetch Metrics'}
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </div>
      <SelectedSprintChips 
        selectedSprints={settings.selectedSprints} 
        onRemove={handleRemoveSprint}
      />
      {loading && (
        <div className="flex flex-col items-center mt-4">
          <div className="w-full max-w-md">
            <Progress value={progress} className="w-full" />
          </div>
          <p className="text-center mt-2">{status}</p>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {metrics && (
        <div className="space-y-4">
          <SprintSummary 
            summary={calculateSummary(metrics)} 
            visibleColumns={settings.visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
          <div className="mt-4">
            <TeamMetricsTable 
              metrics={metrics} 
              visibleColumns={settings.visibleColumns} 
              showIndividualContributions={settings.showIndividualContributions}
            />
          </div>
        </div>
      )}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}