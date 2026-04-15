/**
 * Room Routes
 * 
 * POST /api/rooms/search  - Search for rooms by capacity and technologies
 * GET  /api/rooms/technologies - Get the list of available technologies
 */

const express = require('express');
const { validateRoomSearch, ALLOWED_TECHNOLOGIES } = require('../validators/roomValidator');

const router = express.Router();

// ─── Fake room data (will be replaced with DB later) ────────────────────────
const rooms = [
    { id: 1, name: "Room 101", capacity: 4,  technologies: ["projector", "whiteboards"] },
    { id: 2, name: "Room 102", capacity: 10, technologies: ["4k display", "whiteboards", "video conf."] },
    { id: 3, name: "Room 103", capacity: 6,  technologies: ["projector", "video conf."] },
    { id: 4, name: "Room 201", capacity: 20, technologies: ["projectors", "whiteboards", "4k display"] },
    { id: 5, name: "Room 202", capacity: 15, technologies: ["4k display", "projector"] },
    { id: 6, name: "Room 301", capacity: 30, technologies: ["projectors", "4k display", "video conf.", "whiteboards"] },
    { id: 7, name: "Room 302", capacity: 8,  technologies: ["whiteboards"] },
    { id: 8, name: "Room 303", capacity: 2,  technologies: ["4k display"] },
];

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
router.post('/search', (req, res) => {
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

        // 2. Filter rooms by capacity (room capacity >= requested)
        let matchingRooms = rooms.filter(room => room.capacity >= requestedCapacity);

        // 3. Filter by technologies (if provided — room must have ALL requested techs)
        if (technologies && technologies.length > 0) {
            const requestedTechs = technologies.map(t => t.toLowerCase().trim());
            matchingRooms = matchingRooms.filter(room => {
                const roomTechs = room.technologies.map(t => t.toLowerCase());
                return requestedTechs.every(tech => roomTechs.includes(tech));
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
