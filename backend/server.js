const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const teaRoutes = require('./routes/tea');
const dairyRoutes = require('./routes/dairy');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Allow frontend domain (update after deployment)
app.use(cors({
    origin: '*', // Allow all origins temporarily, restrict later
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tea', teaRoutes);
app.use('/api/dairy', dairyRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: '🌿 Talaen Farm API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            tea: '/api/tea',
            dairy: '/api/dairy',
            health: '/api/health'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Talaen Farm API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

app.listen(PORT, () => {
    console.log(`🌿 Talaen Farm API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
