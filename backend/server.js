require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// Import modular routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const timelineRoutes = require('./routes/timeline'); // <-- 1. ADD THIS
const timelineRoutes = require('./routes/timeline'); // Added from friend's push

const app = express();
const PORT = process.env.PORT || 3000;
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/timeline', timelineRoutes); // <-- 2. ADD THIS
app.use('/api/timeline', timelineRoutes); // Added from friend's push

// Sync Database and Start
// Sync Database and Start
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ PostgreSQL Connected & Synced (Supabase)');
        // Only listen to port if running locally
        if (process.env.NODE_ENV !== 'production') {
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        }
    })
    .catch(err => {
        console.error('❌ Database Sync Error:', err);
    });

// THIS LINE IS REQUIRED FOR VERCEL
module.exports = app;
