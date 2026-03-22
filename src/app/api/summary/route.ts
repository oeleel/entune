import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    summary: null,
    message: 'Use /api/session/end to generate reports',
  });
}
