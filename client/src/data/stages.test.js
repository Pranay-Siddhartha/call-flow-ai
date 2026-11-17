import { describe, expect, it } from 'vitest';
import { getStageByNumber, STAGES } from './stages';

describe('stage configuration', () => {
  it('defines the eight stages in the required order', () => {
    expect(STAGES.map(({ number, name }) => [number, name])).toEqual([
      [1, 'Opening'],
      [2, 'Purpose'],
      [3, 'Permission'],
      [4, 'Their business'],
      [5, 'Their need, in their words'],
      [6, 'Objection'],
      [7, 'Next step'],
      [8, 'Close'],
    ]);
  });

  it('provides purpose, prospect examples, and outcomes for every stage', () => {
    for (const stage of STAGES) {
      expect(stage.purpose).toBeTruthy();
      expect(stage.prospectExamples.length).toBeGreaterThan(0);
      expect(stage.oneTapOutcomes.length).toBe(4);
    }
  });

  it('looks up stages by number and defaults invalid numbers to the opening', () => {
    expect(getStageByNumber('5').name).toBe('Their need, in their words');
    expect(getStageByNumber(99)).toBe(STAGES[0]);
    expect(getStageByNumber(0)).toBe(STAGES[0]);
  });
});
