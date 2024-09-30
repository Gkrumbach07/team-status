'use server'

import { Octokit, RestEndpointMethodTypes } from '@octokit/rest'
import JiraApi from 'jira-client'
import { Metrics, MetricDataPoint } from '@/types/metrics'
import { addDays, format } from 'date-fns';

interface Settings {
	GITHUB_TOKEN: string;
	JIRA_ACCESS_TOKEN: string;
	JIRA_HOST: string;
	GITHUB_OWNER: string;
	GITHUB_REPO: string;
	JIRA_BOARD_ID: string;
}

// Initialize GitHub client
const createOctokit = (settings: Settings) => new Octokit({
	auth: settings.GITHUB_TOKEN
})

// Initialize Jira client
const createJiraClient = (settings: Settings) => new JiraApi({
	protocol: 'https',
	host: settings.JIRA_HOST,
	bearer: settings.JIRA_ACCESS_TOKEN,
	apiVersion: '2',
	strictSSL: true
})

// New action to fetch sprints from Jira
export async function fetchSprints(settings: Settings) {
	const jira = createJiraClient(settings);
	try {
		// Fetch the specific Dashboard board
		const dashboardBoard = await jira.getBoard(settings.JIRA_BOARD_ID);

		if (!dashboardBoard) {
			throw new Error('Dashboard board not found');
		}

		// Fetch sprints for the Dashboard board
		const sprints = await jira.getAllSprints(dashboardBoard.id);

		// Transform the sprints data to match the format expected by the SprintSelector
		return sprints.values.map((sprint: { id: number; name: string }) => ({
			value: sprint.id.toString(),
			label: sprint.name
		}));
	} catch (error) {
		console.error('Error fetching sprints:', error);
		throw new Error('Failed to fetch sprints from Jira');
	}
}

interface JiraIssue {
	key: string;
	sprintId: string;
	fields: {
		assignee: { displayName: string } | null;
		status: { name: string, statusCategory: { key: string } };
		issuetype: { name: string, iconUrl: string };
		customfield_12310243: number | null; // Story points
		created: string;
		resolutiondate: string | null;
		customfield_12310220: string[]; // PR URL
		customfield_12315948: { displayName: string } | null; // QA validator
		customfield_12310940: string | null; // Sprint
		customfield_12311140: { name: string } | null; // epic link
		summary: string;
	};
	changelog: {
		histories: Array<{
			created: string;
			items: Array<{
				field: string;
				fromString: string | null;
				toString: string | null;
			}>;
		}>;
	};
}

