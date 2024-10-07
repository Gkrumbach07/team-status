import { fetchMetrics } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const { sprints, settings } = await req.json();

	const githubToken = req.headers.get('X-Github-Token') ?? '';
	const jiraToken = req.headers.get('X-Jira-Token') ?? '';


	const stream = await fetchMetrics(sprints, {
		...settings,
		GITHUB_TOKEN: githubToken,
		JIRA_ACCESS_TOKEN: jiraToken
	});

	return new NextResponse(stream, {
		headers: { 'Content-Type': 'text/event-stream' },
	});
}