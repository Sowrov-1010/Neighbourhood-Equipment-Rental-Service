import { describe as nodeDescribe, it as nodeIt } from 'node:test';
import assert from 'node:assert/strict';

export const describe = nodeDescribe;
export const it = nodeIt;

export function expect<T>(actual: T) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected);
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined);
    },
    toBeGreaterThan(expected: number) {
      assert.ok(
        (actual as any) > expected,
        `Expected ${actual} to be greater than ${expected}`
      );
    },
    toBeLessThan(expected: number) {
      assert.ok(
        (actual as any) < expected,
        `Expected ${actual} to be less than ${expected}`
      );
    },
    toContain(expected: string) {
      assert.ok(
        typeof actual === 'string' && actual.includes(expected),
        `Expected "${actual}" to contain "${expected}"`
      );
    },
    not: {
      toContain(expected: string) {
        assert.ok(
          typeof actual === 'string' && !actual.includes(expected),
          `Expected "${actual}" NOT to contain "${expected}"`
        );
      },
      toBe(expected: any) {
        assert.notStrictEqual(actual, expected);
      },
    },
  };
}
