const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Auth routes (signup & login)
app.use('/api/auth', authRoutes);

// Room routes (search & technologies)
app.use('/api/rooms', roomRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server is vibing and running on http://localhost:${PORT}`);
});