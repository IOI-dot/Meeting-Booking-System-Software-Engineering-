/**
 * Room Routes
 * 
 * POST /api/rooms/search  - Search for rooms by capacity and technologies
 * GET  /api/rooms/technologies - Get the list of available technologies
 */

const express = require('express');
const { validateRoomSearch, ALLOWED_TECHNOLOGIES } = require('../validators/roomValidator');
const Room = require('../models/Room');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * GET /api/rooms/technologies
 * 
 * Returns the list of available technologies that users can filter by.
 */
router.get('/technologies', (req, res) => {
    return res.status(200).json({
        success: true,
        technologies: ALLOWED_TECHNOLOGIES
    });
});

/**
 * POST /api/rooms/search
 * 
 * Request body:
 *   - capacity: integer (1-30, required)
 *   - technologies: string[] (optional, from predefined list)
 * 
 * Returns rooms that:
 *   - Have capacity >= the requested capacity
 *   - Contain ALL of the requested technologies (if any)
 * 
 * Responses:
 *   200 - Matching rooms found (or empty array if none match)
 *   400 - Validation errors
 *   500 - Server error
 */
router.post('/search', async (req, res) => {
    try {
        const { capacity, technologies } = req.body;

        // 1. Validate input
        const errors = validateRoomSearch({ capacity, technologies });
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors
            });
        }

        const requestedCapacity = Number(capacity);

        // 2. Query rooms from the database by capacity
        const whereClause = {
            capacity: { [Op.gte]: requestedCapacity }
        };

        let matchingRooms = await Room.findAll({ where: whereClause });

        // 3. Filter by technologies (if provided — room must have ALL requested techs)
        if (technologies && technologies.length > 0) {
            const requestedTechs = technologies.map(t => t.toLowerCase().trim());
            matchingRooms = matchingRooms.filter(room => {
                const roomTech = (room.technology || '').toLowerCase();
                return requestedTechs.every(tech => roomTech.includes(tech.split(' ')[0]));
            });
        }

        // 4. Return results
        return res.status(200).json({
            success: true,
            message: matchingRooms.length > 0
                ? `Found ${matchingRooms.length} room(s) matching your criteria.`
                : 'No rooms match your criteria.',
            count: matchingRooms.length,
            rooms: matchingRooms
        });

    } catch (error) {
        console.error('Room search error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
            errors: ['Internal server error.']
        });
    }
});

module.exports = router;
