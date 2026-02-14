import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM schedules');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const schedule = await request.json();
        console.log('API: Saving schedule', schedule.id);

        await pool.query(
            'INSERT INTO schedules (id, niche, startDate, endDate, launchTime, suggestionCount) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niche=?, startDate=?, endDate=?, launchTime=?, suggestionCount=?',
            [schedule.id, schedule.niche, schedule.startDate, schedule.endDate, schedule.launchTime, schedule.suggestionCount || 5, schedule.niche, schedule.startDate, schedule.endDate, schedule.launchTime, schedule.suggestionCount || 5]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
