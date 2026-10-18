const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { getCallSummary } = require('../lib/ai');

// POST /api/calls
router.post('/', async (req, res, next) => {
  try {
    const { prospect_name, prospect_company } = req.body || {};

    const { data, error } = await supabase
      .from('calls')
      .insert([
        {
          prospect_name: prospect_name ? String(prospect_name).trim() : null,
          prospect_company: prospect_company ? String(prospect_company).trim() : null,
          status: 'in_progress',
          current_stage: 1
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/calls
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('calls')
      .select(`
        *,
        stage_results (
          id,
          stage_number,
          outcome,
          created_at
        )
      `)
      .order('started_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    let { data, error } = await query;

    if (error) {
      // Fallback query in case relationship is not recognized
      let fallbackQuery = supabase
        .from('calls')
        .select('*')
        .order('started_at', { ascending: false });

      if (status) {
        fallbackQuery = fallbackQuery.eq('status', status);
      }

      const fallbackResult = await fallbackQuery;
      if (fallbackResult.error) {
        return res.status(500).json({ error: fallbackResult.error.message });
      }

      data = fallbackResult.data || [];
    }

    const formattedCalls = (data || []).map((call) => {
      const stageResults = call.stage_results || [];
      const completedCount = stageResults.length;
      return {
        ...call,
        completed_stages_count: completedCount,
        completed_stages: completedCount
      };
    });

    return res.json(formattedCalls);
  } catch (err) {
    next(err);
  }
});

// GET /api/calls/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();

    if (callError) {
      if (callError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Call not found' });
      }
      return res.status(500).json({ error: callError.message });
    }

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const { data: stageResults, error: stagesError } = await supabase
      .from('stage_results')
      .select('*')
      .eq('call_id', id)
      .order('stage_number', { ascending: true });

    if (stagesError) {
      return res.status(500).json({ error: stagesError.message });
    }

    return res.json({
      ...call,
      stage_results: stageResults || []
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/calls/:id/close
router.patch('/:id/close', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { final_outcome, status } = req.body || {};

    const updatePayload = {
      ended_at: new Date().toISOString(),
      status: status || 'completed'
    };

    if (final_outcome !== undefined) {
      updatePayload.final_outcome = final_outcome;
    }

    const { data: updatedCall, error: updateError } = await supabase
      .from('calls')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Call not found' });
      }
      return res.status(500).json({ error: updateError.message });
    }

    if (!updatedCall) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Fetch all stage results for this call
    const { data: stageResults, error: stagesError } = await supabase
      .from('stage_results')
      .select('*')
      .eq('call_id', id)
      .order('stage_number', { ascending: true });

    let finalCall = updatedCall;

    if (!stagesError && stageResults) {
      try {
        const summary = await getCallSummary(stageResults);

        if (summary) {
          const { data: callWithSummary, error: summaryError } = await supabase
            .from('calls')
            .update({ call_summary: summary })
            .eq('id', id)
            .select()
            .single();

          if (!summaryError && callWithSummary) {
            finalCall = callWithSummary;
          } else {
            finalCall = { ...finalCall, call_summary: summary };
          }
        }
      } catch (summaryErr) {
        console.error('Error generating or saving call summary during close:', summaryErr);
      }
    }

    return res.json({
      ...finalCall,
      stage_results: stageResults || []
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
