import { describe, it, expect } from '../test-utils';
import { canTransitionRentalState } from '../../src/logic/rentalRules';
import { RentalStatus } from '../../src/types';

/**
 * Test Suite: Rental Finite State Machine (FSM) Lifecycle (FR-07)
 * Technique: State Transition Testing & Decision Table
 */
describe('FR-07: Rental FSM State Machine Lifecycle', () => {
  describe('Happy Path: Standard Completion Workflow', () => {
    it('TC-FSM-01: Transitions from requested to approved upon lender confirmation', () => {
      const res = canTransitionRentalState('requested', 'approved');
      expect(res.valid).toBe(true);
    });

    it('TC-FSM-02: Transitions from approved to payment_sent when borrower issues transfer', () => {
      const res = canTransitionRentalState('approved', 'payment_sent');
      expect(res.valid).toBe(true);
    });

    it('TC-FSM-03: Transitions from payment_sent to payment_confirmed by lender', () => {
      const res = canTransitionRentalState('payment_sent', 'payment_confirmed');
      expect(res.valid).toBe(true);
    });

    it('TC-FSM-04: Transitions from payment_confirmed to active upon handover checklist signing', () => {
      const res = canTransitionRentalState('payment_confirmed', 'active');
      expect(res.valid).toBe(true);
    });

    it('TC-FSM-05: Transitions from active to returned when equipment is safely returned', () => {
      const res = canTransitionRentalState('active', 'returned');
      expect(res.valid).toBe(true);
    });
  });

  describe('Exception Path: Dispute & Overdue Branches', () => {
    it('TC-FSM-06: Active rental can transition to overdue if return deadline elapses', () => {
      const res = canTransitionRentalState('active', 'overdue');
      expect(res.valid).toBe(true);
    });

    it('TC-FSM-07: Active rental can transition to disputed if damage occurs', () => {
      const res = canTransitionRentalState('active', 'disputed');
      expect(res.valid).toBe(true);
    });

    it('TC-FSM-08: Disputed case transitions to resolved upon administrative arbitration', () => {
      const res = canTransitionRentalState('disputed', 'resolved');
      expect(res.valid).toBe(true);
    });
  });

  describe('Negative Tests: Illegal Transitions Blocked', () => {
    it('TC-FSM-09: Blocks illegal jump from requested directly to active without payment/approval', () => {
      // tool-assisted: Qodo; assertion verified against FR-07 by Abu Nasim
      const res = canTransitionRentalState('requested', 'active');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Illegal FSM transition');
    });

    it('TC-FSM-10: Blocks transition from returned back to active', () => {
      const res = canTransitionRentalState('returned', 'active');
      expect(res.valid).toBe(false);
    });

    it('TC-FSM-11: Terminal states (resolved, rejected, expired) cannot transition to approved', () => {
      const terminalStates: RentalStatus[] = ['resolved', 'rejected', 'expired', 'blacklisted'];
      for (const st of terminalStates) {
        const res = canTransitionRentalState(st, 'approved');
        expect(res.valid).toBe(false);
      }
    });
  });
});
