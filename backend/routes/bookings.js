const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); // We will create this model next

// JIRA TASK #7: Create Booking in DB
router.post('/', async (req, res) => {
    try {
        const { roomId, userId, timeSlot, date } = req.body;

        // Create the record in PostgreSQL
        const newBooking = await Booking.create({
            roomID: roomId,
            userID: userId,
            startTime: timeSlot, // Matches Milestone 2 naming
            endTime: "1 hour later", // placeholder logic
            date: date || "2026-04-15",
            status: "Confirmed"
        });

        res.status(201).json({ success: true, booking: newBooking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save to PostgreSQL" });
    }
});

// JIRA TASK #9: View My Bookings from DB
router.get('/my-bookings/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        // Find all in DB where userID matches
        const userBookings = await Booking.findAll({
            where: { userID: userId },
            order: [['startTime', 'ASC']] // AC: Sorted chronologically
        });
        
        if (userBookings.length === 0) {
            return res.status(200).json({ message: "No bookings yet.", bookings: [] });
        }

        res.status(200).json({ success: true, bookings: userBookings });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch from PostgreSQL" });
    }
});

module.exports = router;
