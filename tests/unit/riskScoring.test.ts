import { describe, it, expect } from '../test-utils';
import { isHighRiskBorrower } from '../../src/logic/rentalRules';

/**
 * Test Suite: Resident Reputation & Risk Tiering (FR-03)
 * Technique: Boundary Value Analysis (BVA) & Equivalence Partitioning
 * Focus: Catches the planted bug check in Guideline §9, step 5 (e.g. >= 3 vs > 3)
 */
describe('FR-03: Resident Risk Scoring & Red Badge Tiering', () => {
  it('TC-RISK-01: Identifies high risk when rating is below 3.0 (BVA: 2.99)', () => {
    const user = { rating: 2.99, overdueInstances: 0, flags: { lateReturn: 0 } };
    expect(isHighRiskBorrower(user)).toBe(true);
  });

  it('TC-RISK-02: Normal standing at boundary rating 3.0 with clean record (BVA: 3.0)', () => {
    const user = { rating: 3.0, overdueInstances: 0, flags: { lateReturn: 0 } };
    expect(isHighRiskBorrower(user)).toBe(false);
  });

  it('TC-RISK-03: Boundary check for overdue instances: flagged at EXACTLY 3 instances (BVA: >= 3)', () => {
    // This test directly verifies that >= 3 is enforced.
    // If a developer or instructor changes >= 3 to > 3, this test fails!
    const user = { rating: 4.8, overdueInstances: 3, flags: { lateReturn: 0 } };
    expect(isHighRiskBorrower(user)).toBe(true);
  });

  it('TC-RISK-04: Normal standing with 2 overdue instances (BVA: 2 < 3)', () => {
    const user = { rating: 4.8, overdueInstances: 2, flags: { lateReturn: 0 } };
    expect(isHighRiskBorrower(user)).toBe(false);
  });

  it('TC-RISK-05: High risk triggered when lateReturn flags strictly exceed 2 (BVA: > 2)', () => {
    const user2Flags = { rating: 4.5, overdueInstances: 0, flags: { lateReturn: 2 } };
    expect(isHighRiskBorrower(user2Flags)).toBe(false);

    const user3Flags = { rating: 4.5, overdueInstances: 0, flags: { lateReturn: 3 } };
    expect(isHighRiskBorrower(user3Flags)).toBe(true);
  });
});
