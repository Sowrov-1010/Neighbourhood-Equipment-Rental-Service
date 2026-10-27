import { describe, it, expect } from '../test-utils';
import { isConsumableItem, CONSUMABLE_TERMS } from '../../src/logic/rentalRules';

/**
 * Test Suite: Asset Validation & Non-Consumable Policy (FR-01)
 * Technique: Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
 */
describe('FR-01: Equipment Listing Non-Consumable Validation', () => {
  // Positive Tests: Valid reusable equipment
  it('TC-TOOL-01: Accepts reusable heavy-duty power tools (EP: Valid)', () => {
    const result = isConsumableItem(
      'Bosch Cordless SDS Rotary Hammer Drill Kit',
      'Professional rotary hammer with masonry bits and carrying case.'
    );
    expect(result.isConsumable).toBe(false);
    expect(result.matchedTerm).toBeUndefined();
  });

  it('TC-TOOL-02: Accepts commercial cleaning equipment (EP: Valid)', () => {
    const result = isConsumableItem(
      'BE Commercial 3100 PSI Electric Pressure Washer',
      'High-power washer equipped with 25ft hose reel and soap applicator.'
    );
    expect(result.isConsumable).toBe(false);
  });

  it('TC-TOOL-03: Accepts household appliances and ladders (EP: Valid)', () => {
    const result = isConsumableItem(
      'Pro-Aluminum XT-16 Telescopic Extension Ladder',
      '16.5-foot multi-position telescopic ladder with heavy-duty stabilizing bar.'
    );
    expect(result.isConsumable).toBe(false);
  });

  // Negative Tests: Prohibited consumables
  it('TC-TOOL-04: Rejects single-use fasteners such as screws (EP: Invalid)', () => {
    // tool-assisted: Qodo; assertion verified against FR-01.2 by Abu Nasim
    const result = isConsumableItem('Box of 2.5-inch Deck Screws', 'Galvanized outdoor screws');
    expect(result.isConsumable).toBe(true);
    expect(result.matchedTerm).toBe('screw');
  });

  it('TC-TOOL-05: Rejects paints and liquid adhesives in description (EP: Invalid)', () => {
    const result = isConsumableItem(
      'Wall Restoration Kit',
      'Includes roller and a can of paint with primer.'
    );
    expect(result.isConsumable).toBe(true);
    expect(result.matchedTerm).toBe('paint');
  });

  it('TC-TOOL-06: Case-insensitivity check on prohibited fuel terms (BVA)', () => {
    const result = isConsumableItem('Portable Generator GASOLINE 5 Gallons');
    expect(result.isConsumable).toBe(true);
    expect(result.matchedTerm).toBe('gasoline');
  });

  it('TC-TOOL-07: Verifies all documented blacklist keywords trigger rejection', () => {
    for (const term of CONSUMABLE_TERMS) {
      const result = isConsumableItem(`Standard Pack of ${term}`);
      expect(result.isConsumable).toBe(true);
      expect(typeof result.matchedTerm).toBe('string');
    }
  });
});
