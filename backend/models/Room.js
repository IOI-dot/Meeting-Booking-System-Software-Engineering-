const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    room_name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    capacity: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    technology: { 
        type: DataTypes.STRING, 
        defaultValue: 'Standard Whiteboard' 
    },
    available_time_slots: { 
        type: DataTypes.STRING, 
        defaultValue: '09:00 - 17:00' 
    },
    is_fully_booked: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    }
}, {
    tableName: 'rooms',
    timestamps: false
});

module.exports = Room;
