import React, { useState, useMemo } from 'react';
import { Metrics, MetricDataPoint } from '@/types/metrics';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, ChevronDown, ChevronRight, Download } from "lucide-react";
import DetailedMetricsView from '@/components/DetailedMetricsView';
import { cn } from "@/lib/utils";

interface TeamMetricsTableProps {
  metrics: Metrics;
  visibleColumns: string[];
  showIndividualContributions: boolean;
}

type SortKey = keyof Omit<TeamMemberMetrics, 'name'>;

interface TeamMemberMetrics {
  name: string;
  pointsCompleted: number;
  jirasCompleted: number;
  avgTimeToMergePR: number;
  reviewsGiven: number;
  qaValidations: number;
  avgReviewComments: number;
  avgTimeInProgress: number;
  reviewCommentsGiven: number;
  avgTimeToQAContact: number;
  bugCount: number;
  storyCount: number;
  taskCount: number;
  subTaskCount: number;
}

const metricKeyMapping: Record<keyof Omit<TeamMemberMetrics, 'name'>, keyof Metrics> = {
  pointsCompleted: 'pointsCompleted',
  jirasCompleted: 'jirasCompleted',
  avgTimeToMergePR: 'timeToMergePR',
  reviewsGiven: 'reviewsGiven',
  qaValidations: 'qaValidations',
  avgReviewComments: 'reviewComments',
  avgTimeInProgress: 'timeInProgress',
  reviewCommentsGiven: 'reviewCommentsGiven',
  avgTimeToQAContact: 'timeToQAContact',
  bugCount: 'bugCount',
  storyCount: 'storyCount',
  taskCount: 'taskCount',
  subTaskCount: 'subTaskCount',
};

