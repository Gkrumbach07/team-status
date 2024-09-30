import { fetchMetrics } from '@/app/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const { sprints, settings } = await req.json();

	const stream = await fetchMetrics(sprints, settings);

	return new NextResponse(stream, {
		headers: { 'Content-Type': 'text/event-stream' },
	});
}