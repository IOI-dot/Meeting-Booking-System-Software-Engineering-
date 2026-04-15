const express = require('express');
const cors = require('cors');

// Import all route modules
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- CONNECT ROUTES ---
app.use('/api/auth', authRoutes);         // Radwa's Login/Signup
app.use('/api/rooms', roomRoutes);        // Radwa's Search
app.use('/api/bookings', bookingRoutes);  // Omar's Tasks 7 & 9

app.listen(PORT, () => {
    console.log(`🚀 Full Modular Server running on http://localhost:${PORT}`);
});
