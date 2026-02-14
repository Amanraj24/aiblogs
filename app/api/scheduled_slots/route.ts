import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM scheduled_slots');

        // Parse JSON fields
        const slots = rows.map(slot => ({
            ...slot,
            suggestedTopics: typeof slot.suggestedTopics === 'string' ? JSON.parse(slot.suggestedTopics) : (slot.suggestedTopics || []),
            selectedTopic: typeof slot.selectedTopic === 'string' ? JSON.parse(slot.selectedTopic) : slot.selectedTopic
        }));

        return NextResponse.json(slots);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const slot = await request.json();
        console.log('API: Saving scheduled slot', slot.id);

        await pool.query(
            'INSERT INTO scheduled_slots (id, scheduleId, niche, date, time, status, suggestedTopics, selectedTopic, suggestionCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?, suggestedTopics=?, selectedTopic=?, suggestionCount=?',
            [
                slot.id, slot.scheduleId, slot.niche, slot.date, slot.time, slot.status, JSON.stringify(slot.suggestedTopics), JSON.stringify(slot.selectedTopic), slot.suggestionCount || 5,
                slot.status, JSON.stringify(slot.suggestedTopics), JSON.stringify(slot.selectedTopic), slot.suggestionCount || 5
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