async function processMetrics(
	jiraIssues: JiraIssue[],
	pullRequests: (RestEndpointMethodTypes["pulls"]["get"]["response"]["data"] & { reviewComments: RestEndpointMethodTypes["pulls"]["listReviewComments"]["response"]["data"] })[],
	sprintDetails: { id: number; name: string }[],
	allDates: string[],
	settings: Settings
): Promise<Metrics> {
	const metrics: Metrics = {
		pointsCompleted: [],
		timeToMergePR: [],
		reviewsGiven: [],
		qaValidations: [],
		reviewComments: [],
		timeInProgress: [],
		reviewCommentsGiven: [],
		jirasCompleted: [],
		sprintNames: sprintDetails.map(s => ({ id: s.id.toString(), name: s.name })),
		allDates: allDates,
		timeToQAContact: [],
		bugCount: [],
		storyCount: [],
		taskCount: [],
		subTaskCount: [],
	};

	const prMap: { [key: number]: (RestEndpointMethodTypes["pulls"]["get"]["response"]["data"] & { reviewComments: RestEndpointMethodTypes["pulls"]["listReviewComments"]["response"]["data"] }) } = {};

	// Create a map of PR numbers to PR objects
	pullRequests.forEach(pr => {
		prMap[pr.number] = pr;
	});

	// Create a map of GitHub usernames to Jira display names
	const githubToJiraMap: { [key: string]: string } = {};

	// Process Jira issues
	for (const issue of jiraIssues) {
		const assignee = issue.fields.assignee?.displayName || 'Unassigned';
		const sprintId = issue.sprintId || 'Unknown';
		const prUrl = issue.fields.customfield_12310220?.[0];
		const pr = (prUrl && prUrl.startsWith(`https://github.com/${settings.GITHUB_OWNER}/${settings.GITHUB_REPO}/pull/`)) ? prMap[parseInt(prUrl.split('/').pop() || '')] : undefined;

		// Update each metric push to include date, title, and prTitle
		const pushMetric = (metricArray: MetricDataPoint[], value?: number, overrideTeamMember?: string) => {
			metricArray.push({
				teamMember: overrideTeamMember || assignee,
				sprintId,
				jiraId: issue.key,
				value,
				date: issue.fields.resolutiondate || issue.fields.created,
				title: issue.fields.summary,
				prId: pr?.number,
				prTitle: pr?.title,
				issueType: {
					name: issue.fields.issuetype.name,
					iconUrl: issue.fields.issuetype.iconUrl,
				},
			});
		};

		// Push issue type count
		switch (issue.fields.issuetype.name.toLowerCase()) {
			case 'bug':
				pushMetric(metrics.bugCount, 1);
				break;
			case 'story':
				pushMetric(metrics.storyCount, 1);
				break;
			case 'task':
				pushMetric(metrics.taskCount, 1);
				break;
			case 'sub-task':
				pushMetric(metrics.subTaskCount, 1);
				break;
		}

		// Points completed
		if (issue.fields.status.statusCategory.key === 'done') {
			pushMetric(metrics.pointsCompleted, issue.fields.customfield_12310243 || 0);
		}

		// QA validations
		if (issue.fields.customfield_12315948) {
			const qaValidator = issue.fields.customfield_12315948.displayName;
			pushMetric(metrics.qaValidations, undefined, qaValidator);
		}

		// Time in progress
		const statusChanges = issue.changelog.histories
			.flatMap(history => history.items
				.filter(item => item.field === 'status')
				.map(item => ({
					date: new Date(history.created),
					fromStatus: item.fromString,
					toStatus: item.toString
				}))
			)
			.sort((a, b) => a.date.getTime() - b.date.getTime());

		let lastInProgressDate: Date | null = null;
		let totalTimeInProgress = 0;
		let isCompleted = false;

		statusChanges.forEach(change => {
			if (change.toStatus === 'In Progress') {
				lastInProgressDate = change.date;
			} else if (lastInProgressDate && ['Testing', 'Done', 'Closed', 'Review'].includes(change.toStatus || '')) {
				totalTimeInProgress += change.date.getTime() - lastInProgressDate.getTime();
				lastInProgressDate = null;
				if (['Done', 'Closed'].includes(change.toStatus || '')) {
					isCompleted = true;
				}
			}
		});

		// Only include the metric if the issue is completed
		if (isCompleted && totalTimeInProgress > 0) {
			pushMetric(metrics.timeInProgress, totalTimeInProgress / (1000 * 60 * 60 * 24));
		}

		// Calculate time to QA contact
		const inProgressDate = statusChanges.find(change => change.toStatus === 'Review')?.date;
		const qaContactDate = statusChanges.find(change => change.toStatus === 'Testing')?.date;

		if (inProgressDate && qaContactDate) {
			const timeToQAContact = qaContactDate.getTime() - inProgressDate.getTime();
			pushMetric(metrics.timeToQAContact, timeToQAContact / (1000 * 60 * 60 * 24)); // Convert to days
		}

		// Process related PR if it exists
		if (pr) {
			// Map GitHub username to Jira display name
			if (pr.user) {
				githubToJiraMap[pr.user.login] = assignee;
			}

			// Time to merge PR
			if (pr.merged_at) {
				const timeToMerge = new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime();
				pushMetric(metrics.timeToMergePR, timeToMerge / (1000 * 60 * 60 * 24));
			}

			// Fetch regular comments for the PR
			const octokit = createOctokit(settings);
			const { data: regularComments } = await octokit.issues.listComments({
				owner: settings.GITHUB_OWNER,
				repo: settings.GITHUB_REPO,
				issue_number: pr.number
			});

			// Combine review comments and regular comments
			const allComments = [...pr.reviewComments, ...regularComments];

			// Reviews given and review comments given
			const reviewers = new Set<string>();
			allComments.forEach(comment => {
				if (comment.user?.login !== pr.user?.login) {
					reviewers.add(comment.user?.login || '');
					metrics.reviewCommentsGiven.push({
						teamMember: githubToJiraMap[comment.user?.login || ''] || comment.user?.login || '',
						sprintId,
						jiraId: issue.key,
						prId: pr?.number,
						value: 1,
						date: comment.created_at,
						title: issue.fields.summary,
						prTitle: pr?.title
					});
				}
			});

			reviewers.forEach(reviewer => {
				metrics.reviewsGiven.push({
					teamMember: githubToJiraMap[reviewer] || reviewer,
					sprintId,
					jiraId: issue.key,
					prId: pr?.number,
					title: issue.fields.summary,
					prTitle: pr?.title
				});
			});

			// Update review comments received to include regular comments
			const reviewCommentsReceived = allComments.filter(comment => comment.user?.login !== pr.user?.login).length;
			metrics.reviewComments.push({
				teamMember: assignee,
				sprintId,
				jiraId: issue.key,
				prId: pr?.number,
				value: reviewCommentsReceived,
				title: issue.fields.summary,
				prTitle: pr?.title
			});
		}

		// Jiras completed
		if (issue.fields.status.name === 'Closed' || issue.fields.status.name === 'Resolved') {
			pushMetric(metrics.jirasCompleted);
		}
	}

	return metrics;
}

