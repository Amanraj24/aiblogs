import pool, { testConnection } from './db.js';

console.log('Testing database connection...');

testConnection().then((success) => {
    if (success) {
        console.log('✅ Test script completed successfully.');
        process.exit(0);
    } else {
        console.error('❌ Test script failed.');
        process.exit(1);
    }
});
