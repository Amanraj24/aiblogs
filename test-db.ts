import pool from './lib/db';

async function testConnection() {
    try {
        console.log('Testing DB connection...');
        const [rows] = await pool.query('SELECT 1 as result');
        console.log('Connection successful:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
