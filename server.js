import express from 'express';
import cors from 'cors';
import pool, { testConnection } from './db.js';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Initialize Database Tables
const initDb = async () => {
    // Verify connection first
    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('Skipping database initialization due to connection failure.');
        return;
    }

    try {
        const connection = await pool.getConnection();

        // Posts Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        keywords TEXT,
        category VARCHAR(255),
        dateCreated DATETIME,
        status VARCHAR(50),
        readTime VARCHAR(50),
        coverImage TEXT,
        geoTargeting VARCHAR(255),
        seoScore INT,
        aeoQuestions JSON
      )
    `);

        // Schedules Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(255) PRIMARY KEY,
        niche VARCHAR(255),
        startDate DATE,
        endDate DATE,
        launchTime TIME,
        suggestionCount INT DEFAULT 5
      )
    `);

        // Training Data Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS training_data (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        content TEXT,
        type VARCHAR(50),
        dateAdded VARCHAR(50)
      )
    `);

        // Scheduled Slots Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS scheduled_slots (
        id VARCHAR(255) PRIMARY KEY,
        scheduleId VARCHAR(255),
        niche VARCHAR(255),
        date DATE,
        time TIME,
        status VARCHAR(50),
        suggestedTopics JSON,
        selectedTopic JSON,
        suggestionCount INT DEFAULT 5
      )
    `);

        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

initDb();

// API Endpoints for Posts
app.get('/api/posts', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM posts ORDER BY dateCreated DESC');
        // Parse JSON fields
        const posts = rows.map(post => ({
            ...post,
            keywords: post.keywords ? JSON.parse(post.keywords) : [],
            aeoQuestions: typeof post.aeoQuestions === 'string' ? JSON.parse(post.aeoQuestions) : (post.aeoQuestions || [])
        }));
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts', async (req, res) => {
    const post = req.body;
    try {
        await pool.query(
            'INSERT INTO posts (id, title, excerpt, content, keywords, category, dateCreated, status, readTime, coverImage, geoTargeting, seoScore, aeoQuestions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, excerpt=?, content=?, keywords=?, category=?, status=?, readTime=?, coverImage=?, geoTargeting=?, seoScore=?, aeoQuestions=?',
            [
                post.id, post.title, post.excerpt, post.content, JSON.stringify(post.keywords), post.category,
                new Date(post.dateCreated), post.status, post.readTime, post.coverImage, post.geoTargeting, post.seoScore, JSON.stringify(post.aeoQuestions),
                post.title, post.excerpt, post.content, JSON.stringify(post.keywords), post.category, post.status, post.readTime, post.coverImage, post.geoTargeting, post.seoScore, JSON.stringify(post.aeoQuestions)
            ]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoints for Schedules
app.get('/api/schedules', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM schedules');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/schedules', async (req, res) => {
    const schedule = req.body;
    try {
        await pool.query(
            'INSERT INTO schedules (id, niche, startDate, endDate, launchTime, suggestionCount) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niche=?, startDate=?, endDate=?, launchTime=?, suggestionCount=?',
            [schedule.id, schedule.niche, schedule.startDate, schedule.endDate, schedule.launchTime, schedule.suggestionCount || 5, schedule.niche, schedule.startDate, schedule.endDate, schedule.launchTime, schedule.suggestionCount || 5]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoints for Training Data
app.get('/api/training_data', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM training_data');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/training_data', async (req, res) => {
    const data = req.body;
    try {
        await pool.query(
            'INSERT INTO training_data (id, title, content, type, dateAdded) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, content=?, type=?, dateAdded=?',
            [data.id, data.title, data.content, data.type, data.dateAdded, data.title, data.content, data.type, data.dateAdded]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/training_data/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM training_data WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoints for Scheduled Slots
app.get('/api/scheduled_slots', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_slots');
        const slots = rows.map(slot => ({
            ...slot,
            suggestedTopics: typeof slot.suggestedTopics === 'string' ? JSON.parse(slot.suggestedTopics) : (slot.suggestedTopics || []),
            selectedTopic: typeof slot.selectedTopic === 'string' ? JSON.parse(slot.selectedTopic) : slot.selectedTopic
        }));
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/scheduled_slots', async (req, res) => {
    const slot = req.body;
    try {
        await pool.query(
            'INSERT INTO scheduled_slots (id, scheduleId, niche, date, time, status, suggestedTopics, selectedTopic, suggestionCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?, suggestedTopics=?, selectedTopic=?, suggestionCount=?',
            [
                slot.id, slot.scheduleId, slot.niche, slot.date, slot.time, slot.status, JSON.stringify(slot.suggestedTopics), JSON.stringify(slot.selectedTopic), slot.suggestionCount || 5,
                slot.status, JSON.stringify(slot.suggestedTopics), JSON.stringify(slot.selectedTopic), slot.suggestionCount || 5
            ]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
