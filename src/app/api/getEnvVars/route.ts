import { NextResponse } from 'next/server';

export async function GET() {
	const envVars = {
		GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
		JIRA_ACCESS_TOKEN: process.env.JIRA_ACCESS_TOKEN || '',
		JIRA_HOST: process.env.JIRA_HOST || '',
		GITHUB_OWNER: process.env.GITHUB_OWNER || '',
		GITHUB_REPO: process.env.GITHUB_REPO || '',
		JIRA_BOARD_ID: process.env.JIRA_BOARD_ID || '',
	};

	return NextResponse.json(envVars);
}