const { GoogleGenerativeAI } = require('@google/generative-ai');

const STAGE_NAMES = {
  1: 'Opening',
  2: 'Purpose',
  3: 'Permission',
  4: 'Their business',
  5: 'Their need, in their words',
  6: 'Objection',
  7: 'Next step',
  8: 'Close'
};

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

/**
 * Returns a 2-3 sentence coaching tip for the current stage.
 *
 * @param {Object} params
 * @param {string} [params.stageName]
 * @param {string} [params.stagePurpose]
 * @param {number|string} [params.stageNumber]
 * @param {string} [params.prospectWords]
 * @param {Array} [params.previousStages]
 * @returns {Promise<string|null>}
 */
async function getStageSuggestion(params = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return 'AI features are not configured. Please set the GEMINI_API_KEY environment variable.';
  }

  try {
    const model = getModel();
    if (!model) {
      return 'AI features are not configured. Please set the GEMINI_API_KEY environment variable.';
    }

    const stageNumber = params.stageNumber ?? params.stage_number ?? '';
    const stageName = params.stageName || params.stage_name || (stageNumber ? STAGE_NAMES[stageNumber] : '') || 'Current Stage';
    const stagePurpose = params.stagePurpose || params.stage_purpose || '';
    const prospectWords = params.prospectWords || params.prospect_words || '';
    const previousStages = params.previousStages || params.previous_stages || [];

    let prompt = `You are an expert sales coach assisting a cold caller in real time.\n\n`;
    prompt += `Current Stage: ${stageNumber ? `Stage ${stageNumber} - ` : ''}${stageName}\n`;
    if (stagePurpose) {
      prompt += `Stage Purpose: ${stagePurpose}\n`;
    }
    prompt += `Prospect Words: ${prospectWords ? `"${prospectWords}"` : '(No prospect response recorded yet)'}\n`;

    if (Array.isArray(previousStages) && previousStages.length > 0) {
      prompt += `\nPrevious Stages Context:\n`;
      previousStages.forEach((stg) => {
        const num = stg.stage_number ?? stg.stageNumber ?? '';
        const name = stg.stage_name || stg.stageName || STAGE_NAMES[num] || `Stage ${num}`;
        const outcome = stg.outcome || 'N/A';
        const words = stg.prospect_words || stg.prospectWords || '';
        prompt += `- Stage ${num} (${name}): Outcome = ${outcome}${words ? `, Prospect words = "${words}"` : ''}\n`;
      });
    }

    prompt += `\nProvide a coaching tip for the caller on how to respond and advance the call.
Do not invent facts about the prospect. Only use information the caller provided. Keep your suggestion to 2-3 actionable sentences.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text ? text.trim() : null;
  } catch (error) {
    console.error('Error generating stage suggestion:', error);
    return null;
  }
}

/**
 * Takes an array of {stage_number, stage_name, outcome, prospect_words, caller_notes}
 * and generates a narrative summary of the call.
 *
 * @param {Array<Object>} stageResults
 * @returns {Promise<string|null>}
 */
async function getCallSummary(stageResults = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return 'AI features are not configured. Please set the GEMINI_API_KEY environment variable.';
  }

  try {
    const model = getModel();
    if (!model) {
      return 'AI features are not configured. Please set the GEMINI_API_KEY environment variable.';
    }

    if (!Array.isArray(stageResults) || stageResults.length === 0) {
      return 'No stages recorded for this call.';
    }

    const stageLines = stageResults.map((s) => {
      const num = s.stage_number ?? s.stageNumber ?? '';
      const name = s.stage_name || s.stageName || STAGE_NAMES[num] || `Stage ${num}`;
      const outcome = s.outcome || 'N/A';
      const words = s.prospect_words || s.prospectWords;
      const notes = s.caller_notes || s.callerNotes;
      let line = `- Stage ${num} (${name}): Outcome = ${outcome}`;
      if (words) line += ` | Prospect words: "${words}"`;
      if (notes) line += ` | Caller notes: "${notes}"`;
      return line;
    }).join('\n');

    const prompt = `You are an expert sales manager summarizing a completed cold call based on the recorded stage progression:

${stageLines}

Generate a concise narrative summary of the call. Highlight key prospect reactions or objections, how well the caller navigated the stages, and recommendations for follow-up or the next interaction.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text ? text.trim() : null;
  } catch (error) {
    console.error('Error generating call summary:', error);
    return null;
  }
}

module.exports = {
  getStageSuggestion,
  getCallSummary,
  STAGE_NAMES
};
