const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const bookingsFilePath = path.join(__dirname, '../data/bookings.json');

// Helper to read data
const getBookings = () => {
    const data = fs.readFileSync(bookingsFilePath, 'utf8');
    return JSON.parse(data);
};

// Helper to save data
const saveBookings = (data) => {
    fs.writeFileSync(bookingsFilePath, JSON.stringify(data, null, 2));
};

// JIRA TASK #7: Create Booking
router.post('/', (req, res) => {
    try {
        const { roomId, userId, timeSlot, date } = req.body;
        let bookings = getBookings();

        const newBooking = {
            id: bookings.length + 1,
            roomId,
            userId,
            timeSlot,
            date: date || "2026-04-15",
            status: "Confirmed"
        };

        bookings.push(newBooking);
        saveBookings(bookings);

        res.status(201).json({ success: true, booking: newBooking });
    } catch (err) {
        res.status(500).json({ error: "Failed to save booking" });
    }
});

// JIRA TASK #9: View My Bookings
router.get('/my-bookings/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const bookings = getBookings();
        
        const userBookings = bookings.filter(b => b.userId === userId);
        
        if (userBookings.length === 0) {
            return res.status(200).json({ message: "No bookings yet.", bookings: [] });
        }

        res.status(200).json({ success: true, bookings: userBookings });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

module.exports = router;