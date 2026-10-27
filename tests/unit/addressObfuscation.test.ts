import { describe, it, expect } from '../test-utils';
import { getObfuscatedAddress, calculateHaversineDistanceKm } from '../../src/logic/rentalRules';

/**
 * Test Suite: Privacy & Location Obfuscation (FR-05)
 * Technique: Equivalence Partitioning & Decision Table
 */
describe('FR-05: Resident Handover Location Privacy', () => {
  const neighborhood = 'Hamlet Tower';

  it('TC-PRIV-01: Masks exact street address when rental is unapproved or requested (EP: Unapproved)', () => {
    const address = getObfuscatedAddress(neighborhood, false);
    expect(address).toContain('Approximate Area: Within 500m of Hamlet Tower Common Plaza');
    expect(address).not.toContain('Maple Crest Ave');
    expect(address).not.toContain('428');
  });

  it('TC-PRIV-02: Reveals physical handover address when booking is approved or active (EP: Approved)', () => {
    const address = getObfuscatedAddress(neighborhood, true);
    expect(address).toBe('Exact Handover: 428 Maple Crest Ave, Hamlet Tower');
  });

  it('TC-PRIV-03: Accurately calculates radial distance using Haversine formula', () => {
    // Coords from mockData: Rahim (37.7749, -122.4194) to Nusrat (37.7765, -122.4168)
    const dist = calculateHaversineDistanceKm(37.7749, -122.4194, 37.7765, -122.4168);
    expect(dist).toBeGreaterThan(0.2);
    expect(dist).toBeLessThan(0.4);
    expect(dist).toBe(0.3); // Rounded to 1 decimal place
  });

  it('TC-PRIV-04: Returns 0.0 km for identical coordinates (BVA: Zero distance)', () => {
    const dist = calculateHaversineDistanceKm(37.7749, -122.4194, 37.7749, -122.4194);
    expect(dist).toBe(0.0);
  });
});
