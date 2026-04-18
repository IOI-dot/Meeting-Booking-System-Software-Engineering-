require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const timelineRoutes = require('./routes/timeline');

const app = express();

// 🔴 CHANGE THIS (we’ll fix CORS later after frontend deploy)
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/timeline', timelineRoutes);

// 🔴 IMPORTANT: REMOVE app.listen from production
if (process.env.NODE_ENV !== 'production') {
    sequelize.sync({ alter: true })
        .then(() => {
            console.log('DB connected locally');
            app.listen(3000, () => {
                console.log('Running locally');
            });
        })
        .catch(err => console.error(err));
}

// 🔴 REQUIRED FOR VERCEL
module.exports = app;