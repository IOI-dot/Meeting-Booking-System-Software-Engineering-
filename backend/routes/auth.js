const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // The new Sequelize model
const { validateSignup, validateLogin } = require('../validators/authValidator');

const router = express.Router();

// --- SIGNUP ---
router.post('/signup', async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, role } = req.body;

        // 1. Validation (Keep Basmala's logic)
        const errors = validateSignup({ fullName, email, password, confirmPassword, role });
        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        // 2. Check if user exists using Sequelize
        const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already exists.' });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create in PostgreSQL
        const newUser = await User.create({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role.toLowerCase().trim()
        });

        // 5. Success
        return res.status(201).json({
            success: true,
            message: 'Account created in PostgreSQL!',
            user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Database error during signup' });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user in PostgreSQL
        const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: { id: user.id, fullName: user.fullName, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error during login' });
    }
});

module.exports = router;
