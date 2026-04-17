require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// Import your modular routes
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth'); // If you've moved Radwa's here
const roomRoutes = require('./routes/rooms'); // If you've moved Radwa's here

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Database Sync & Start
sequelize.sync()
    .then(() => {
        console.log('✅ PostgreSQL Connected & Synced (Supabase)');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database Sync Error:', err);
    });
