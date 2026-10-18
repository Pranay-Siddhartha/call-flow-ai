const app = require('./index.js');

async function runTests() {
  const PORT = 3004;
  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
      try {
        await fn();
        console.log(`  PASS: ${name}`);
        passed++;
      } catch (err) {
        console.error(`  FAIL: ${name} ->`, err.message);
        failed++;
      }
    }

    try {
      // 1. Health check
      await test('GET /api/health returns 200 with ok status', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/health`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.status !== 'ok') throw new Error(`Expected status 'ok', got ${data.status}`);
        if (!data.timestamp) throw new Error('Missing timestamp');
      });

      // 2. Stage number validation
      await test('POST /api/calls/fake-id/stages rejects invalid stage numbers', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/calls/fake-id/stages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_number: 9, outcome: 'Positive' })
        });
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      });

      // 3. Stage outcome validation
      await test('POST /api/calls/fake-id/stages rejects missing outcome', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/calls/fake-id/stages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_number: 2 })
        });
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      });

      // 4. AI Suggestion fallback/response
      await test('POST /api/ai/suggest handles missing API key gracefully', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/ai/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage_number: 2,
            stage_name: 'Purpose',
            stage_purpose: 'Say why you called',
            prospect_words: 'What do you do?'
          })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = await res.json();
        if (!data.suggestion) throw new Error('Expected suggestion in response');
      });

      // 5. 404 on unknown route
      await test('GET /api/unknown returns 404', async () => {
        const res = await fetch(`http://localhost:${PORT}/api/unknown`);
        if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
      });

      console.log(`\nTest results: ${passed} passed, ${failed} failed.`);
      if (failed > 0) process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runTests();
