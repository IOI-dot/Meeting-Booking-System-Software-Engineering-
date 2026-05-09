const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const sequelize = require('../config/database');
const { QueryTypes, Op } = require('sequelize');

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

        const userDailyBookings = await Booking.findAll({
            where: { userID: userId, date: date, status: 'Confirmed' }
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

        const existingBookings = await Booking.findAll({
            where: { roomID: roomId, date: date, status: 'Confirmed' }
        });

        const hasConflict = existingBookings.some(b => {
            const bStart = parseInt(b.startTime.split(':')[0], 10);
            const bEnd = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : (bStart + 1);
            return startHour < bEnd && endHour > bStart;
        });

        if (hasConflict) {
            return res.status(400).json({ error: "Time slot conflict with an existing booking." });
        }

        const userOverlap = userDailyBookings.some(b => {
            const bStart = parseInt(b.startTime.split(':')[0], 10);
            const bEnd = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : (bStart + 1);
            return startHour < bEnd && endHour > bStart;
        });

        if (userOverlap) {
            return res.status(400).json({ error: "You already have a booking during this time slot. You cannot book two rooms at the same time." });
        }

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

        const sqlString = `
            SELECT 
                b.booking_id,
                b.start_time,
                b.end_time,
                b.date,
                b.status,
                r.id AS room_id,
                r.room_name,
                r.technology,
                r.capacity
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = :userId
            ORDER BY b.booking_id DESC
        `;

        const userBookings = await sequelize.query(sqlString, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        res.status(200).json({ success: true, bookings: userBookings });
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch from PostgreSQL" });
    }
});

// GET Daily Quota
router.get('/quota/:userId/:date', async (req, res) => {
    try {
        const { userId, date } = req.params;
        const userDailyBookings = await Booking.findAll({
            where: { userID: parseInt(userId, 10), date: date, status: 'Confirmed' }
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

// JIRA TASK #12: Soft-Cancel Booking
router.patch('/:bookingId/cancel', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);
        const { userId } = req.body;

        if (!bookingId || isNaN(bookingId)) {
            return res.status(400).json({ error: "Invalid booking ID." });
        }

        
        const booking = await Booking.findByPk(bookingId);
        if (!booking) return res.status(404).json({ error: "Booking not found." });

        if (userId && booking.userID !== parseInt(userId, 10)) {
            return res.status(403).json({ error: "You can only cancel your own bookings." });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({ error: "This booking has already been cancelled." });
        }


        
        booking.status = 'Cancelled';
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully. The time slot is now available for others.",
            booking: {
                id: booking.bookingID,
                roomID: booking.roomID,
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status
            }
        });
    } catch (err) {
        console.error("Cancel booking error:", err);
        res.status(500).json({ error: "Failed to cancel booking." });
    }
});

