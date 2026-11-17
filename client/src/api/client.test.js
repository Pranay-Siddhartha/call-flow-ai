import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { createCall, getCalls, saveStageResult } from './client';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('constructs call endpoints, JSON payloads, and encoded query parameters', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'call-1' }, 201))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'call-1', stage_number: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await createCall({ prospect_name: 'Zoë' });
    await getCalls('in progress&other');
    await saveStageResult('call/1', { stage_number: 2, outcome: 'Agreed' });

    expect(fetchMock.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['http://localhost:3001/api/calls', 'POST'],
      ['http://localhost:3001/api/calls?status=in%20progress%26other', 'GET'],
      ['http://localhost:3001/api/calls/call/1/stages', 'POST'],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ prospect_name: 'Zoë' });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      stage_number: 2,
      outcome: 'Agreed',
    });
    expect(api.createCall).toBe(createCall);
  });

  it('preserves server error status and response payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ error: 'Call not found' }, 404)
    ));

    await expect(createCall({})).rejects.toMatchObject({
      message: 'Call not found',
      status: 404,
      data: { error: 'Call not found' },
    });
  });

  it('turns network failures into a useful connectivity error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(createCall({})).rejects.toThrow('Is the backend running?');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('propagates malformed JSON response errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{bad json', {
      headers: { 'content-type': 'application/json' },
    })));

    await expect(createCall({})).rejects.toBeInstanceOf(SyntaxError);
  });
});
