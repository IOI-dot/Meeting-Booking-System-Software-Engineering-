const express = require('express');
const router = express.Router();
const sequelize = require('../config/database'); 
const { QueryTypes } = require('sequelize');

router.get('/', async (req, res) => {
    try {
        const { capacity, hideBooked } = req.query;

        // Use lowercase names that match the 'field' definitions in your models
        let sqlString = `
            SELECT 
                r.id, 
                r.room_name, 
                r.capacity, 
                r.technology, 
                r.available_time_slots, 
                r.is_fully_booked,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'start_hour', b.start_time, 
                            'end_hour', b.end_time,
                            'status', b.status
                        )
                    ) FILTER (WHERE b.booking_id IS NOT NULL), '[]'
                ) as bookings
            FROM rooms r
            LEFT JOIN bookings b ON r.id = b.room_id
            WHERE 1=1
        `;
        
        const replacements = {};

        if (capacity) {
            sqlString += ` AND r.capacity >= :capacity`;
            replacements.capacity = parseInt(capacity, 10);
        }

        if (hideBooked === 'true') {
            sqlString += ` AND r.is_fully_booked = false`;
        }

        sqlString += ` GROUP BY r.id, r.room_name, r.capacity, r.technology, r.available_time_slots, r.is_fully_booked`;

        const rooms = await sequelize.query(sqlString, {
            replacements: replacements,
            type: QueryTypes.SELECT
        });

        res.json(rooms);

    } catch (error) {
        console.error("Database error fetching timeline:", error);
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
});

module.exports = router;