// JIRA TASK #10: Edit Booking Time (with row-level locking via transaction)
router.patch('/:bookingId/edit', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const bookingId = parseInt(req.params.bookingId, 10);
        const { userId, roomId, startTime, endTime, date } = req.body;

        if (!bookingId || isNaN(bookingId)) {
            await t.rollback();
            return res.status(400).json({ error: "Invalid booking ID." });
        }

        if (!userId || !roomId || !startTime || !endTime || !date) {
            await t.rollback();
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Row-level lock on the booking (NFR: 0% double-booking)
        const booking = await Booking.findByPk(bookingId, { transaction: t, lock: t.LOCK.UPDATE });

        if (!booking) {
            await t.rollback();
            return res.status(404).json({ error: "Booking not found." });
        }

        if (booking.userID !== parseInt(userId, 10)) {
            await t.rollback();
            return res.status(403).json({ error: "You can only edit your own bookings." });
        }

        if (booking.status === 'Cancelled') {
            await t.rollback();
            return res.status(400).json({ error: "Cancelled bookings cannot be edited." });
        }

        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);
        const durationRequested = endHour - startHour;

        if (durationRequested > 4 || durationRequested <= 0) {
            await t.rollback();
            return res.status(400).json({ error: "Booking duration must be between 1 and 4 hours." });
        }

        // Daily quota check (excluding this booking)
        const userDailyBookings = await Booking.findAll({
            where: { userID: parseInt(userId, 10), date, status: 'Confirmed' },
            transaction: t
        });

        const otherBookings = userDailyBookings.filter(b => b.bookingID !== bookingId);

        let hoursUsedToday = 0;
        otherBookings.forEach(b => {
            const h1 = parseInt(b.startTime.split(':')[0], 10);
            const h2 = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : h1 + 1;
            hoursUsedToday += h2 - h1;
        });

        if (hoursUsedToday + durationRequested > 4) {
            await t.rollback();
            return res.status(400).json({ error: "Daily limit of 4 hours exceeded. You have already booked " + hoursUsedToday + " hours today." });
        }

        // Room conflict check (excluding this booking)
        const existingRoomBookings = await Booking.findAll({
            where: { roomID: parseInt(roomId, 10), date, status: 'Confirmed' },
            transaction: t
        });

        const hasRoomConflict = existingRoomBookings.some(b => {
            if (b.bookingID === bookingId) return false;
            const bStart = parseInt(b.startTime.split(':')[0], 10);
            const bEnd = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : bStart + 1;
            return startHour < bEnd && endHour > bStart;
        });

        if (hasRoomConflict) {
            await t.rollback();
            return res.status(400).json({ error: "Time slot conflict with an existing booking." });
        }

        // Cross-room overlap check for same user
        const userOverlap = otherBookings.some(b => {
            const bStart = parseInt(b.startTime.split(':')[0], 10);
            const bEnd = b.endTime ? parseInt(b.endTime.split(':')[0], 10) : bStart + 1;
            return startHour < bEnd && endHour > bStart;
        });

        if (userOverlap) {
            await t.rollback();
            return res.status(400).json({ error: "You already have a booking during this time slot." });
        }

        booking.roomID = parseInt(roomId, 10);
        booking.startTime = startTime;
        booking.endTime = endTime;
        booking.date = date;
        await booking.save({ transaction: t });
        await t.commit();

        res.status(200).json({ success: true, message: "Booking updated successfully.", booking });
    } catch (err) {
        await t.rollback();
        console.error("Edit booking error:", err);
        res.status(500).json({ error: "Failed to edit booking." });
    }
});

// JIRA TASK #11: Get Alternative Rooms
router.get('/:bookingId/alternatives', async (req, res) => {
    try {
        const currentBooking = await Booking.findByPk(req.params.bookingId);
        if (!currentBooking) return res.status(404).json({ error: "Booking not found" });

        const currentRoom = await Room.findByPk(currentBooking.roomID);
        const similarRooms = await Room.findAll({
            where: {
                id: { [Op.ne]: currentRoom.id },
                capacity: { [Op.gte]: currentRoom.capacity }
            }
        });

        const availableRooms = [];
        for (const room of similarRooms) {
            const conflict = await Booking.findOne({
                where: {
                    roomID: room.id,
                    date: currentBooking.date,
                    startTime: currentBooking.startTime,
                    status: 'Confirmed'
                }
            });
            if (!conflict) availableRooms.push(room);
        }

        res.json({ success: true, rooms: availableRooms });
    } catch (err) {
        res.status(500).json({ error: "Alternatives error" });
    }
});

// JIRA TASK #11: ACID Room Swap
router.patch('/:bookingId/change-room', async (req, res) => {
    const { newRoomId } = req.body;
    const t = await sequelize.transaction();
    try {
        const booking = await Booking.findByPk(req.params.bookingId, { transaction: t, lock: t.LOCK.UPDATE });

        if (!booking) {
            await t.rollback();
            return res.status(404).json({ error: "Booking not found" });
        }

        const conflict = await Booking.findOne({
            where: {
                roomID: newRoomId,
                date: booking.date,
                startTime: booking.startTime,
                status: 'Confirmed'
            },
            transaction: t
        });

        if (conflict) {
            await t.rollback();
            return res.status(409).json({ error: "Room is already taken at this time." });
        }

        booking.roomID = newRoomId;
        await booking.save({ transaction: t });
        await t.commit();

        res.json({ success: true, message: "Room changed successfully!" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: "Room swap failed." });
    }
});

module.exports = router;
