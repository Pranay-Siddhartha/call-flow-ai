const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Helper to execute API requests with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (responseData && typeof responseData === 'object' && (responseData.error || responseData.message)) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return responseData;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[API] Unable to reach backend at ${url}. Ensure the server is running.`);
      throw new Error(`Unable to connect to server at ${BASE_URL}. Is the backend running?`);
    }
    throw err;
  }
}

/**
 * Create a new cold call session
 * @param {Object} data { prospect_name, prospect_company, ... }
 */
export async function createCall(data) {
  return request('/calls', {
    method: 'POST',
    body: data,
  });
}

/**
 * List calls, optionally filtered by status
 * @param {string} [status] 'in_progress' | 'completed' | 'abandoned'
 */
export async function getCalls(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/calls${query}`, {
    method: 'GET',
  });
}

/**
 * Get call details by ID
 * @param {string} id Call UUID
 */
export async function getCall(id) {
  return request(`/calls/${id}`, {
    method: 'GET',
  });
}

/**
 * Close/finalize a call
 * @param {string} id Call UUID
 * @param {Object} data { final_outcome, status, notes, ... }
 */
export async function closeCall(id, data) {
  return request(`/calls/${id}/close`, {
    method: 'PATCH',
    body: data,
  });
}

/**
 * Save result of a call stage
 * @param {string} callId Call UUID
 * @param {Object} data { stage_number, outcome, prospect_words, caller_notes, ai_suggestion }
 */
export async function saveStageResult(callId, data) {
  return request(`/calls/${callId}/stages`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Get all stage results for a call
 * @param {string} callId Call UUID
 */
export async function getStageResults(callId) {
  return request(`/calls/${callId}/stages`, {
    method: 'GET',
  });
}

/**
 * Get real-time AI suggestion for current stage & prospect words
 * @param {Object} data { stage_number, stage_name, prospect_words, caller_notes, call_id }
 */
export async function getAiSuggestion(data) {
  return request('/ai/suggest', {
    method: 'POST',
    body: data,
  });
}

/**
 * Generate post-call summary using AI
 * @param {Object} data { call_id }
 */
export async function getCallSummary(data) {
  return request('/ai/summarize', {
    method: 'POST',
    body: data,
  });
}

/**
 * Health check endpoint
 */
export async function healthCheck() {
  return request('/health', {
    method: 'GET',
  });
}

export default {
  createCall,
  getCalls,
  getCall,
  closeCall,
  saveStageResult,
  getStageResults,
  getAiSuggestion,
  getCallSummary,
  healthCheck,
};
