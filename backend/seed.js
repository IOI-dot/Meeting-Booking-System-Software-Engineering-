const sequelize = require('./config/database');
const Room = require('./models/Room');
const Booking = require('./models/Booking');
const User = require('./models/User'); // 1. IMPORTANT: Import User model

const runSeeders = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL.');

        console.log('--- Syncing Database Tables ---');
        // 'alter: true' updates tables to match models without dropping everything
        await sequelize.sync({ force: true }); // Use force: true ONCE to reset the schema
        console.log('--- Seeding Data ---');
        
        // 2. Clear existing data (Order matters: Bookings first, then others)
        await Booking.destroy({ where: {} });
        await Room.destroy({ where: {} });
        await User.destroy({ where: {} });

        // 3. Seed a Test User
        // We need a real user in the DB so the booking has a valid userID
        const testUser = await User.create({
            fullName: 'Test Student',
            email: 'student@aucegypt.edu',
            password: 'password123', // In a real app, hash this first
            role: 'student'
        });

        // 4. Seed Rooms
        const createdRooms = await Room.bulkCreate([
            { room_name: 'SSE 102', capacity: 5, technology: 'Projector, Whiteboard' },
            { room_name: 'HUSS 204', capacity: 12, technology: '4K Display, Video Conf' },
            { room_name: 'Library A', capacity: 2, technology: 'Whiteboard', is_fully_booked: true },
            { room_name: 'Waleed 11', capacity: 25, technology: 'Dual Projectors, Sound System' },
            { room_name: 'SSE 210', capacity: 8, technology: 'Smart TV' }
        ]);

        // 5. THE FIX: Find SSE 102 from the list we just created
        const sseRoom = createdRooms.find(r => r.room_name === 'SSE 102');

        // 6. Seed a booking using dynamic IDs
        await Booking.create({
            userID: testUser.id,   // Use the real ID from the user we just created
            roomID: sseRoom.id,    // Use the real ID from the room we just created
            startTime: "10:00",
            date: new Date().toISOString().split('T')[0], // Today's date
            status: "Confirmed"
        });
        
        console.log('--- All Data Seeded Successfully ---');
        process.exit();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

runSeeders();
