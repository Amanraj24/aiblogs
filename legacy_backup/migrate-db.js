import pool from './db.js';

const migrate = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Migrating database...');

        // Add suggestionCount to schedules table if it doesn't exist
        const [schedulesColumns] = await connection.query('SHOW COLUMNS FROM schedules LIKE "suggestionCount"');
        if (schedulesColumns.length === 0) {
            console.log('Adding suggestionCount to schedules table...');
            await connection.query('ALTER TABLE schedules ADD COLUMN suggestionCount INT DEFAULT 5');
        } else {
            console.log('suggestionCount already exists in schedules table.');
        }

        // Add suggestionCount to scheduled_slots table if it doesn't exist
        const [slotsColumns] = await connection.query('SHOW COLUMNS FROM scheduled_slots LIKE "suggestionCount"');
        if (slotsColumns.length === 0) {
            console.log('Adding suggestionCount to scheduled_slots table...');
            await connection.query('ALTER TABLE scheduled_slots ADD COLUMN suggestionCount INT DEFAULT 5');
        } else {
            console.log('suggestionCount already exists in scheduled_slots table.');
        }

        connection.release();
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
