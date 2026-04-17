const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); 
const sequelize = require('../config/database'); 
const { QueryTypes } = require('sequelize');

// JIRA TASK #7: Create Booking in DB
router.post('/', async (req, res) => {
    try {
        const { roomId, userId, startTime, endTime, date } = req.body;

        if (!roomId || !userId || !startTime || !endTime || !date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        const durationRequested = endHour - startHour;

        if (durationRequested > 4 || durationRequested <= 0) {
            return res.status(400).json({ error: "Booking duration must be between 1 and 4 hours." });
        }

        // --- ENFORCE GLOBAL 4-HOUR DAILY LIMIT ---
        const userDailyBookings = await Booking.findAll({
            where: { userID: userId, date: date }
        });

        let hoursUsedToday = 0;
        userDailyBookings.forEach(b => {
             const h1 = parseInt(b.startTime.split(':')[0], 10);
             const h2 = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : (h1 + 1);
             hoursUsedToday += (h2 - h1);
        });

        if (hoursUsedToday + durationRequested > 4) {
             return res.status(400).json({ error: "Daily limit of 4 hours exceeded. You have already booked " + hoursUsedToday + " hours today." });
        }

        // Check for conflicts in this specific room
        const existingBookings = await Booking.findAll({
            where: { roomID: roomId, date: date }
        });

        const hasConflict = existingBookings.some(b => {
            const bStart = parseInt(b.startTime.split(':')[0], 10);
            const bEnd = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : (bStart + 1);
            // Overlap condition: newStart < existingEnd AND newEnd > existingStart
            return startHour < bEnd && endHour > bStart;
        });

        if (hasConflict) {
            return res.status(400).json({ error: "Time slot conflict with an existing booking." });
        }

        // Create the record in PostgreSQL
        const newBooking = await Booking.create({
            roomID: roomId,
            userID: userId,
            startTime, 
            endTime, 
            date,
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
        const userId = parseInt(req.params.userId, 10);
        
        // THIS IS THE SQL QUERY YOU ASKED ABOUT!
        const sqlString = `
            SELECT 
                b.booking_id, 
                b.start_time, 
                b.end_time,
                b.date, 
                b.status, 
                r.room_name, 
                r.technology,
                r.capacity   -- <-- Here is the capacity added!
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = :userId
            ORDER BY b.date ASC, b.start_time ASC
        `;

        const userBookings = await sequelize.query(sqlString, {
            replacements: { userId: userId },
            type: QueryTypes.SELECT
        });
        
        res.status(200).json({ success: true, bookings: userBookings });
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch from PostgreSQL" });
    }
});

// GET Daily Quota limits
router.get('/quota/:userId/:date', async (req, res) => {
    try {
        const { userId, date } = req.params;
        const userDailyBookings = await Booking.findAll({
            where: { userID: parseInt(userId, 10), date: date }
        });

        let usedHours = 0;
        userDailyBookings.forEach(b => {
             const h1 = parseInt(b.startTime.split(':')[0], 10);
             const h2 = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : (h1 + 1);
             usedHours += (h2 - h1);
        });
        
        res.status(200).json({ success: true, usedHours, limit: 4 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch quota" });
    }
});

module.exports = router;
