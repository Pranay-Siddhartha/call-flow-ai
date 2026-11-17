const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { beforeEach, describe, it } = require('node:test');
const request = require('supertest');
const { createApp } = require('./index');

function createSupabaseMock(seed = {}) {
  const state = {
    calls: structuredClone(seed.calls || []),
    stage_results: structuredClone(seed.stageResults || []),
    errors: seed.errors || {},
  };
  const requests = [];
  let nextId = 1;

  function createQuery(table) {
    const query = {
      table,
      operation: 'select',
      payload: null,
      filters: [],
      orderBy: null,
      selection: '*',
      insert(payload) {
        this.operation = 'insert';
        this.payload = payload;
        return this;
      },
      upsert(payload, options) {
        this.operation = 'upsert';
        this.payload = payload;
        this.options = options;
        return this;
      },
      update(payload) {
        this.operation = 'update';
        this.payload = payload;
        return this;
      },
      select(selection = '*') {
        this.selection = selection;
        return this;
      },
      eq(column, value) {
        this.filters.push([column, value]);
        return this;
      },
      order(column, options) {
        this.orderBy = [column, options];
        return this;
      },
      single() {
        return Promise.resolve(this.execute(true));
      },
      then(resolve, reject) {
        return Promise.resolve(this.execute(false)).then(resolve, reject);
      },
      execute(single) {
        requests.push({
          table,
          operation: this.operation,
          payload: this.payload,
          filters: this.filters,
        });

        const injectedError = state.errors[`${table}:${this.operation}`];
        if (injectedError) return { data: null, error: injectedError };

        const filterRows = (rows) => rows.filter((row) =>
          this.filters.every(([column, value]) => row[column] === value)
        );

        if (this.operation === 'insert' && table === 'calls') {
          const row = {
            id: `call-${nextId++}`,
            ...this.payload[0],
            started_at: '2026-01-01T00:00:00.000Z',
            created_at: '2026-01-01T00:00:00.000Z',
          };
          state.calls.push(row);
          return { data: row, error: null };
        }

        if (this.operation === 'upsert' && table === 'stage_results') {
          const existingIndex = state.stage_results.findIndex((row) =>
            row.call_id === this.payload.call_id &&
            row.stage_number === this.payload.stage_number
          );
          const row = {
            id: existingIndex === -1 ? `stage-${nextId++}` : state.stage_results[existingIndex].id,
            ...this.payload,
          };
          if (existingIndex === -1) {
            state.stage_results.push(row);
          } else {
            state.stage_results[existingIndex] = row;
          }
          return { data: row, error: null };
        }

        if (this.operation === 'update') {
          const matches = filterRows(state[table]);
          matches.forEach((row) => Object.assign(row, this.payload));
          if (single) {
            return matches.length
              ? { data: matches[0], error: null }
              : { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
          }
          return { data: matches, error: null };
        }

        let rows = filterRows(state[table] || []);
        if (this.selection.includes('stage_results')) {
          rows = rows.map((row) => ({
            ...row,
            stage_results: state.stage_results.filter((stage) => stage.call_id === row.id),
          }));
        }
        if (this.orderBy) {
          const [column, { ascending = true } = {}] = this.orderBy;
          rows = [...rows].sort((a, b) => {
            if (a[column] === b[column]) return 0;
            return (a[column] < b[column] ? -1 : 1) * (ascending ? 1 : -1);
          });
        }
        if (single) {
          return rows.length
            ? { data: rows[0], error: null }
            : { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data: rows, error: null };
      },
    };
    return query;
  }

  return {
    state,
    requests,
    from: (table) => createQuery(table),
  };
}

function createTestContext(seed = {}) {
  const supabaseClient = createSupabaseMock(seed);
  const aiCalls = [];
  const aiService = {
    getStageSuggestion: async (params) => {
      aiCalls.push({ method: 'suggest', params });
      return 'Ask a focused follow-up question.';
    },
    getCallSummary: async (stages) => {
      aiCalls.push({ method: 'summarize', stages });
      return 'The prospect shared a clear operational need.';
    },
  };
  return {
    app: createApp({ supabaseClient, aiService }),
    supabaseClient,
    aiCalls,
    aiService,
  };
}

describe('health and HTTP behavior', () => {
  it('returns a timestamped health response', async () => {
    const { app } = createTestContext();
    const response = await request(app).get('/api/health').expect(200);

    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.service, 'cold-call-copilot-api');
    assert.equal(Number.isNaN(Date.parse(response.body.timestamp)), false);
  });

  it('returns JSON 404s for unknown endpoints', async () => {
    const { app } = createTestContext();
    const response = await request(app).get('/api/unknown').expect(404);

    assert.match(response.body.error, /Not Found/);
  });

  it('returns a client error for malformed JSON', async () => {
    const { app } = createTestContext();
    const originalError = console.error;
    const loggedErrors = [];
    console.error = (...args) => loggedErrors.push(args);
    let response;
    try {
      response = await request(app)
        .post('/api/calls')
        .set('Content-Type', 'application/json')
        .send('{"prospect_name":')
        .expect(400);
    } finally {
      console.error = originalError;
    }

    assert.equal(typeof response.body.error, 'string');
    assert.equal(response.body.stack, undefined);
    assert.equal(response.body.error, 'Malformed JSON request');
    assert.equal(loggedErrors.some((args) => JSON.stringify(args).includes('prospect_name')), false);
    assert.equal(response.body.error.includes('Unexpected end'), false);
  });
});

describe('call routes', () => {
  let context;

  beforeEach(() => {
    context = createTestContext();
  });

  it('creates calls with normalized optional names and initial status', async () => {
    const response = await request(context.app)
      .post('/api/calls')
      .send({ prospect_name: '  Ada Lovelace  ', prospect_company: '  Analytical Engines  ' })
      .expect(201);

    assert.equal(response.body.prospect_name, 'Ada Lovelace');
    assert.equal(response.body.prospect_company, 'Analytical Engines');
    assert.equal(response.body.status, 'in_progress');
    assert.equal(response.body.current_stage, 1);
  });

  it('accepts omitted optional call details', async () => {
    const response = await request(context.app).post('/api/calls').send({}).expect(201);
    assert.equal(response.body.prospect_name, null);
    assert.equal(response.body.prospect_company, null);
  });

  it('returns a database write error without reporting success', async () => {
    const { app } = createTestContext({
      errors: { 'calls:insert': { message: 'private database credential detail', code: 'DB_OFFLINE' } },
    });
    const originalError = console.error;
    console.error = () => {};
    let response;
    try {
      response = await request(app).post('/api/calls').send({}).expect(500);
    } finally {
      console.error = originalError;
    }
    assert.deepEqual(response.body, { error: 'Database operation failed' });
    assert.equal(JSON.stringify(response.body).includes('credential'), false);
  });

  it('lists calls with completed-stage counts and status filtering', async () => {
    const { app } = createTestContext({
      calls: [
        { id: 'active', status: 'in_progress', started_at: '2026-02-02' },
        { id: 'done', status: 'completed', started_at: '2026-02-01' },
      ],
      stageResults: [
        { id: 'stage-1', call_id: 'active', stage_number: 1, outcome: 'Reached' },
        { id: 'stage-2', call_id: 'active', stage_number: 2, outcome: 'Explained' },
      ],
    });

    const response = await request(app).get('/api/calls?status=in_progress').expect(200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].id, 'active');
    assert.equal(response.body[0].completed_stages_count, 2);
  });

  it('returns a call with its stages and 404s for unknown calls', async () => {
    const { app } = createTestContext({
      calls: [{ id: 'call-a', prospect_name: 'Grace', status: 'completed' }],
      stageResults: [{ id: 'stage-a', call_id: 'call-a', stage_number: 3, outcome: 'Agreed' }],
    });

    const response = await request(app).get('/api/calls/call-a').expect(200);
    assert.equal(response.body.prospect_name, 'Grace');
    assert.equal(response.body.stage_results[0].stage_number, 3);
    await request(app).get('/api/calls/missing').expect(404);
  });

  it('closes a call and generates a summary from its saved stages', async () => {
    const { app, aiCalls } = createTestContext({
      calls: [{ id: 'call-a', status: 'in_progress' }],
      stageResults: [{ id: 'stage-a', call_id: 'call-a', stage_number: 1, outcome: 'Reached' }],
    });

    const response = await request(app)
      .patch('/api/calls/call-a/close')
      .send({ final_outcome: 'meeting_booked', status: 'completed' })
      .expect(200);

    assert.equal(response.body.status, 'completed');
    assert.equal(response.body.final_outcome, 'meeting_booked');
    assert.equal(response.body.call_summary, 'The prospect shared a clear operational need.');
    assert.equal(aiCalls[0].method, 'summarize');
  });
});

