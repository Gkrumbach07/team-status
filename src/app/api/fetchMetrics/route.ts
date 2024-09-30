import { fetchMetrics } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const { sprints, envVars } = await req.json();

	// Use the environment variables passed from the client
	process.env.GITHUB_TOKEN = envVars.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
	process.env.JIRA_ACCESS_TOKEN = envVars.JIRA_ACCESS_TOKEN || process.env.JIRA_ACCESS_TOKEN;
	process.env.JIRA_HOST = envVars.JIRA_HOST || process.env.JIRA_HOST;
	process.env.GITHUB_OWNER = envVars.GITHUB_OWNER || process.env.GITHUB_OWNER;
	process.env.GITHUB_REPO = envVars.GITHUB_REPO || process.env.GITHUB_REPO;
	process.env.JIRA_BOARD_ID = envVars.JIRA_BOARD_ID || process.env.JIRA_BOARD_ID;

	const stream = await fetchMetrics(sprints);

	return new NextResponse(stream, {
		headers: { 'Content-Type': 'text/event-stream' },
	});
}