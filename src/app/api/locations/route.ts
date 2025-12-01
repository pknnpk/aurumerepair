import { NextResponse } from 'next/server';
import { db } from '@/db';
import { thaiLocations } from '@/db/schema';

export async function GET() {
    try {
        const locations = await db.select().from(thaiLocations);
        return NextResponse.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }
}
