import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pool from './lib/db';

async function checkSchema() {
    try {
        console.log('Checking database schema...');
        const [rows]: any = await pool.query('DESCRIBE posts');
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error('Failed to check schema:', error);
        process.exit(1);
    }
}

checkSchema();
