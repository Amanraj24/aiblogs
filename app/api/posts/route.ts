import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM posts ORDER BY dateCreated DESC');
        console.log('API: Fetched posts', rows.length);

        // Parse JSON fields
        const posts = rows.map(post => ({
            ...post,
            keywords: post.keywords ? JSON.parse(post.keywords) : [],
            aeoQuestions: typeof post.aeoQuestions === 'string' ? JSON.parse(post.aeoQuestions) : (post.aeoQuestions || []),
            steps: post.steps ? JSON.parse(post.steps) : [],
            commercialIntent: Boolean(post.commercialIntent),
            isHowTo: Boolean(post.isHowTo)
        }));

        return NextResponse.json(posts);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const post = await request.json();
        console.log('API: Saving post', post.id, 'with slug:', post.slug);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO posts (
                id, slug, title, excerpt, content, keywords, category, dateCreated, 
                status, readTime, coverImage, geoTargeting, seoScore, aeoQuestions,
                commercialIntent, isHowTo, steps, scheduledDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                slug=?, title=?, excerpt=?, content=?, keywords=?, category=?, 
                status=?, readTime=?, coverImage=?, geoTargeting=?, seoScore=?, 
                aeoQuestions=?, commercialIntent=?, isHowTo=?, steps=?, scheduledDate=?`,
            [
                // INSERT values
                post.id, post.slug, post.title, post.excerpt, post.content, JSON.stringify(post.keywords), post.category,
                new Date(post.dateCreated), post.status, post.readTime, post.coverImage, post.geoTargeting, post.seoScore,
                JSON.stringify(post.aeoQuestions), post.commercialIntent ? 1 : 0, post.isHowTo ? 1 : 0,
                JSON.stringify(post.steps || []), post.scheduledDate || null,

                // UPDATE values
                post.slug, post.title, post.excerpt, post.content, JSON.stringify(post.keywords), post.category,
                post.status, post.readTime, post.coverImage, post.geoTargeting, post.seoScore,
                JSON.stringify(post.aeoQuestions), post.commercialIntent ? 1 : 0, post.isHowTo ? 1 : 0,
                JSON.stringify(post.steps || []), post.scheduledDate || null
            ]
        );

        return NextResponse.json({ success: true, insertId: result.insertId });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
