const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-change-me';
const APP_USERNAME = process.env.APP_USERNAME || 'margot';
const APP_PASSWORD = process.env.APP_PASSWORD || 'margot';

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static(__dirname));

// Database setup
const dbPath = process.env.NODE_ENV === 'production' ? './cats.db' : './cats.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Mit SQLite-Datenbank verbunden.');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS cats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS feedings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cat_id INTEGER NOT NULL,
        amount TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS can_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quantity INTEGER NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    )`);
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Nicht authentifiziert' });
    }
}

// Authentication routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple authentication using environment variables APP_USERNAME / APP_PASSWORD
    if (username === APP_USERNAME && password === APP_PASSWORD) {
        req.session.userId = 1;
        req.session.username = APP_USERNAME;
        res.json({ success: true, username: APP_USERNAME });
    } else {
        res.status(401).json({ error: 'Ungültiger Benutzername oder Passwort' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Fehler beim Abmelden' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ authenticated: true, username: req.session.username });
    } else {
        res.json({ authenticated: false });
    }
});

// API Routes

// Get all cats with their feedings
app.get('/api/cats', requireAuth, (req, res) => {
    db.all('SELECT * FROM cats ORDER BY name', (err, cats) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Get feedings for each cat
        const promises = cats.map(cat => {
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM feedings WHERE cat_id = ? ORDER BY timestamp DESC', [cat.id], (err, feedings) => {
                    if (err) reject(err);
                    else resolve({ ...cat, feedings });
                });
            });
        });

        Promise.all(promises)
            .then(catsWithFeedings => res.json({ cats: catsWithFeedings }))
            .catch(err => res.status(500).json({ error: err.message }));
    });
});

// Add a new cat
app.post('/api/cats', requireAuth, (req, res) => {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name ist erforderlich' });
    }

    // Check if cat already exists
    db.get('SELECT * FROM cats WHERE LOWER(name) = LOWER(?)', [name], (err, existingCat) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (existingCat) {
            return res.status(400).json({ error: 'Eine Katze mit diesem Namen existiert bereits' });
        }

        // Insert new cat
        db.run('INSERT INTO cats (name) VALUES (?)', [name], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, feedings: [] });
        });
    });
});

// Delete a cat
app.delete('/api/cats/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    // First delete all feedings
    db.run('DELETE FROM feedings WHERE cat_id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Then delete the cat
        db.run('DELETE FROM cats WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Katze gelöscht', changes: this.changes });
        });
    });
});

// Add a feeding
app.post('/api/feedings', requireAuth, (req, res) => {
    const { cat_id, amount, timestamp } = req.body;

    if (!cat_id || !amount) {
        return res.status(400).json({ error: 'cat_id und amount sind erforderlich' });
    }

    const feedingTimestamp = timestamp || new Date().toISOString();

    db.run('INSERT INTO feedings (cat_id, amount, timestamp) VALUES (?, ?, ?)', 
        [cat_id, amount, feedingTimestamp], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, cat_id, amount, timestamp: feedingTimestamp });
        }
    );
});

// Delete a feeding
app.delete('/api/feedings/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM feedings WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Fütterung gelöscht', changes: this.changes });
    });
});

// Get all can purchases
app.get('/api/can-purchases', requireAuth, (req, res) => {
    db.all('SELECT * FROM can_purchases ORDER BY purchase_date DESC', (err, purchases) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ purchases });
    });
});

// Add a can purchase
app.post('/api/can-purchases', requireAuth, (req, res) => {
    const { quantity, notes, purchase_date } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Menge ist erforderlich und muss größer als 0 sein' });
    }

    const purchaseDate = purchase_date || new Date().toISOString();

    db.run('INSERT INTO can_purchases (quantity, notes, purchase_date) VALUES (?, ?, ?)', 
        [quantity, notes || null, purchaseDate], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, quantity, notes, purchase_date: purchaseDate });
        }
    );
});

// Delete a can purchase
app.delete('/api/can-purchases/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM can_purchases WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Dosenkauf gelöscht', changes: this.changes });
    });
});

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the app page
app.get('/app', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'cat-food-tracker.html'));
});

// Health check endpoint for Azure monitoring & troubleshooting
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        node: process.version,
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        cwd: process.cwd()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('[startup] Express server gestartet');
    console.log(`[startup] Node Version: ${process.version}`);
    console.log(`[startup] Listening on port: ${PORT}`);
    console.log(`[startup] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[startup] Working directory: ${process.cwd()}`);
    console.log(`Server läuft auf http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Fehler beim Schließen der Datenbank:', err.message);
        }
        console.log('Datenbankverbindung geschlossen.');
        process.exit(0);
    });
});