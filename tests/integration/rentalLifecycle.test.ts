import { describe, it, expect } from '../test-utils';
import { canTransitionRentalState, calculateRentalCost } from '../../src/logic/rentalRules';
import { RentalRequest, RentalStatus } from '../../src/types';

/**
 * Integration Test Suite: Full End-to-End Rental Request Lifecycle (FR-07, FR-10)
 * Level: Integration (Component/State Orchestration)
 * Derivation: Use Case Scenario Testing
 */
describe('Integration: Multi-Stage Rental Workflow (FR-07, FR-10)', () => {
  it('TC-INT-01: Orchestrates complete happy-path lifecycle from request to return', () => {
    // 1. Initial State: Borrower creates a booking request for 2 days at $22/day
    const totalCost = calculateRentalCost(22, 'daily', 48, 2);
    expect(totalCost).toBe(44.0);

    const rental: Partial<RentalRequest> = {
      id: 'req-int-101',
      assetId: 'ast-1',
      assetTitle: 'BE Commercial 3100 PSI Electric Pressure Washer',
      lenderId: 'u-lender',
      borrowerId: 'u-borrower-good',
      status: 'requested',
      totalCost,
      pricingType: 'daily',
      paymentMethodChosen: 'bkash',
    };

    expect(rental.status).toBe('requested');

    // 2. Lender approves booking
    const approveTransition = canTransitionRentalState(rental.status as RentalStatus, 'approved');
    expect(approveTransition.valid).toBe(true);
    rental.status = 'approved';

    // 3. Borrower pays via bKash with transaction ID
    rental.mobileBankingTxnId = 'BKS-7749210';
    const payTransition = canTransitionRentalState(rental.status as RentalStatus, 'payment_sent');
    expect(payTransition.valid).toBe(true);
    rental.status = 'payment_sent';

    // 4. Lender confirms payment receipt
    const confirmTransition = canTransitionRentalState(
      rental.status as RentalStatus,
      'payment_confirmed'
    );
    expect(confirmTransition.valid).toBe(true);
    rental.status = 'payment_confirmed';

    // 5. In-person pickup: Handover checklist signed by both parties
    rental.handoverChecklistSigned = true;
    rental.handoverTime = new Date().toISOString();
    const handoverTransition = canTransitionRentalState(
      rental.status as RentalStatus,
      'active'
    );
    expect(handoverTransition.valid).toBe(true);
    rental.status = 'active';

    // 6. Return verification: Equipment returned on time in pristine condition
    rental.returnedTime = new Date().toISOString();
    const returnTransition = canTransitionRentalState(rental.status as RentalStatus, 'returned');
    expect(returnTransition.valid).toBe(true);
    rental.status = 'returned';

    // Final Assertion: Successful transaction closure
    expect(rental.status).toBe('returned');
    expect(rental.handoverChecklistSigned).toBe(true);
    expect(rental.mobileBankingTxnId).toBe('BKS-7749210');
  });

  it('TC-INT-02: Enforces that unapproved rentals cannot have handover signed directly', () => {
    const unapprovedRental: Partial<RentalRequest> = {
      id: 'req-int-102',
      status: 'requested',
    };

    // Attempting direct jump to active fails
    const invalidJump = canTransitionRentalState(
      unapprovedRental.status as RentalStatus,
      'active'
    );
    expect(invalidJump.valid).toBe(false);
  });
});
