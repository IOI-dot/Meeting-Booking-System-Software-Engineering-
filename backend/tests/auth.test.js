/**
 * Auth API Test Cases
 * 
 * Run with: node tests/auth.test.js
 * Make sure the server is running first (node server.js)
 */

const API = 'http://localhost:3000/api/auth';

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (err) {
        failed++;
        console.log(`  ❌ ${name}`);
        console.log(`     → ${err.message}`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function post(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, data };
}

// ═══════════════════════════════════════════════════════════════
// SIGNUP TESTS
// ═══════════════════════════════════════════════════════════════

async function runSignupTests() {
    console.log('\n📝 SIGNUP TESTS');
    console.log('─'.repeat(50));

    // --- Empty Fields ---

    await test('Empty email returns error', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: '', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Email is required.'), 'Missing email error');
    });

    await test('Empty password returns error', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'test@aucegypt.edu', password: '', confirmPassword: '', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Password is required.'), 'Missing password error');
    });

    await test('Empty confirm password returns error', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'test@aucegypt.edu', password: 'Test12345!', confirmPassword: '', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Please confirm your password.'), 'Missing confirm password error');
    });

    await test('Empty role returns error', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'test@aucegypt.edu', password: 'Test12345!', confirmPassword: 'Test12345!', role: ''
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('Role is required')), 'Missing role error');
    });

    await test('All empty fields returns all errors', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: '', email: '', password: '', confirmPassword: '', role: ''
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.length === 5, `Expected 5 errors, got ${data.errors.length}`);
    });

    // --- Invalid Email Format ---

    await test('Non-AUC email (gmail) is rejected', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'user@gmail.com', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('username@aucegypt.edu')), 'Missing email format error');
    });

    await test('Email without domain is rejected', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'justausername', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('username@aucegypt.edu')), 'Missing email format error');
    });

    await test('Email with wrong AUC domain is rejected', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'user@auc.edu', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('username@aucegypt.edu')), 'Missing email format error');
    });

    // --- Password Validation ---

    await test('Password with 8 or fewer characters is rejected', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'test@aucegypt.edu', password: '12345678', confirmPassword: '12345678', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('more than 8')), 'Missing password length error');
    });

    await test('Mismatched passwords are rejected', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'test@aucegypt.edu', password: 'Test12345!', confirmPassword: 'Different1!', role: 'student'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Passwords do not match.'), 'Missing password match error');
    });

    // --- Invalid Role ---

    await test('Invalid role (admin) is rejected', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'test@aucegypt.edu', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'admin'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('student') && e.includes('ta')), 'Missing role error');
    });

    // --- Successful Signup ---

    await test('Valid signup (student) succeeds with 201', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'testuser1@aucegypt.edu', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'student'
        });
        assert(status === 201, `Expected 201, got ${status}`);
        assert(data.success === true, 'Expected success to be true');
        assert(data.user.email === 'testuser1@aucegypt.edu', 'Email mismatch');
        assert(data.user.role === 'student', 'Role mismatch');
        assert(!data.user.password, 'Password should NOT be returned');
    });

    await test('Valid signup (TA) succeeds with 201', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'Jane Doe', email: 'testuser2@aucegypt.edu', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'ta'
        });
        assert(status === 201, `Expected 201, got ${status}`);
        assert(data.user.role === 'ta', 'Role should be ta');
    });

    // --- Duplicate Email ---

    await test('Duplicate email returns 409', async () => {
        const { status, data } = await post(`${API}/signup`, {
            fullName: 'John Doe', email: 'testuser1@aucegypt.edu', password: 'Test12345!', confirmPassword: 'Test12345!', role: 'student'
        });
        assert(status === 409, `Expected 409, got ${status}`);
        assert(data.errors.some(e => e.includes('already exists')), 'Missing duplicate error');
    });
}

// ═══════════════════════════════════════════════════════════════
// LOGIN TESTS
// ═══════════════════════════════════════════════════════════════

async function runLoginTests() {
    console.log('\n🔐 LOGIN TESTS');
    console.log('─'.repeat(50));

    // --- Empty Fields ---

    await test('Empty email returns error', async () => {
        const { status, data } = await post(`${API}/login`, {
            email: '', password: 'Test12345!'
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Email is required.'), 'Missing email error');
    });

    await test('Empty password returns error', async () => {
        const { status, data } = await post(`${API}/login`, {
            email: 'test@aucegypt.edu', password: ''
        });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Password is required.'), 'Missing password error');
    });

    // --- Invalid Credentials ---

    await test('Non-existent email returns 401', async () => {
        const { status, data } = await post(`${API}/login`, {
            email: 'nobody@aucegypt.edu', password: 'Test12345!'
        });
        assert(status === 401, `Expected 401, got ${status}`);
        assert(data.errors.some(e => e.includes('Invalid email or password')), 'Missing invalid creds error');
    });

    await test('Wrong password returns 401', async () => {
        const { status, data } = await post(`${API}/login`, {
            email: 'testuser1@aucegypt.edu', password: 'WrongPass123!'
        });
        assert(status === 401, `Expected 401, got ${status}`);
        assert(data.errors.some(e => e.includes('Invalid email or password')), 'Missing invalid creds error');
    });

    // --- Successful Login ---

    await test('Correct credentials return 200 with user data', async () => {
        const { status, data } = await post(`${API}/login`, {
            email: 'testuser1@aucegypt.edu', password: 'Test12345!'
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.success === true, 'Expected success');
        assert(data.user.email === 'testuser1@aucegypt.edu', 'Email mismatch');
        assert(data.user.role === 'student', 'Role mismatch');
        assert(!data.user.password, 'Password should NOT be returned');
    });

    await test('Login is case-insensitive for email', async () => {
        const { status, data } = await post(`${API}/login`, {
            email: 'TestUser1@AUCegypt.EDU', password: 'Test12345!'
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.success === true, 'Expected success');
    });
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL
// ═══════════════════════════════════════════════════════════════

async function main() {
    console.log('🧪 Running Auth API Tests...');
    console.log('═'.repeat(50));

    await runSignupTests();
    await runLoginTests();

    console.log('\n' + '═'.repeat(50));
    console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═'.repeat(50));

    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
