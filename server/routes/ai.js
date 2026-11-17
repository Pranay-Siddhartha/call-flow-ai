const express = require('express');
const defaultAiService = require('../lib/ai');

function createAiRouter({ aiService = defaultAiService } = {}) {
  const router = express.Router();

  router.post('/suggest', async (req, res, next) => {
  try {
    const {
      stage_number,
      stageNumber,
      stage_name,
      stageName,
      stage_purpose,
      stagePurpose,
      prospect_words,
      prospectWords,
      previous_stages,
      previousStages
    } = req.body || {};

    const suggestion = await aiService.getStageSuggestion({
      stageNumber: stage_number ?? stageNumber,
      stageName: stage_name || stageName,
      stagePurpose: stage_purpose || stagePurpose,
      prospectWords: prospect_words || prospectWords,
      previousStages: previous_stages || previousStages || []
    });

    return res.json({ suggestion });
  } catch (err) {
    next(err);
  }
  });

  router.post('/summarize', async (req, res, next) => {
  try {
    const { stages } = req.body || {};
    const stagesList = Array.isArray(stages)
      ? stages
      : Array.isArray(req.body)
      ? req.body
      : [];

    const summary = await aiService.getCallSummary(stagesList);

    return res.json({ summary });
  } catch (err) {
    next(err);
  }
  });

  return router;
}

module.exports = createAiRouter;
