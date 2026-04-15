const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    user: 'postgres',         
    host: 'localhost',
    database: 'booking_db',   
    password: 'password',     // Update this to your real password!
    port: 5432,               
});

app.get('/api/rooms', async (req, res) => {
    try {
        const { capacity, hideBooked } = req.query;

        // The updated SQL query that grabs rooms AND their bookings
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
                            'start_hour', b.start_hour, 
                            'end_hour', b.end_hour, 
                            'is_private', b.is_private
                        )
                    ) FILTER (WHERE b.id IS NOT NULL), '[]'
                ) as bookings
            FROM rooms r
            LEFT JOIN bookings b ON r.id = b.room_id
            WHERE 1=1
        `;
        const queryValues = [];
        let valueIndex = 1;

        if (capacity) {
            sqlString += ` AND r.capacity >= $${valueIndex}`;
            queryValues.push(parseInt(capacity, 10));
            valueIndex++; 
        }

        if (hideBooked === 'true') {
            sqlString += ` AND r.is_fully_booked = false`;
        }

        sqlString += ` GROUP BY r.id`;

        const result = await pool.query(sqlString, queryValues);
        res.json(result.rows);

    } catch (error) {
        console.error("Database error fetching rooms:", error);
        res.status(500).json({ message: "Failed to fetch rooms from the database" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is vibing and running on http://localhost:${PORT}`);
});