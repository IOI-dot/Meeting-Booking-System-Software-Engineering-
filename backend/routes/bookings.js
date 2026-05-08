const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * POST /api/bookings
 */
router.post('/', async (req, res) => {
    try {
        const { roomId, userId, startTime, endTime, date } = req.body;
        const conflict = await Booking.findOne({
            where: { roomID: roomId, date, startTime, status: 'Confirmed' }
        });
        if (conflict) return res.status(409).json({ error: "Room already booked." });

        const newBooking = await Booking.create({
            roomID: roomId, userID: userId, startTime, endTime, date, status: 'Confirmed'
        });
        return res.status(201).json(newBooking);
    } catch (err) {
        return res.status(500).json({ error: "Failed to create booking." });
    }
});

/**
 * GET /api/bookings/my-bookings/:userId
 * FIX: Joins with Room to get Capacity and Tech data + safer ID mapping
 */
router.get('/my-bookings/:userId', async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { userID: req.params.userId },
            include: [{
                model: Room,
                attributes: ['room_name', 'capacity', 'technology']
            }],
            order: [['date', 'ASC'], ['startTime', 'ASC']]
        });

        const formattedBookings = bookings.map(b => {
            const plain = b.get({ plain: true });
            return {
                ...plain,
                // Ensure the frontend always sees 'bookingID' as the main ID
                bookingID: plain.id || plain.bookingID || plain.booking_id, 
                capacity: plain.Room ? plain.Room.capacity : 'N/A',
                technology: plain.Room ? plain.Room.technology : 'N/A',
                room_name: plain.Room ? plain.Room.room_name : 'Unknown'
            };
        });

        return res.status(200).json({ success: true, bookings: formattedBookings });
    } catch (err) {
        console.error("Join Error:", err);
        return res.status(500).json({ error: "Failed to fetch bookings with room details." });
    }
});

/**
 * DELETE /api/bookings/:id
 * FIX: Solves the "Invalid Booking ID" error on cancellation
 */
router.delete('/:id', async (req, res) => {
    try {
        // Try deleting by 'id' OR 'bookingID' to be safe
        const result = await Booking.destroy({ 
            where: { 
                [Op.or]: [
                    { id: req.params.id },
                    { bookingID: req.params.id }
                ]
            } 
        });

        if (result) {
            res.json({ success: true, message: "Booking cancelled" });
        } else {
            res.status(404).json({ error: "Booking not found in database" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during cancellation" });
    }
});

/**
 * GET /api/bookings/:bookingId/alternatives (Story 7)
 */
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

/**
 * PUT /api/bookings/:bookingId/change-room (Story 11 - ACID)
 */
router.put('/:bookingId/change-room', async (req, res) => {
    const { newRoomId } = req.body;
    const t = await sequelize.transaction();
    try {
        const booking = await Booking.findByPk(req.params.bookingId, { transaction: t, lock: t.LOCK.UPDATE });
        const conflict = await Booking.findOne({
            where: { roomID: newRoomId, date: booking.date, startTime: booking.startTime, status: 'Confirmed' },
            transaction: t
        });
        if (conflict) {
            await t.rollback();
            return res.status(409).json({ error: "Room taken" });
        }
        booking.roomID = newRoomId;
        await booking.save({ transaction: t });
        await t.commit();
        res.json({ success: true, message: "Changed!" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: "Swap failed" });
    }
});

module.exports = router;