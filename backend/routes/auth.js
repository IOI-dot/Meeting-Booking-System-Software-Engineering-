/**
 * Authentication Routes
 * 
 * POST /api/auth/signup  - Register a new user
 * POST /api/auth/login   - Login an existing user
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validateSignup, validateLogin } = require('../validators/authValidator');

const router = express.Router();

/**
 * POST /api/auth/signup
 * 
 * Request body:
 *   - email: string (must be username@aucegypt.edu)
 *   - password: string (must be more than 8 characters)
 *   - confirmPassword: string (must match password)
 *   - role: string ("student" or "ta")
 * 
 * Responses:
 *   201 - User created successfully
 *   400 - Validation errors
 *   409 - Email already registered
 *   500 - Server error
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, confirmPassword, role } = req.body;

        // 1. Run all validations
        const errors = validateSignup({ email, password, confirmPassword, role });
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors
            });
        }

        // 2. Check if user already exists
        const existingUser = User.findByEmail(email.trim());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
                errors: ['An account with this email already exists.']
            });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the user
        const newUser = User.createUser({
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role.toLowerCase().trim()
        });

        // 5. Return success
        return res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: newUser
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
            errors: ['Internal server error.']
        });
    }
});

/**
 * POST /api/auth/login
 * 
 * Request body:
 *   - email: string (must be username@aucegypt.edu)
 *   - password: string
 * 
 * Responses:
 *   200 - Login successful
 *   400 - Validation errors
 *   401 - Invalid credentials
 *   500 - Server error
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Run login validations
        const errors = validateLogin({ email, password });
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors
            });
        }

        // 2. Find the user by email
        const user = User.findByEmail(email.trim());
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
                errors: ['Invalid email or password.']
            });
        }

        // 3. Compare password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
                errors: ['Invalid email or password.']
            });
        }

        // 4. Return success (without password)
        const { password: _, ...safeUser } = user;
        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: safeUser
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
            errors: ['Internal server error.']
        });
    }
});

module.exports = router;
