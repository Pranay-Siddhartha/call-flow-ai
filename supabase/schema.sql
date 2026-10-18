-- ============================================
-- Cold Call Copilot — Supabase Database Schema
-- DeepThought CultureTech FDE Recruitment Challenge
-- ============================================
-- Run this SQL in the Supabase SQL Editor to set up the database.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────
-- CALLS table
-- ──────────────────────────────────────────────
-- Each row represents one cold call session.
CREATE TABLE IF NOT EXISTS calls (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_name    TEXT,
  prospect_company TEXT,
  status           TEXT NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_stage    INTEGER NOT NULL DEFAULT 1
                     CHECK (current_stage BETWEEN 1 AND 8),
  final_outcome    TEXT
                     CHECK (final_outcome IS NULL OR final_outcome IN (
                       'meeting_booked',
                       'callback_scheduled',
                       'agreed_to_receive_report',
                       'referral_given',
                       'not_interested',
                       'do_not_call',
                       'wrong_person',
                       'no_answer',
                       'other'
                     )),
  call_summary     TEXT,            -- LLM-generated post-call summary
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- STAGE_RESULTS table
-- ──────────────────────────────────────────────
-- One row per stage per call. Records the stage-specific outcome,
-- prospect's exact words, caller's notes, and AI coaching suggestions.
CREATE TABLE IF NOT EXISTS stage_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id          UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  stage_number     INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 8),
  outcome          TEXT NOT NULL,   -- Stage-specific outcome (e.g. "Asked what we do", "Agreed to talk now", etc.)
  prospect_words   TEXT,            -- the prospect's exact words (especially crucial at Stage 5)
  caller_notes     TEXT,            -- caller's own notes / observations
  ai_suggestion    TEXT,            -- LLM coaching suggestion shown at this stage
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(call_id, stage_number)
);

-- ──────────────────────────────────────────────
-- Indexes for performance
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calls_status     ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_results_call_id ON stage_results(call_id);

-- ──────────────────────────────────────────────
-- Row-Level Security
-- ──────────────────────────────────────────────
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_results ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service role (Express backend)
DROP POLICY IF EXISTS "Service role full access on calls" ON calls;
CREATE POLICY "Service role full access on calls"
  ON calls FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on stage_results" ON stage_results;
CREATE POLICY "Service role full access on stage_results"
  ON stage_results FOR ALL
  USING (true)
  WITH CHECK (true);
