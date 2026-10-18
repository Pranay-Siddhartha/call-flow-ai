const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// POST /api/calls/:id/stages
router.post(['/calls/:id/stages', '/:id/stages'], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage_number, outcome, prospect_words, caller_notes, ai_suggestion } = req.body || {};

    if (stage_number === undefined || stage_number === null) {
      return res.status(400).json({ error: 'stage_number is required' });
    }

    if (!outcome) {
      return res.status(400).json({ error: 'outcome is required' });
    }

    const stageNum = parseInt(stage_number, 10);
    if (isNaN(stageNum) || stageNum < 1 || stageNum > 8) {
      return res.status(400).json({ error: 'stage_number must be an integer between 1 and 8' });
    }

    // Upsert the stage_result row
    const { data: stageResult, error: stageError } = await supabase
      .from('stage_results')
      .upsert(
        {
          call_id: id,
          stage_number: stageNum,
          outcome,
          prospect_words: prospect_words !== undefined && prospect_words !== null ? String(prospect_words).trim() : null,
          caller_notes: caller_notes !== undefined && caller_notes !== null ? String(caller_notes).trim() : null,
          ai_suggestion: ai_suggestion !== undefined && ai_suggestion !== null ? String(ai_suggestion).trim() : null
        },
        {
          onConflict: 'call_id,stage_number'
        }
      )
      .select()
      .single();

    if (stageError) {
      return res.status(500).json({ error: stageError.message });
    }

    // Update calls.current_stage to stage_number + 1 (capped at 8)
    const nextStage = Math.min(stageNum + 1, 8);
    const { error: callUpdateError } = await supabase
      .from('calls')
      .update({ current_stage: nextStage })
      .eq('id', id);

    if (callUpdateError) {
      console.warn(`Warning: failed to update call ${id} current_stage:`, callUpdateError.message);
    }

    return res.status(200).json(stageResult);
  } catch (err) {
    next(err);
  }
});

// GET /api/calls/:id/stages
router.get(['/calls/:id/stages', '/:id/stages'], async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('stage_results')
      .select('*')
      .eq('call_id', id)
      .order('stage_number', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
