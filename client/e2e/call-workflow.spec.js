import { expect, test } from '@playwright/test';
import { STAGES } from '../src/data/stages.js';

async function mockApi(page, { failStageWrites = false, failAi = false } = {}) {
  const state = {
    call: null,
    stages: [],
  };

  await page.route('http://localhost:3001/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const respond = (body, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    if (path === '/api/calls' && request.method() === 'POST') {
      const body = request.postDataJSON();
      state.call = {
        id: 'e2e-call',
        prospect_name: body.prospect_name,
        prospect_company: body.prospect_company,
        status: 'in_progress',
        current_stage: 1,
        started_at: '2026-01-01T00:00:00.000Z',
      };
      return respond(state.call, 201);
    }

    if (path === '/api/calls' && request.method() === 'GET') {
      return respond(state.call ? [{ ...state.call, completed_stages_count: state.stages.length }] : []);
    }

    if (path === '/api/ai/suggest' && request.method() === 'POST') {
      if (failAi) return respond({ error: 'AI provider unavailable' }, 503);
      return respond({ suggestion: 'Ask one specific follow-up question.' });
    }

    const stagePath = path.match(/^\/api\/calls\/([^/]+)\/stages$/);
    if (stagePath && request.method() === 'GET') {
      return respond(state.stages);
    }

    if (stagePath && request.method() === 'POST') {
      if (failStageWrites) return respond({ error: 'Stage storage unavailable' }, 503);
      const payload = request.postDataJSON();
      const existing = state.stages.find((stage) => stage.stage_number === payload.stage_number);
      const saved = {
        ...(existing || {}),
        ...payload,
        call_id: 'e2e-call',
        id: existing?.id || `stage-${payload.stage_number}`,
      };
      state.stages = state.stages
        .filter((stage) => stage.stage_number !== payload.stage_number)
        .concat(saved)
        .sort((a, b) => a.stage_number - b.stage_number);
      state.call.current_stage = Math.min(payload.stage_number + 1, 8);
      return respond(saved);
    }

    const callPath = path.match(/^\/api\/calls\/([^/]+)$/);
    if (callPath && request.method() === 'GET') {
      return state.call ? respond({ ...state.call, stage_results: state.stages }) : respond({ error: 'Not found' }, 404);
    }

    const closePath = path.match(/^\/api\/calls\/([^/]+)\/close$/);
    if (closePath && request.method() === 'PATCH') {
      state.call = { ...state.call, ...request.postDataJSON(), status: 'completed' };
      return respond({ ...state.call, stage_results: state.stages });
    }

    return respond({ error: `Unexpected test request: ${request.method()} ${path}` }, 500);
  });

  return state;
}

async function startCall(page, name = 'Ada Lovelace') {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('button', { name: 'Launch Cold Call Companion' }).click();
  await page.getByLabel('Prospect Name').fill(name);
  await page.getByLabel('Prospect Company').fill('Engine Works');
  await page.getByRole('button', { name: 'Launch Call' }).click();
  await expect(page).toHaveURL(/\/call\/e2e-call$/);
}

test('completes all stages, saves exact quotes, closes, and opens call details', async ({ page }) => {
  const apiState = await mockApi(page);
  await startCall(page);

  for (const [index, stage] of STAGES.entries()) {
    await expect(page.getByRole('heading', { name: stage.name, exact: true })).toBeVisible();
    if (index === 0) {
      await page.getByRole('button', { name: 'Get AI Suggestion' }).click();
      await expect(page.getByText('Ask one specific follow-up question.')).toBeVisible();
    }
    if (index === 4) {
      await page.locator('#prospect-words').fill('“We lose two hours to unplanned changeovers.”');
    }

    await page.getByRole('button', { name: stage.oneTapOutcomes[0].label, exact: true }).click();
    const nextButton = index < STAGES.length - 1
      ? `Next: ${STAGES[index + 1].name}`
      : 'Next: Wrap-Up & End Call';
    await page.getByRole('button', { name: nextButton }).click();
  }

  await expect(page.getByRole('heading', { name: 'End This Call' })).toBeVisible();
  await page.getByRole('button', { name: /Meeting Booked/ }).click();
  await page.getByLabel(/Call Summary & Notes/).fill('Follow up next Tuesday.');
  await page.getByRole('button', { name: 'End Call & Save' }).click();

  await expect(page).toHaveURL(/\/history\/e2e-call$/);
  await expect(page.getByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();
  await expect(page.getByText('“We lose two hours to unplanned changeovers.”')).toBeVisible();
  expect(apiState.stages).toHaveLength(8);
  expect(apiState.call.final_outcome).toBe('meeting_booked');
  expect(apiState.call.status).toBe('completed');

  await page.getByRole('link', { name: 'Back to All Calls' }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText('Ada Lovelace')).toBeVisible();
});

test('keeps the call on its current stage when stage persistence fails', async ({ page }) => {
  await mockApi(page, { failStageWrites: true });
  await startCall(page, 'Grace Hopper');

  await page.getByRole('button', { name: STAGES[0].oneTapOutcomes[0].label, exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Stage storage unavailable');
  await expect(page.getByRole('heading', { name: 'Opening', exact: true })).toBeVisible();
});

test('continues with fallback coaching and supports ending before the last stage', async ({ page }) => {
  const apiState = await mockApi(page, { failAi: true });
  await startCall(page, 'Katherine Johnson');

  await page.getByRole('button', { name: 'Get AI Suggestion' }).click();
  await expect(page.getByText(/Reach the person:/)).toBeVisible();
  await page.getByRole('button', { name: 'End Call' }).click();
  await page.getByRole('button', { name: /No Answer/ }).click();
  await page.getByRole('button', { name: 'End Call & Save' }).click();

  await expect(page).toHaveURL(/\/history\/e2e-call$/);
  await expect(page.getByRole('heading', { name: 'Katherine Johnson' })).toBeVisible();
  expect(apiState.stages).toHaveLength(0);
  expect(apiState.call.status).toBe('completed');
  expect(apiState.call.final_outcome).toBe('no_answer');
});

test('keeps the call interface within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockApi(page);
  await startCall(page, 'Lin Wei');

  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  await expect(page.getByRole('button', { name: 'End Call' })).toBeVisible();
});
