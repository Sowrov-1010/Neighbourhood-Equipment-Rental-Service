import { describe, it, expect } from '../test-utils';
import { verifyAdminSecurityCode } from '../../src/logic/rentalRules';

/**
 * Test Suite: Administrative Staff Gateway Security (FR-02)
 * Technique: Equivalence Partitioning & Boundary Value Analysis
 */
describe('FR-02: Master Admin Security Code Authentication', () => {
  it('TC-AUTH-01: Grants administrative clearance for correct master code (EP: Valid)', () => {
    expect(verifyAdminSecurityCode('2580')).toBe(true);
  });

  it('TC-AUTH-02: Accepts code with leading or trailing whitespace via trimming', () => {
    expect(verifyAdminSecurityCode('  2580  ')).toBe(true);
  });

  it('TC-AUTH-03: Rejects incorrect 4-digit numeric code (EP: Invalid)', () => {
    expect(verifyAdminSecurityCode('2581')).toBe(false);
    expect(verifyAdminSecurityCode('0000')).toBe(false);
    expect(verifyAdminSecurityCode('1234')).toBe(false);
  });

  it('TC-AUTH-04: Rejects empty or null security code inputs (BVA: Empty)', () => {
    expect(verifyAdminSecurityCode('')).toBe(false);
    expect(verifyAdminSecurityCode('   ')).toBe(false);
  });

  it('TC-AUTH-05: Verifies code against custom master code override when provided', () => {
    // tool-assisted: Qodo; assertion verified against FR-02 security spec by Abu Nasim
    expect(verifyAdminSecurityCode('9876', '9876')).toBe(true);
    expect(verifyAdminSecurityCode('2580', '9876')).toBe(false);
  });
});
