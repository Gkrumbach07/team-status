/* eslint-disable @next/next/no-img-element */
import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricDataPoint, Metrics } from '@/types/metrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from './ui/button';
import { format, parseISO, startOfDay, startOfMonth, isValid, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import ErrorBoundary from './ErrorBoundary';

interface DetailedMetricsViewProps {
  metric: keyof Metrics;
  data: MetricDataPoint[];
  sprintNames: { id: string; name: string }[];
  allDates: string[];
}

type AggregationType = 'sprint' | 'day' | 'month';

export default function DetailedMetricsView({ metric, data, sprintNames, allDates }: DetailedMetricsViewProps) {
  const [aggregationType, setAggregationType] = useState<AggregationType>('sprint');

  const sortedData = useMemo(() => 
    [...data].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime()),
    [data]
  );

  const aggregateData = useMemo(() => {
    const aggregated: { [key: string]: number } = {};
    
    if (aggregationType === 'sprint') {
      sprintNames.forEach(sprint => {
        aggregated[sprint.name] = 0;
      });
      sortedData.forEach(item => {
        const sprintName = sprintNames.find(s => s.id === item.sprintId)?.name || 'Unknown';
        aggregated[sprintName] = (aggregated[sprintName] || 0) + (item.value || 0);
      });
    } else if (aggregationType === 'day') {
      const startDate = parseISO(allDates[0]);
      const endDate = parseISO(allDates[allDates.length - 1]);
      eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
        aggregated[format(date, 'yyyy-MM-dd')] = 0;
      });
      sortedData.forEach(item => {
        if (item.date) {
          const day = format(startOfDay(parseISO(item.date)), 'yyyy-MM-dd');
          aggregated[day] = (aggregated[day] || 0) + (item.value || 0);
        }
      });
    } else if (aggregationType === 'month') {
      const startDate = parseISO(allDates[0]);
      const endDate = parseISO(allDates[allDates.length - 1]);
      eachMonthOfInterval({ start: startDate, end: endDate }).forEach(date => {
        aggregated[format(date, 'yyyy-MM')] = 0;
      });
      sortedData.forEach(item => {
        if (item.date) {
          const month = format(startOfMonth(parseISO(item.date)), 'yyyy-MM');
          aggregated[month] = (aggregated[month] || 0) + (item.value || 0);
        }
      });
    }

    return Object.entries(aggregated)
      .map(([key, value]) => ({ key, value }));
  }, [sortedData, aggregationType, sprintNames, allDates]);

  const sprintBoundaries = useMemo(() => {
    if (aggregationType !== 'day' && aggregationType !== 'month') return [];

    const boundaries: { date: string; sprintName: string }[] = [];
    sprintNames.forEach((sprint, index) => {
      if (index > 0) {
        const sprintStartDate = sortedData.find(item => item.sprintId === sprint.id)?.date;
        if (sprintStartDate) {
          boundaries.push({
            date: format(parseISO(sprintStartDate), aggregationType === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM'),
            sprintName: sprint.name
          });
        }
      }
    });
    return boundaries;
  }, [aggregationType, sprintNames, sortedData]);

  const ChartContent = ({ 
    aggregateData, 
    aggregationType, 
    sprintBoundaries, 
    metric 
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aggregateData: any;
    aggregationType: string;
    sprintBoundaries: Array<{ date: string; sprintName: string }>;
    metric: string;
  }) => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={aggregateData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="key" 
          tickFormatter={(value) => {
            if (aggregationType === 'sprint') return value;
            if (aggregationType === 'day') return format(parseISO(value), 'MM/dd');
            if (aggregationType === 'month') return format(parseISO(value), 'MMM yy');
            return value;
          }}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(label) => {
            if (aggregationType === 'sprint') return label;
            if (aggregationType === 'day') {
              const date = parseISO(label);
              return isValid(date) ? format(date, 'MMMM d, yyyy') : label;
            }
            if (aggregationType === 'month') {
              const date = parseISO(label);
              return isValid(date) ? format(date, 'MMMM yyyy') : label;
            }
            return label;
          }}
          formatter={(value: number) => [value.toFixed(2), metric]}
        />
        <Bar dataKey="value" fill="#8884d8" />
        {sprintBoundaries.map((boundary) => (
          <ReferenceLine
            key={boundary.date}
            x={boundary.date}
            stroke="#666"
            strokeDasharray="3 3"
            label={{ value: boundary.sprintName, angle: -90, position: 'insideTopRight' }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderContent = () => (
    <Tabs defaultValue="table">
      <TabsList>
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="chart">Chart</TabsTrigger>
      </TabsList>
      <TabsContent value="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue Type</TableHead>
              <TableHead>Jira ID</TableHead>
              <TableHead>Jira Title</TableHead>
              <TableHead>PR ID</TableHead>
              <TableHead>PR Title</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Sprint</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item.jiraId}>
                <TableCell>
                  {item.issueType && (
                    <div className="flex items-center">
                      <img src={item.issueType.iconUrl} alt={item.issueType.name} width={16} height={16} />
                      <span className="ml-2">{item.issueType.name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="link" asChild>
                    <a href={`https://${process.env.JIRA_HOST}/browse/${item.jiraId}`} target="_blank" rel="noopener noreferrer">
                      {item.jiraId}
                    </a>
                  </Button>
                </TableCell>
                <TableCell>
                  {item.title}
                </TableCell>
                <TableCell>
                  {item.prId && (
                    <Button variant="link" asChild>
                      <a href={`https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/pull/${item.prId}`} target="_blank" rel="noopener noreferrer">
                        {item.prId}
                      </a>
                    </Button>
                  )}
                </TableCell>
                <TableCell>{item.prTitle}</TableCell>
                <TableCell>{item.value?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell>{item.date ? format(parseISO(item.date), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell>{sprintNames.find(s => s.id === item.sprintId)?.name || 'Unknown'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="chart">
        <Tabs defaultValue="sprint">
          <TabsList>
            <TabsTrigger value="sprint" onClick={() => setAggregationType('sprint')}>By Sprint</TabsTrigger>
            <TabsTrigger value="day" onClick={() => setAggregationType('day')}>By Day</TabsTrigger>
            <TabsTrigger value="month" onClick={() => setAggregationType('month')}>By Month</TabsTrigger>
          </TabsList>
        </Tabs>
        <ErrorBoundary fallback={<div>An error occurred while rendering the chart. Please try a different view or contact support.</div>}>
          <ChartContent 
            aggregateData={aggregateData}
            aggregationType={aggregationType}
            sprintBoundaries={sprintBoundaries}
            metric={metric}
          />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );

  return (
    <ErrorBoundary fallback={<div>An error occurred while rendering the detailed metrics view. Please try again or contact support if the problem persists.</div>}>
      {renderContent()}
    </ErrorBoundary>
  );
}