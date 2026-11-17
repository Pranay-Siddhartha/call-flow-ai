const express = require('express');
const defaultSupabase = require('../lib/supabase');
const { sendDatabaseError } = require('../lib/httpErrors');

function createStagesRouter({ supabaseClient = defaultSupabase } = {}) {
  const router = express.Router();

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

    const stageNum = Number(stage_number);
    if (!Number.isInteger(stageNum) || stageNum < 1 || stageNum > 8) {
      return res.status(400).json({ error: 'stage_number must be an integer between 1 and 8' });
    }

    // Upsert the stage_result row
    const { data: stageResult, error: stageError } = await supabaseClient
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
      return sendDatabaseError(res, stageError);
    }

    // Update calls.current_stage to stage_number + 1 (capped at 8)
    const nextStage = Math.min(stageNum + 1, 8);
    const { error: callUpdateError } = await supabaseClient
      .from('calls')
      .update({ current_stage: nextStage })
      .eq('id', id);

    if (callUpdateError) {
      console.warn('Call current_stage update failed:', callUpdateError.code || 'unknown');
    }

    return res.status(200).json(stageResult);
  } catch (err) {
    next(err);
  }
  });

  router.get(['/calls/:id/stages', '/:id/stages'], async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseClient
      .from('stage_results')
      .select('*')
      .eq('call_id', id)
      .order('stage_number', { ascending: true });

    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.json(data || []);
  } catch (err) {
    next(err);
  }
  });

  return router;
}

module.exports = createStagesRouter;