describe('stage routes', () => {
  it('rejects missing, non-integer, and out-of-range stage numbers before writing', async () => {
    const { app, supabaseClient } = createTestContext();
    const cases = [
      [{ outcome: 'Reached' }, /stage_number is required/],
      [{ stage_number: 9, outcome: 'Reached' }, /between 1 and 8/],
      [{ stage_number: 1.5, outcome: 'Reached' }, /between 1 and 8/],
      [{ stage_number: '2oops', outcome: 'Reached' }, /between 1 and 8/],
      [{ stage_number: 2 }, /outcome is required/],
    ];

    for (const [payload, expectedError] of cases) {
      const response = await request(app)
        .post('/api/calls/call-a/stages')
        .send(payload)
        .expect(400);
      assert.match(response.body.error, expectedError);
    }
    assert.equal(supabaseClient.requests.length, 0);
  });

  it('trims text fields and upserts one result per call and stage', async () => {
    const { app, supabaseClient } = createTestContext({
      calls: [{ id: 'call-a', current_stage: 1 }],
    });
    const endpoint = '/api/calls/call-a/stages';
    const firstResponse = await request(app)
      .post(endpoint)
      .send({
        stage_number: 5,
        outcome: 'Captured need',
        prospect_words: '  We need better planning.  ',
        caller_notes: '  Follow up  ',
        ai_suggestion: '  Ask about their workflow.  ',
      })
      .expect(200);
    const secondResponse = await request(app)
      .post(endpoint)
      .send({ stage_number: 5, outcome: 'Updated', prospect_words: '  Exact quote  ' })
      .expect(200);

    assert.equal(firstResponse.body.prospect_words, 'We need better planning.');
    assert.equal(secondResponse.body.prospect_words, 'Exact quote');
    assert.equal(supabaseClient.state.stage_results.length, 1);
    assert.equal(supabaseClient.state.stage_results[0].id, firstResponse.body.id);
    assert.equal(supabaseClient.state.calls.length, 1);
  });

  it('returns saved stages in ascending order', async () => {
    const { app } = createTestContext({
      stageResults: [
        { call_id: 'call-a', stage_number: 5, outcome: 'Need' },
        { call_id: 'call-a', stage_number: 2, outcome: 'Purpose' },
      ],
    });

    const response = await request(app).get('/api/calls/call-a/stages').expect(200);
    assert.deepEqual(response.body.map((stage) => stage.stage_number), [2, 5]);
  });
});

