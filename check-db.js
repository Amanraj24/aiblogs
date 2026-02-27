const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    try {
        console.log('Checking database schema...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [rows] = await connection.query('DESCRIBE posts');
        console.table(rows);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Failed to check schema:', error);
        process.exit(1);
    }
}

checkSchema();
