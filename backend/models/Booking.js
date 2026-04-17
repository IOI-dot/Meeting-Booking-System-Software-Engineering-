// models/Booking.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    bookingID: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true,
        field: 'booking_id' // Forces the DB column to be lowercase
    },
    userID: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        field: 'user_id'
    },
    roomID: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        field: 'room_id'
    },
    startTime: { 
        type: DataTypes.STRING, 
        allowNull: false,
        field: 'start_time'
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Confirmed' }
}, {
    tableName: 'bookings',
    timestamps: false
});

module.exports = Booking;
