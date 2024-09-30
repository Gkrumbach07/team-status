'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import SprintSelector from './SprintSelector'
import TeamMetricsTable from './TeamMetricsTable'
import SprintSummary from './SprintSummary'
import { EnvVars, SettingsModal } from './SettingsModal'
import { SelectedSprintChips } from './SelectedSprintChips'
import { Metrics, SprintSummary as SprintSummaryType } from '@/types/metrics'
import { Settings } from 'lucide-react'
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/localStorage'

interface Sprint {
  value: string;
  label: string;
}

const defaultVisibleColumns = [
  'pointsCompleted', 'jirasCompleted', 'avgTimeToMergePR', 'reviewsGiven',
  'qaValidations', 'avgReviewComments', 'avgTimeInProgress', 'reviewCommentsGiven', 'avgTimeToQAContact',
  'bugCount', 'storyCount', 'taskCount', 'subTaskCount'
];

export default function SprintMetrics() {
  const [selectedSprints, setSelectedSprints] = useState<Sprint[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showIndividualContributions, setShowIndividualContributions] = useState(true)
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false);
  const [envVars, setEnvVars] = useState<Partial<EnvVars>>({});
  const [initialEnvVars, setInitialEnvVars] = useState<Partial<EnvVars>>({});

  useEffect(() => {
    const fetchInitialEnvVars = async () => {
      try {
        const response = await fetch('/api/getEnvVars');
        if (response.ok) {
          const envVars = await response.json();
          setInitialEnvVars(envVars);
        }
      } catch (error) {
        console.error('Error fetching initial env vars:', error);
      }
    };

    fetchInitialEnvVars();
  }, []);

  useEffect(() => {
    const loadedSprints = loadFromLocalStorage('selectedSprints', []) as Sprint[];
    const loadedColumns = loadFromLocalStorage('visibleColumns', defaultVisibleColumns) as string[];
    const loadedShowIndividual = loadFromLocalStorage('showIndividualContributions', true) as boolean;
    const loadedEnvVars = loadFromLocalStorage('envVars', {}) as Partial<EnvVars>;

    setSelectedSprints(loadedSprints);
    setVisibleColumns(loadedColumns);
    setShowIndividualContributions(loadedShowIndividual);
    setEnvVars({ ...initialEnvVars, ...loadedEnvVars });
    setLoadedFromLocalStorage(true);
  }, [initialEnvVars])

  useEffect(() => {
    if (loadedFromLocalStorage) {
      console.log('Saving selectedSprints to localStorage:', selectedSprints);
      saveToLocalStorage('selectedSprints', selectedSprints)
    }
  }, [loadedFromLocalStorage, selectedSprints])

  useEffect(() => {
    if (loadedFromLocalStorage) {
      saveToLocalStorage('visibleColumns', visibleColumns)
    }
  }, [loadedFromLocalStorage, visibleColumns])

  useEffect(() => {
    if (loadedFromLocalStorage) {
      saveToLocalStorage('showIndividualContributions', showIndividualContributions)
    }
  }, [loadedFromLocalStorage, showIndividualContributions])

  const handleFetchMetrics = async () => {
    if (selectedSprints.length === 0) {
      setError('Please select at least one sprint')
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setStatus('Fetching metrics...')

    try {
      const response = await fetch('/api/fetchMetrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sprints: selectedSprints.map(sprint => sprint.value),
          envVars // Pass the environment variables to the API
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
      console.error('Error fetching metrics:', error)
      setError('Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSprint = (sprintValue: string) => {
    setSelectedSprints(prevSprints => prevSprints.filter(s => s.value !== sprintValue));
  }

  const handleSelectSprints = (sprints: Sprint[]) => {
    console.log('Selecting sprints:', sprints);
    setSelectedSprints(sprints);
  }

  const calculateSummary = (metrics: Metrics): SprintSummaryType => {
    const totalPointsCompleted = metrics.pointsCompleted.reduce((sum, point) => sum + (point.value || 0), 0);
    const totalJirasCompleted = metrics.jirasCompleted.length;
    const avgTimeToMergePR = metrics.timeToMergePR.length > 0
      ? metrics.timeToMergePR.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToMergePR.length
      : 0;
    const totalReviews = metrics.reviewsGiven.length;
    const totalQAValidations = metrics.qaValidations.length;
    const avgReviewComments = metrics.reviewComments.length > 0
      ? metrics.reviewComments.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.reviewComments.length
      : 0;
    const avgTimeInProgress = metrics.timeInProgress.length > 0
      ? metrics.timeInProgress.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeInProgress.length
      : 0;
    const totalReviewCommentsGiven = metrics.reviewCommentsGiven.reduce((sum, point) => sum + (point.value || 0), 0);
    const avgTimeToQAContact = metrics.timeToQAContact.length > 0
      ? metrics.timeToQAContact.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToQAContact.length
      : 0;

    return {
      pointsCompleted: totalPointsCompleted,
      jirasCompleted: totalJirasCompleted,
      avgTimeToMergePR,
      reviewsGiven: totalReviews,
      qaValidations: totalQAValidations,
      avgReviewComments,
      avgTimeInProgress,
      reviewCommentsGiven: totalReviewCommentsGiven,
      avgTimeToQAContact,
      bugCount: metrics.bugCount.length,
      storyCount: metrics.storyCount.length,
      taskCount: metrics.taskCount.length,
      subTaskCount: metrics.subTaskCount.length,
    };
  }

  const handleColumnToggle = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    )
  }

  return (
    <div className="space-y-4 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <SprintSelector onSelect={handleSelectSprints} selectedSprints={selectedSprints} />
          <Button 
            onClick={handleFetchMetrics} 
            disabled={loading || selectedSprints.length === 0}
          >
            {loading ? 'Fetching...' : 'Fetch Metrics'}
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <SelectedSprintChips 
        selectedSprints={selectedSprints} 
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
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
          <div className="mt-4">
            <TeamMetricsTable 
              metrics={metrics} 
              visibleColumns={visibleColumns} 
              showIndividualContributions={showIndividualContributions}
            />
          </div>
        </div>
      )}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showIndividualContributions={showIndividualContributions}
        onToggleIndividualContributions={() => setShowIndividualContributions((prev) => !prev)}
        initialEnvVars={initialEnvVars}
      />
    </div>
  )
}