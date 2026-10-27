import { describe, it, expect } from '../test-utils';
import {
  checkOverdueEligibility,
  calculateRentalCost,
  calculateEarlyReturnCompensation,
} from '../../src/logic/rentalRules';

/**
 * Test Suite: Rental Timing, Overdue Checks, & Cost Rules (FR-08)
 * Technique: Boundary Value Analysis (BVA) & Decision Tables
 */
describe('FR-08: Rental Timing & Overdue Restriction Protocol', () => {
  const baseTime = 1761500000000; // Fixed timestamp reference
  const dueTimeIso = new Date(baseTime).toISOString();

  it('TC-TIME-01: Disallows overdue action 1 millisecond BEFORE return deadline (BVA: min-1)', () => {
    const beforeDeadline = baseTime - 1;
    const res = checkOverdueEligibility(dueTimeIso, beforeDeadline);
    expect(res.allowed).toBe(false);
    expect(res.remainingMs).toBe(1);
    expect(res.reason).toContain('Action Restricted');
  });

  it('TC-TIME-02: Disallows overdue action hours ahead of deadline', () => {
    const hoursAhead = baseTime - 3600 * 1000 * 4;
    const res = checkOverdueEligibility(dueTimeIso, hoursAhead);
    expect(res.allowed).toBe(false);
    expect(res.remainingMs).toBe(3600 * 1000 * 4);
  });

  it('TC-TIME-03: Permits overdue action at EXACT deadline timestamp (BVA: boundary)', () => {
    const atDeadline = baseTime;
    const res = checkOverdueEligibility(dueTimeIso, atDeadline);
    expect(res.allowed).toBe(true);
    expect(res.remainingMs).toBe(0);
  });

  it('TC-TIME-04: Permits overdue action 1 millisecond AFTER return deadline (BVA: max+1)', () => {
    const afterDeadline = baseTime + 1;
    const res = checkOverdueEligibility(dueTimeIso, afterDeadline);
    expect(res.allowed).toBe(true);
    expect(res.remainingMs).toBe(0);
  });

  it('TC-TIME-05: Calculates rental costs accurately based on pricing model', () => {
    // Free share
    expect(calculateRentalCost(0, 'free', 5, 2)).toBe(0);

    // Hourly rate ($6/hr for 4 hours)
    expect(calculateRentalCost(6, 'hourly', 4, 1)).toBe(24);

    // Daily rate ($22/day for 3 days)
    expect(calculateRentalCost(22, 'daily', 72, 3)).toBe(66);

    // Per use ($18 flat)
    expect(calculateRentalCost(18, 'per_use', 12, 1)).toBe(18);
  });

  it('TC-TIME-06: Computes 20% early recall compensation fee accurately', () => {
    // 20% on $50 rental = $10 credit to borrower
    const res1 = calculateEarlyReturnCompensation(50, 20);
    expect(res1.compensationAmount).toBe(10);
    expect(res1.refundPercent).toBe(20);

    // 25% on $100 rental = $25
    const res2 = calculateEarlyReturnCompensation(100, 25);
    expect(res2.compensationAmount).toBe(25);
  });
});
