const express = require('express');
const router = express.Router();
const { getStageSuggestion, getCallSummary } = require('../lib/ai');

// POST /api/ai/suggest
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

    const suggestion = await getStageSuggestion({
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

// POST /api/ai/summarize
router.post('/summarize', async (req, res, next) => {
  try {
    const { stages } = req.body || {};
    const stagesList = Array.isArray(stages)
      ? stages
      : Array.isArray(req.body)
      ? req.body
      : [];

    const summary = await getCallSummary(stagesList);

    return res.json({ summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
