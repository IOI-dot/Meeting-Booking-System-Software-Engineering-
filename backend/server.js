const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- MOCK DATABASE (Global Variables) ---
// We moved this outside the route so all routes can see and edit it.
let fakeRooms = [
    { id: 1, room_name: "101", capacity: 4, technology: "TV", available_slots: ["09:00", "10:00", "11:00"] },
    { id: 2, room_name: "102", capacity: 10, technology: "Projector", available_slots: ["13:00", "14:00"] }
];

let fakeBookings = []; // This will store our successful reservations

// --- ROUTES ---

// 1. Get all rooms 
app.get('/api/rooms', (req, res) => {
    res.json(fakeRooms);
});

// 2. JIRA TASK #7: Register a specific time slot
app.post('/api/bookings', (req, res) => {
    // The frontend sends us the room ID, the user ID, and the time they want
    const { roomId, userId, timeSlot } = req.body;

    // Find the requested room
    const room = fakeRooms.find(r => r.id === roomId);
    if (!room) {
        return res.status(404).json({ error: "Room not found." });
    }

    // JIRA ACCEPTANCE CRITERIA: "can only select available time slots."
    const slotIndex = room.available_slots.indexOf(timeSlot);
    if (slotIndex === -1) {
        // If the slot isn't in the array, reject the booking
        return res.status(400).json({ error: "Time slot is unavailable or already booked." });
    }

    // JIRA ACCEPTANCE CRITERIA: "slot's status updates immediately"
    // Remove the booked time from the room's available slots
    room.available_slots.splice(slotIndex, 1);

    // Create the official booking record
    const newBooking = {
        id: fakeBookings.length + 1,
        roomId: roomId,
        userId: userId,
        timeSlot: timeSlot,
        status: "Confirmed"
    };
    fakeBookings.push(newBooking);

    // Send back success! (This happens instantly, beating your 2-second requirement)
    res.status(200).json({
        message: "Booking successful!",
        booking: newBooking,
        updatedRoom: room
    });
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`🚀 Server is vibing and running on http://localhost:${PORT}`);
});
