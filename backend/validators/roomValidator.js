/**
 * Room Search Validators
 * 
 * Validation functions for room search/filter requests.
 */

const ALLOWED_TECHNOLOGIES = ['4k display', 'whiteboards', 'projector', 'projectors', 'video conf.'];

/**
 * Validates the desired room capacity.
 * - Must not be empty
 * - Must be a valid positive integer
 * - Must be between 1 and 30 (inclusive)
 * 
 * @param {*} capacity - The capacity value from the request.
 * @returns {string|null} Error message or null if valid.
 */
function validateCapacity(capacity) {
    if (capacity === undefined || capacity === null || capacity === '') {
        return 'Room capacity is required.';
    }

    const num = Number(capacity);

    if (!Number.isInteger(num)) {
        return 'Room capacity must be a valid integer.';
    }

    if (num < 1 || num > 30) {
        return 'Room capacity must be between 1 and 30.';
    }

    return null;
}

/**
 * Validates the selected technologies.
 * - Must be an array (can be empty — user may not need any specific technology)
 * - Each value must be from the predefined ALLOWED_TECHNOLOGIES list
 * 
 * @param {*} technologies - The technologies array from the request.
 * @returns {string|null} Error message or null if valid.
 */
function validateTechnologies(technologies) {
    if (technologies === undefined || technologies === null) {
        return null; // Technologies selection is optional
    }

    if (!Array.isArray(technologies)) {
        return 'Technologies must be an array.';
    }

    if (ALLOWED_TECHNOLOGIES.length === 0) {
        // If the list hasn't been configured yet, skip validation
        return null;
    }

    const invalid = technologies.filter(
        t => !ALLOWED_TECHNOLOGIES.includes(t.toLowerCase().trim())
    );

    if (invalid.length > 0) {
        return `Invalid technology selection: ${invalid.join(', ')}. Allowed values: ${ALLOWED_TECHNOLOGIES.join(', ')}`;
    }

    return null;
}

/**
 * Runs all room search validations.
 * 
 * @param {Object} body - The request body { capacity, technologies }
 * @returns {string[]} Array of error messages (empty if all valid).
 */
function validateRoomSearch({ capacity, technologies }) {
    const errors = [];

    const capErr = validateCapacity(capacity);
    if (capErr) errors.push(capErr);

    const techErr = validateTechnologies(technologies);
    if (techErr) errors.push(techErr);

    return errors;
}

module.exports = {
    validateCapacity,
    validateTechnologies,
    validateRoomSearch,
    ALLOWED_TECHNOLOGIES
};
