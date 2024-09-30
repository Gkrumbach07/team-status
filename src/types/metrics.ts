export interface MetricDataPoint {
	teamMember: string;
	sprintId: string;
	jiraId: string;
	prId?: number;
	value?: number;
	date?: string;
	title: string;  // Jira title
	prTitle?: string;  // PR title
	issueType?: {
		name: string;
		iconUrl: string;
	};
}

export interface Metrics {
	pointsCompleted: MetricDataPoint[];
	timeToMergePR: MetricDataPoint[];
	reviewsGiven: MetricDataPoint[];
	qaValidations: MetricDataPoint[];
	reviewComments: MetricDataPoint[];
	timeInProgress: MetricDataPoint[];
	reviewCommentsGiven: MetricDataPoint[];
	jirasCompleted: MetricDataPoint[];
	sprintNames: { id: string; name: string }[];
	allDates: string[];
	timeToQAContact: MetricDataPoint[];
	bugCount: MetricDataPoint[];
	storyCount: MetricDataPoint[];
	taskCount: MetricDataPoint[];
	subTaskCount: MetricDataPoint[];
}

export interface SprintSummary {
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