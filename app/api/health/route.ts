import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
    try {
        // Verify MongoDB connection
        await connectDB();

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed',
            },
            { status: 503 }
        );
    }
}
