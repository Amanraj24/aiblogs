const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function migrate() {
    try {
        console.log('Starting database migration...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('Adding missing columns...');

        const alterQueries = [
            'ALTER TABLE posts ADD COLUMN IF NOT EXISTS commercialIntent BOOLEAN DEFAULT FALSE',
            'ALTER TABLE posts ADD COLUMN IF NOT EXISTS isHowTo BOOLEAN DEFAULT FALSE',
            'ALTER TABLE posts ADD COLUMN IF NOT EXISTS steps LONGTEXT'
        ];

        for (const query of alterQueries) {
            try {
                await connection.query(query);
                console.log(`Executed: ${query}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column already exists, skipping: ${query.split('ADD COLUMN ')[1].split(' ')[0]}`);
                } else {
                    throw err;
                }
            }
        }

        await connection.end();
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
