import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM training_data');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        console.log('API: Saving training data', data.id);

        await pool.query(
            'INSERT INTO training_data (id, title, content, type, dateAdded) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, content=?, type=?, dateAdded=?',
            [data.id, data.title, data.content, data.type, data.dateAdded, data.title, data.content, data.type, data.dateAdded]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
