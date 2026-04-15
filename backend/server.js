const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Auth routes (signup & login)
app.use('/api/auth', authRoutes);

app.get('/api/rooms', (req, res) => {
    const fakeRooms = [
        { id: 1, room_name: "101", capacity: 4, technology: "TV" },
        { id: 2, room_name: "102", capacity: 10, technology: "Projector" }
    ];
    res.json(fakeRooms);
});

app.listen(PORT, () => {
    console.log(`🚀 Server is vibing and running on http://localhost:${PORT}`);
});