describe('AI routes', () => {
  it('passes stage context to the suggestion service and returns its result', async () => {
    const { app, aiCalls } = createTestContext();
    const response = await request(app)
      .post('/api/ai/suggest')
      .send({
        stage_number: 5,
        stage_name: 'Need',
        prospect_words: 'The lines are losing time.',
        previous_stages: [{ stage_number: 4, outcome: 'Shared operations' }],
      })
      .expect(200);

    assert.equal(response.body.suggestion, 'Ask a focused follow-up question.');
    assert.equal(aiCalls[0].params.stageNumber, 5);
    assert.equal(aiCalls[0].params.prospectWords, 'The lines are losing time.');
    assert.equal(aiCalls[0].params.previousStages.length, 1);
  });

  it('summarizes a list of stages using the injected service', async () => {
    const { app, aiCalls } = createTestContext();
    const stages = [{ stage_number: 1, outcome: 'Reached' }];
    const response = await request(app)
      .post('/api/ai/summarize')
      .send({ stages })
      .expect(200);

    assert.equal(response.body.summary, 'The prospect shared a clear operational need.');
    assert.deepEqual(aiCalls[0].stages, stages);
  });

  it('does not expose provider exceptions in API responses', async () => {
    const { app, aiService } = createTestContext();
    aiService.getStageSuggestion = async () => {
      throw new Error('private provider credential detail');
    };
    const originalError = console.error;
    console.error = () => {};
    let response;
    try {
      response = await request(app)
        .post('/api/ai/suggest')
        .send({ stage_number: 1 })
        .expect(500);
    } finally {
      console.error = originalError;
    }

    assert.deepEqual(response.body, { error: 'Internal Server Error' });
    assert.equal(JSON.stringify(response.body).includes('credential'), false);
  });
});

describe('request concurrency', () => {
  it('creates distinct calls for simultaneous requests', async () => {
    const { app } = createTestContext();
    const [first, second] = await Promise.all([
      request(app).post('/api/calls').send({ prospect_name: 'First' }),
      request(app).post('/api/calls').send({ prospect_name: 'Second' }),
    ]);

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.notEqual(first.body.id, second.body.id);
  });
});

describe('Supabase schema contract', () => {
  const schema = readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

  it('declares required tables, workflow constraints, and stage idempotency', () => {
    assert.match(schema, /CREATE TABLE IF NOT EXISTS calls/i);
    assert.match(schema, /status IN \('in_progress', 'completed', 'abandoned'\)/);
    assert.match(schema, /current_stage\s+INTEGER NOT NULL DEFAULT 1\s+CHECK \(current_stage BETWEEN 1 AND 8\)/);
    assert.match(schema, /final_outcome\s+TEXT\s+CHECK/);
    assert.match(schema, /CREATE TABLE IF NOT EXISTS stage_results/i);
    assert.match(schema, /REFERENCES calls\(id\) ON DELETE CASCADE/);
    assert.match(schema, /stage_number\s+INTEGER NOT NULL CHECK \(stage_number BETWEEN 1 AND 8\)/);
    assert.match(schema, /UNIQUE\(call_id, stage_number\)/);
  });

  it('documents row-level security and service-role policies', () => {
    assert.match(schema, /ALTER TABLE calls ENABLE ROW LEVEL SECURITY/i);
    assert.match(schema, /ALTER TABLE stage_results ENABLE ROW LEVEL SECURITY/i);
    assert.match(schema, /ON calls FOR ALL\s+USING \(true\)\s+WITH CHECK \(true\)/);
    assert.match(schema, /ON stage_results FOR ALL\s+USING \(true\)\s+WITH CHECK \(true\)/);
  });
});
