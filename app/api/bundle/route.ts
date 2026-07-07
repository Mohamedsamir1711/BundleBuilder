import { NextResponse } from 'next/server';
import bundleData from '@/data/bundleData.json'; 

export async function GET() {
  try {
    return NextResponse.json(bundleData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bundle data' }, { status: 500 });
  }
}