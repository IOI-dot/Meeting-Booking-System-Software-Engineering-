/**
 * Authentication Validators
 * 
 * Validation functions for signup and login requests.
 * All validation errors are collected and returned as an array.
 */

/**
 * Validates the user's full name.
 * - Must not be empty
 * - Must be at least 2 characters
 * 
 * @param {string} fullName 
 * @returns {string|null} Error message or null if valid.
 */
function validateFullName(fullName) {
    if (!fullName || fullName.trim() === '') {
        return 'Full name is required.';
    }

    if (fullName.trim().length < 2) {
        return 'Full name must be at least 2 characters.';
    }

    return null;
}

/**
 * Validates the AUC email format: username@aucegypt.edu
 * - Must not be empty
 * - Must end with @aucegypt.edu
 * - Username part must contain at least one character
 * 
 * @param {string} email 
 * @returns {string|null} Error message or null if valid.
 */
function validateEmail(email) {
    if (!email || email.trim() === '') {
        return 'Email is required.';
    }

    const aucEmailRegex = /^[a-zA-Z0-9._%+-]+@aucegypt\.edu$/i;
    if (!aucEmailRegex.test(email.trim())) {
        return 'Email must be a valid AUC email in the format: username@aucegypt.edu';
    }

    return null;
}

/**
 * Validates the password:
 * - Must not be empty
 * - Must be more than 8 characters
 * 
 * @param {string} password 
 * @returns {string|null} Error message or null if valid.
 */
function validatePassword(password) {
    if (!password || password === '') {
        return 'Password is required.';
    }

    if (password.length <= 8) {
        return 'Password must be more than 8 characters.';
    }

    return null;
}

/**
 * Validates that password and confirmPassword match.
 * 
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {string|null} Error message or null if they match.
 */
function validatePasswordMatch(password, confirmPassword) {
    if (confirmPassword === undefined || confirmPassword === null || confirmPassword === '') {
        return 'Please confirm your password.';
    }

    if (password !== confirmPassword) {
        return 'Passwords do not match.';
    }

    return null;
}

/**
 * Validates the user role.
 * Must be either 'student' or 'ta'.
 * 
 * @param {string} role 
 * @returns {string|null} Error message or null if valid.
 */
function validateRole(role) {
    const allowedRoles = ['student', 'ta'];

    if (!role || role.trim() === '') {
        return 'Role is required. Please select either "student" or "ta".';
    }

    if (!allowedRoles.includes(role.toLowerCase().trim())) {
        return 'Invalid role. Must be either "student" or "ta".';
    }

    return null;
}

/**
 * Runs all signup validations and returns an array of error messages.
 * 
 * @param {Object} body - The request body { fullName, email, password, confirmPassword, role }
 * @returns {string[]} Array of error messages (empty if all valid).
 */
function validateSignup({ fullName, email, password, confirmPassword, role }) {
    const errors = [];

    const nameErr = validateFullName(fullName);
    if (nameErr) errors.push(nameErr);

    const emailErr = validateEmail(email);
    if (emailErr) errors.push(emailErr);

    const pwErr = validatePassword(password);
    if (pwErr) errors.push(pwErr);

    const matchErr = validatePasswordMatch(password, confirmPassword);
    if (matchErr) errors.push(matchErr);

    const roleErr = validateRole(role);
    if (roleErr) errors.push(roleErr);

    return errors;
}

/**
 * Runs login validations and returns an array of error messages.
 * 
 * @param {Object} body - The request body { email, password }
 * @returns {string[]} Array of error messages (empty if all valid).
 */
function validateLogin({ email, password }) {
    const errors = [];

    const emailErr = validateEmail(email);
    if (emailErr) errors.push(emailErr);

    const pwErr = validatePassword(password);
    if (pwErr) errors.push(pwErr);

    return errors;
}

module.exports = {
    validateSignup,
    validateLogin,
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateFullName,
    validateRole
};
