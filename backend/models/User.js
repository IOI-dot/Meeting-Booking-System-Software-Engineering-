/**
 * User Model
 * 
 * Handles reading and writing user data to a JSON file.
 * In production, this would be replaced with a proper database (e.g., MongoDB, PostgreSQL).
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json');

/**
 * Ensures the data directory and users.json file exist.
 */
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Returns all users from the JSON file.
 * @returns {Array} Array of user objects.
 */
function getAllUsers() {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
}

/**
 * Finds a user by their email address.
 * @param {string} email - The email to search for.
 * @returns {Object|undefined} The user object if found, otherwise undefined.
 */
function findByEmail(email) {
    const users = getAllUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Creates a new user and saves it to the JSON file.
 * @param {Object} userData - The user data ({ email, password, role }).
 * @returns {Object} The newly created user (without password).
 */
function createUser({ email, password, role }) {
    const users = getAllUsers();

    const newUser = {
        id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
        email,
        password, // Already hashed before being passed here
        role,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));

    // Return user without password
    const { password: _, ...safeUser } = newUser;
    return safeUser;
}

module.exports = {
    getAllUsers,
    findByEmail,
    createUser
};