export default function TeamMetricsTable({ metrics, visibleColumns, showIndividualContributions }: TeamMetricsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('pointsCompleted');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<{ member: string, metric: keyof Metrics, issueType?: string } | null>(null);

  const calculateMetrics = (teamMember: string): TeamMemberMetrics => {
    const calculateMetric = (metricArray: MetricDataPoint[], defaultValue: number = 0) => {
      const teamMemberMetrics = metricArray.filter(m => m.teamMember === teamMember);
      if (teamMemberMetrics.length === 0) return defaultValue;
      if (teamMemberMetrics[0].value === undefined) return teamMemberMetrics.length;
      return teamMemberMetrics.reduce((sum, m) => sum + (m.value || 0), 0);
    };

    return {
      name: teamMember,
      pointsCompleted: calculateMetric(metrics.pointsCompleted, 0),
      jirasCompleted: metrics.jirasCompleted.filter(m => m.teamMember === teamMember).length,
      avgTimeToMergePR: calculateMetric(metrics.timeToMergePR) / metrics.timeToMergePR.filter(m => m.teamMember === teamMember).length || 0,
      reviewsGiven: calculateMetric(metrics.reviewsGiven, 0),
      qaValidations: calculateMetric(metrics.qaValidations, 0),
      avgReviewComments: calculateMetric(metrics.reviewComments) / metrics.reviewComments.filter(m => m.teamMember === teamMember).length || 0,
      avgTimeInProgress: calculateMetric(metrics.timeInProgress) / metrics.timeInProgress.filter(m => m.teamMember === teamMember).length || 0,
      reviewCommentsGiven: calculateMetric(metrics.reviewCommentsGiven, 0),
      avgTimeToQAContact: calculateMetric(metrics.timeToQAContact) / metrics.timeToQAContact.filter(m => m.teamMember === teamMember).length || 0,
      bugCount: metrics.bugCount.filter(m => m.teamMember === teamMember).length,
      storyCount: metrics.storyCount.filter(m => m.teamMember === teamMember).length,
      taskCount: metrics.taskCount.filter(m => m.teamMember === teamMember).length,
      subTaskCount: metrics.subTaskCount.filter(m => m.teamMember === teamMember).length,
    };
  };

  // Create a set of all unique team members across all metrics
  const allTeamMembers = new Set([
    ...metrics.pointsCompleted.map(m => m.teamMember),
    ...metrics.jirasCompleted.map(m => m.teamMember),
    ...metrics.timeToMergePR.map(m => m.teamMember),
    ...metrics.reviewsGiven.map(m => m.teamMember),
    ...metrics.qaValidations.map(m => m.teamMember),
    ...metrics.reviewComments.map(m => m.teamMember),
    ...metrics.timeInProgress.map(m => m.teamMember),
    ...metrics.reviewCommentsGiven.map(m => m.teamMember),
  ]);

  const teamMemberMetrics = Array.from(allTeamMembers).map(calculateMetrics);

  const sortedTeamMemberMetrics = [...teamMemberMetrics].sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const calculateTotals = useMemo(() => {
    const totalPointsCompleted = metrics.pointsCompleted.reduce((sum, point) => sum + (point.value || 0), 0);
    const totalJirasCompleted = metrics.jirasCompleted.length;
    const avgTimeToMergePR = metrics.timeToMergePR.length > 0
      ? metrics.timeToMergePR.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToMergePR.length
      : 0;
    const totalReviewsGiven = metrics.reviewsGiven.length;
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

    const totalBugCount = metrics.bugCount.length;
    const totalStoryCount = metrics.storyCount.length;
    const totalTaskCount = metrics.taskCount.length;
    const totalSubTaskCount = metrics.subTaskCount.length;

    return {
      name: 'Total',
      pointsCompleted: totalPointsCompleted,
      jirasCompleted: totalJirasCompleted,
      avgTimeToMergePR: avgTimeToMergePR,
      reviewsGiven: totalReviewsGiven,
      qaValidations: totalQAValidations,
      avgReviewComments: avgReviewComments,
      avgTimeInProgress: avgTimeInProgress,
      reviewCommentsGiven: totalReviewCommentsGiven,
      avgTimeToQAContact: avgTimeToQAContact,
      bugCount: totalBugCount,
      storyCount: totalStoryCount,
      taskCount: totalTaskCount,
      subTaskCount: totalSubTaskCount,
    };
  }, [metrics]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleExpand = (teamMember: string, metric: SortKey) => {
    const metricsKey = metricKeyMapping[metric];
    setExpandedRow(prev => 
      prev?.member === teamMember && prev?.metric === metricsKey
        ? null
        : { member: teamMember, metric: metricsKey, issueType: metric }
    );
  };

  const formatColumnName = (key: string) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const exportToCSV = () => {
    const headers = ['Team Member', ...visibleColumns.map(formatColumnName)];
    const rows = showIndividualContributions
      ? sortedTeamMemberMetrics.map(member => [
          member.name,
          ...visibleColumns.map(col => {
            const value = member[col as keyof TeamMemberMetrics];
            return typeof value === 'number' ? value.toFixed(2) : value.toString();
          })
        ])
      : [];
    
    // Add total row
    rows.push([
      calculateTotals.name,
      ...visibleColumns.map(col => {
        const value = calculateTotals[col as keyof typeof calculateTotals];
        return typeof value === 'number' ? value.toFixed(2) : value.toString();
      })
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'team_metrics.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex justify-end mb-4">
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Metrics
        </Button>
      </div>
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/6">Team Member</TableHead>
            {Object.keys(teamMemberMetrics[0])
              .slice(1)
              .filter(key => visibleColumns.includes(key))
              .map((key) => (
                <TableHead key={key} className="w-1/12">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" onClick={() => handleSort(key as SortKey)} className="w-full">
                          <span className="truncate">
                            {formatColumnName(key)}
                          </span>
                          <ArrowUpDown className="ml-2 h-4 w-4 flex-shrink-0" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatColumnName(key)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {showIndividualContributions && sortedTeamMemberMetrics.map((member) => (
            <React.Fragment key={member.name}>
              <TableRow>
                <TableCell className="w-1/6 font-medium">{member.name}</TableCell>
                {Object.entries(member)
                  .slice(1)
                  .filter(([key]) => visibleColumns.includes(key))
                  .map(([key, value]) => (
                    <TableCell 
                      key={key}
                      className={cn(
                        "w-1/12",
                        expandedRow?.member === member.name && 
                        expandedRow?.metric === metricKeyMapping[key as SortKey] &&
                        "bg-primary/10 font-bold"
                      )}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => handleExpand(member.name, key as SortKey)}
                        className="w-full justify-between p-1"
                      >
                        <span className="truncate">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                        {expandedRow?.member === member.name && expandedRow?.metric === metricKeyMapping[key as SortKey] 
                          ? <ChevronDown className="ml-1 h-4 w-4 flex-shrink-0" /> 
                          : <ChevronRight className="ml-1 h-4 w-4 flex-shrink-0" />
                        }
                      </Button>
                    </TableCell>
                  ))}
              </TableRow>
              {expandedRow?.member === member.name && (
                <TableRow>
                  <TableCell colSpan={Object.keys(member).length}>
                    <DetailedMetricsView
                      metric={expandedRow.metric}
                      data={metrics[expandedRow.metric].filter(m => {
                        if (expandedRow.issueType && expandedRow.issueType.endsWith('Count')) {
                          const issueType = expandedRow.issueType.replace('Count', '');
                          return (m as MetricDataPoint).teamMember === member.name && 
                                 (m as MetricDataPoint).issueType?.name === issueType;
                        }
                        return (m as MetricDataPoint).teamMember === member.name;
                      }) as MetricDataPoint[]}
                      sprintNames={metrics.sprintNames}
                      allDates={metrics.allDates}
                    />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
          <TableRow>
            <TableCell className="w-1/6 font-bold">{calculateTotals.name}</TableCell>
            {Object.entries(calculateTotals)
              .slice(1)
              .filter(([key]) => visibleColumns.includes(key))
              .map(([key, value]) => (
                <TableCell 
                  key={key}
                  className={cn(
                    "w-1/12 font-bold",
                    expandedRow?.member === 'Total' && 
                    expandedRow?.metric === metricKeyMapping[key as SortKey] &&
                    "bg-primary/10"
                  )}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleExpand('Total', key as SortKey)}
                    className="w-full justify-between p-1"
                  >
                    <span className="truncate">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </span>
                    {expandedRow?.member === 'Total' && expandedRow?.metric === metricKeyMapping[key as SortKey] 
                      ? <ChevronDown className="ml-1 h-4 w-4 flex-shrink-0" /> 
                      : <ChevronRight className="ml-1 h-4 w-4 flex-shrink-0" />
                    }
                  </Button>
                </TableCell>
              ))}
          </TableRow>
          {expandedRow?.member === 'Total' && (
            <TableRow>
              <TableCell colSpan={Object.keys(calculateTotals).length}>
                <DetailedMetricsView
                  metric={expandedRow.metric}
                  data={metrics[expandedRow.metric] as MetricDataPoint[]}
                  sprintNames={metrics.sprintNames}
                  allDates={metrics.allDates}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}