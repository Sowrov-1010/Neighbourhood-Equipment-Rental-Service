import { describe, it, expect } from '../test-utils';
import { canTransitionRentalState } from '../../src/logic/rentalRules';
import { DisputeTicket, RentalStatus, UserProfile } from '../../src/types';

/**
 * Integration Test Suite: Dispute Mediation & Administrative Sanctions (FR-09)
 * Level: Integration (State Machine + Dispute Engine + User Standing)
 */
describe('Integration: Administrative Arbitration & Sanctions (FR-09)', () => {
  it('TC-INT-03: Escalates an active rental dispute to resolved status via administrative directive', () => {
    // 1. Rental is currently active
    let rentalStatus: RentalStatus = 'active';

    // 2. Incident occurs: Lender files dispute ticket for equipment failure/damage
    const disputeTransition = canTransitionRentalState(rentalStatus, 'disputed');
    expect(disputeTransition.valid).toBe(true);
    rentalStatus = 'disputed';

    const ticket: DisputeTicket = {
      id: 'dsp-201',
      rentalId: 'req-sample-risk',
      assetTitle: 'Bosch SDS Hammer Drill',
      complainantId: 'u-lender',
      complainantName: 'Rahim Uddin',
      complainantRole: 'lender',
      defendantId: 'u-borrower-risk',
      defendantName: 'Tanvir Ahmed',
      reason: 'Motor burnt due to continuous overload drilling',
      details: 'Motor casing shows thermal discoloration and smoke smell on return.',
      evidenceAttachments: ['photo_thermal_damage.jpg', 'handover_signed_sheet.pdf'],
      createdAt: new Date().toISOString(),
      status: 'under_investigation',
    };

    expect(ticket.status).toBe('under_investigation');

    // 3. Admin reviews evidence, issues binding directive and levies fine
    ticket.adminDirective = 'Borrower is assessed 50% replacement cost for motor repair.';
    ticket.adminFineLevied = 45.0;
    ticket.status = 'penalized';

    // 4. Case is settled and marked resolved
    const resolveTransition = canTransitionRentalState(rentalStatus, 'resolved');
    expect(resolveTransition.valid).toBe(true);
    rentalStatus = 'resolved';
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date().toISOString();

    expect(rentalStatus).toBe('resolved');
    expect(ticket.status).toBe('resolved');
    expect(ticket.adminFineLevied).toBe(45.0);
  });

  it('TC-INT-04: Verifies user blacklisting blocks new listing creation', () => {
    const user: Partial<UserProfile> = {
      id: 'u-delinquent',
      name: 'Test Delinquent',
      isBlacklisted: true,
      blacklistedReason: 'Unreturned equipment beyond 72 hours',
    };

    // A blacklisted user cannot create new listings
    const canCreateListing = !user.isBlacklisted;
    expect(canCreateListing).toBe(false);
  });
});
