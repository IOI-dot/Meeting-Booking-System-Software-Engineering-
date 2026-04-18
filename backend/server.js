require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// Import modular routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const timelineRoutes = require('./routes/timeline'); // Added from friend's push

const app = express();
const PORT = process.env.PORT || 3000;
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

app.use('/api/timeline', timelineRoutes); // Added from friend's push

// Sync Database and Start
sequelize.sync()
    })
    .catch(err => {
        console.error('❌ Database Sync Error:', err);
    });