export async function fetchMetrics(sprints: string[], settings: Settings): Promise<ReadableStream<Uint8Array>> {
	const jira = createJiraClient(settings);
	const octokit = createOctokit(settings);
	const encoder = new TextEncoder();

	return new ReadableStream({
		async start(controller) {
			try {
				// Fetch all Jira issues for the given sprints
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Fetching Jira issues' }) + '\n'));
				const jiraIssues = await fetchAllJiraIssues(sprints, settings);
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Jira issues fetched', progress: 20 }) + '\n'));

				// Fetch sprint details
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Fetching sprint details' }) + '\n'));
				const sprintDetails = await Promise.all(sprints.map(sprintId => jira.getSprint(sprintId)));
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Sprint details fetched', progress: 40 }) + '\n'));

				// Generate all dates between start and end
				const startDate = new Date(Math.min(...sprintDetails.map(s => new Date(s.startDate).getTime())));
				const endDate = new Date(Math.max(...sprintDetails.map(s => new Date(s.endDate).getTime())));
				const allDates = generateDateRange(startDate, endDate);

				// Collect all PR URLs from Jira issues
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Collecting PR URLs' }) + '\n'));
				const prUrls = jiraIssues
					.map(issue => issue.fields.customfield_12310220?.[0])
					.filter(url => url && url.startsWith(`https://github.com/${settings.GITHUB_OWNER}/${settings.GITHUB_REPO}/pull/`)) as string[];
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'PR URLs collected', progress: 60 }) + '\n'));

				// Fetch GitHub PRs
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Fetching GitHub PRs' }) + '\n'));
				const pullRequests = await Promise.all(prUrls.map(async (url) => {
					const prNumber = parseInt(url.split('/').pop() || '');
					if (isNaN(prNumber)) {
						console.warn(`Invalid PR number in URL: ${url}`);
						return null;
					}
					try {
						const { data: pr } = await octokit.pulls.get({
							owner: settings.GITHUB_OWNER,
							repo: settings.GITHUB_REPO,
							pull_number: prNumber
						});
						const { data: reviewComments } = await octokit.pulls.listReviewComments({
							owner: settings.GITHUB_OWNER,
							repo: settings.GITHUB_REPO,
							pull_number: prNumber
						});
						return { ...pr, reviewComments };
					} catch (error) {
						console.warn(`Failed to fetch PR ${prNumber}:`, error);
						return null;
					}
				}));
				const validPullRequests = pullRequests.filter((pr): pr is NonNullable<typeof pr> => pr !== null);
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'GitHub PRs fetched', progress: 80 }) + '\n'));

				// Process and combine the data
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Processing metrics' }) + '\n'));
				const metrics = await processMetrics(jiraIssues, validPullRequests, sprintDetails.map(s => ({ id: s.id, name: s.name })), allDates, settings);
				controller.enqueue(encoder.encode(JSON.stringify({ status: 'Metrics processed', progress: 100, metrics }) + '\n'));

				controller.close();
			} catch (error) {
				console.error('Error fetching metrics:', error);
				controller.error(new Error('Failed to fetch metrics'));
			}
		}
	});
}

async function fetchAllJiraIssues(sprints: string[], settings: Settings): Promise<JiraIssue[]> {
	const jira = createJiraClient(settings);
	const allIssues: JiraIssue[] = [];
	const maxResultsPerRequest = 100; // Increase this to reduce the number of API calls, max is 100

	for (const sprint of sprints) {
		let startAt = 0;
		let totalIssues = 0;
		let fetchedIssues = 0;

		do {
			const response = await jira.searchJira(`Sprint = ${sprint}`, {
				fields: ['assignee', 'status', 'issuetype', 'customfield_12310243', 'created', 'resolutiondate', 'customfield_12310220', 'customfield_12315948', 'changelog', 'summary', 'customfield_12311140', 'customfield_12310940'],
				expand: ['changelog'],
				maxResults: maxResultsPerRequest,
				startAt: startAt
			});

			// Attach sprint ID to each issue
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const issuesWithSprintId = response.issues.map((issue: any) => ({ ...issue, sprintId: sprint }));
			allIssues.push(...issuesWithSprintId);

			totalIssues = response.total;
			fetchedIssues += response.issues.length;
			startAt += maxResultsPerRequest;

		} while (fetchedIssues < totalIssues);
	}

	return allIssues;
}

function generateDateRange(start: Date, end: Date): string[] {
	const dates = [];
	let currentDate = start;
	while (currentDate <= end) {
		dates.push(format(currentDate, 'yyyy-MM-dd'));
		currentDate = addDays(currentDate, 1);
	}
	return dates;
}