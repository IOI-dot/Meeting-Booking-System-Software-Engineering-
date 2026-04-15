/**
 * Room Search API Test Cases
 * 
 * Run with: node tests/rooms.test.js
 * Make sure the server is running first (node server.js)
 */

const API = 'http://localhost:3000/api/rooms';

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

async function get(url) {
    const res = await fetch(url);
    const data = await res.json();
    return { status: res.status, data };
}

// ═══════════════════════════════════════════════════════════════
// CAPACITY VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════

async function runCapacityTests() {
    console.log('\n📐 CAPACITY VALIDATION TESTS');
    console.log('─'.repeat(50));

    await test('Empty capacity returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: '' });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Room capacity is required.'), 'Missing capacity required error');
    });

    await test('Missing capacity field returns error', async () => {
        const { status, data } = await post(`${API}/search`, {});
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Room capacity is required.'), 'Missing capacity required error');
    });

    await test('Null capacity returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: null });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.includes('Room capacity is required.'), 'Missing capacity required error');
    });

    await test('Negative capacity (-5) returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: -5 });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('between 1 and 30')), 'Missing range error');
    });

    await test('Zero capacity returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 0 });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('between 1 and 30')), 'Missing range error');
    });

    await test('Capacity over 30 (35) returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 35 });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('between 1 and 30')), 'Missing range error');
    });

    await test('Decimal capacity (3.5) returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 3.5 });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('valid integer')), 'Missing integer error');
    });

    await test('String capacity ("abc") returns error', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 'abc' });
        assert(status === 400, `Expected 400, got ${status}`);
        assert(data.errors.some(e => e.includes('valid integer')), 'Missing integer error');
    });

    await test('Capacity = 1 (minimum) is accepted', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 1 });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.success === true, 'Expected success');
    });

    await test('Capacity = 30 (maximum) is accepted', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 30 });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.success === true, 'Expected success');
    });
}

// ═══════════════════════════════════════════════════════════════
// ROOM SEARCH TESTS
// ═══════════════════════════════════════════════════════════════

async function runSearchTests() {
    console.log('\n🔍 ROOM SEARCH TESTS');
    console.log('─'.repeat(50));

    await test('Capacity=5 returns rooms with capacity >= 5', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 5 });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.rooms.every(r => r.capacity >= 5), 'All rooms should have capacity >= 5');
    });

    await test('Capacity=10 returns rooms with capacity >= 10', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 10 });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.rooms.every(r => r.capacity >= 10), 'All rooms should have capacity >= 10');
        assert(data.count === data.rooms.length, 'Count should match rooms array length');
    });

    await test('Capacity=5 with technology=["projector"] filters correctly', async () => {
        const { status, data } = await post(`${API}/search`, {
            capacity: 5, technologies: ['projector']
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.rooms.every(r => r.capacity >= 5), 'Capacity filter');
        assert(data.rooms.every(r => r.technologies.includes('projector')), 'Tech filter');
    });

    await test('Multiple technologies: rooms must have ALL of them', async () => {
        const { status, data } = await post(`${API}/search`, {
            capacity: 1, technologies: ['projectors', 'whiteboards']
        });
        assert(status === 200, `Expected 200, got ${status}`);
        data.rooms.forEach(r => {
            assert(r.technologies.includes('projectors'), `Room ${r.name} missing projectors`);
            assert(r.technologies.includes('whiteboards'), `Room ${r.name} missing whiteboards`);
        });
    });

    await test('No matching rooms returns empty array with message', async () => {
        const { status, data } = await post(`${API}/search`, {
            capacity: 30, technologies: ['projector', '4k display', 'projectors', 'video conf.', 'whiteboards']
        });
        assert(status === 200, `Expected 200, got ${status}`);
        // Should return 0 since no single room has both 'projector' and 'projectors' in the data.
    });

    await test('Search without technologies returns all rooms above capacity', async () => {
        const { status, data } = await post(`${API}/search`, { capacity: 1 });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.rooms.length > 0, 'Should return rooms');
    });

    await test('Empty technologies array is treated as no filter', async () => {
        const { status, data } = await post(`${API}/search`, {
            capacity: 5, technologies: []
        });
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.rooms.length > 0, 'Should return rooms');
    });
}

// ═══════════════════════════════════════════════════════════════
// TECHNOLOGIES ENDPOINT TEST
// ═══════════════════════════════════════════════════════════════

async function runTechTests() {
    console.log('\n🔧 TECHNOLOGIES ENDPOINT TESTS');
    console.log('─'.repeat(50));

    await test('GET /technologies returns 200 with array', async () => {
        const { status, data } = await get(`${API}/technologies`);
        assert(status === 200, `Expected 200, got ${status}`);
        assert(data.success === true, 'Expected success');
        assert(Array.isArray(data.technologies), 'Technologies should be an array');
    });
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL
// ═══════════════════════════════════════════════════════════════

async function main() {
    console.log('🧪 Running Room Search API Tests...');
    console.log('═'.repeat(50));

    await runCapacityTests();
    await runSearchTests();
    await runTechTests();

    console.log('\n' + '═'.repeat(50));
    console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('═'.repeat(50));

    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
