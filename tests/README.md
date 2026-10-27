# Automated Test Suite & Quality Assurance Guide
**Project:** Neighborhood Equipment Rental Service  
**Framework:** Native Node Test Engine (`node:test`, `node:assert/strict`) via TSX ESM Loader  
**Standard:** ISO/IEC/IEEE 29119-3 & ISO/IEC 25010 Quality Model  

---

## 1. Quick Start (Single-Command Execution)

Run all unit and integration tests from the repository root:

```bash
npm test
```

Generate the code coverage report:

```bash
npm run test:coverage
```

Verify TypeScript static type-checking:

```bash
npm run lint
```

---

## 2. Available Test Scripts

| Command | Description | Test Level | Scope |
| :--- | :--- | :--- | :--- |
| `npm test` | Executes the complete automated test suite (all 42 test cases). | Unit + Integration | All test files |
| `npm run test:unit` | Executes isolated business logic, policy, and validation unit tests. | Unit | `tests/unit/*.test.ts` |
| `npm run test:integration` | Executes multi-stage rental workflows and administrative arbitration. | Integration | `tests/integration/*.test.ts` |
| `npm run test:coverage` | Computes line, branch, and function code coverage metrics. | Full Suite | `src/logic/rentalRules.ts` |
| `npm run lint` | Runs the TypeScript compiler without emitting files (`tsc --noEmit`). | Static Analysis | Whole project |

---

## 3. Test Suite Directory Layout

```text
tests/
├── README.md                          # Test suite execution guide (this file)
├── test-utils.ts                      # Zero-overhead assertion helpers built on node:test
│
├── unit/                              # Fast, isolated unit test specifications (38 tests)
│   ├── assetValidation.test.ts        # FR-01: Non-consumable asset screening & keyword rejection (EP, BVA)
│   ├── fsmStateTransitions.test.ts     # FR-07: Rental FSM lifecycle transitions & illegal jump blocking
│   ├── addressObfuscation.test.ts     # FR-05: Handover location privacy & radial Haversine distance math
│   ├── securityCodeAuth.test.ts       # FR-02: Administrative Staff Gateway master security code (2580)
│   ├── rentalTiming.test.ts           # FR-08: 24h response TTL, deadline timestamps, early recall credit
│   └── riskScoring.test.ts            # FR-03: Resident delinquency threshold (Planted bug verification)
│
└── integration/                       # Multi-stage workflow & arbitration tests (4 tests)
    ├── rentalLifecycle.test.ts        # FR-07, FR-10: Booking request ➔ approval ➔ bKash ➔ handover ➔ return
    └── adminArbitration.test.ts       # FR-09: Dispute ticket escalation ➔ directive ➔ fine ➔ blacklist
```

---

## 4. Requirements Traceability Matrix (RTM) Quick Reference

Every test case directly verifies acceptance criteria from the System Requirements Specification (SRS):

- **`FR-01` (Non-Consumable Policy):** `tests/unit/assetValidation.test.ts` (`TC-TOOL-01` to `TC-TOOL-07`)
- **`FR-02` (Staff Gateway Security Code `2580`):** `tests/unit/securityCodeAuth.test.ts` (`TC-AUTH-01` to `TC-AUTH-05`)
- **`FR-03` (Resident Risk Scoring & Red Badge):** `tests/unit/riskScoring.test.ts` (`TC-RISK-01` to `TC-RISK-05`)
- **`FR-05` (Obfuscated Address Privacy):** `tests/unit/addressObfuscation.test.ts` (`TC-PRIV-01` to `TC-PRIV-04`)
- **`FR-07` (Rental FSM State Machine):** `tests/unit/fsmStateTransitions.test.ts` (`TC-FSM-01` to `TC-FSM-11`)
- **`FR-08` (24-Hour Request TTL & Overdue Rules):** `tests/unit/rentalTiming.test.ts` (`TC-TIME-01` to `TC-TIME-06`)
- **`FR-09` (Dispute Mediation & Fine Enforcement):** `tests/integration/adminArbitration.test.ts` (`TC-INT-03`, `TC-INT-04`)
- **`FR-10` (Mobile Banking Verification):** `tests/integration/rentalLifecycle.test.ts` (`TC-INT-01`)

---

## 5. Continuous Integration (GitHub Actions)

Tests are automatically executed on every `push` and `pull_request` to `main` and `develop` branches using GitHub Actions:

- **Workflow File:** `.github/workflows/test.yml`
- **Environment:** `ubuntu-latest`, Node.js 20.x
- **Quality Gates:**
  1. `npm run lint` (Must pass with 0 TypeScript compilation errors)
  2. `npm test` (Must pass 100% of the 42 test cases)
  3. `npm run test:coverage` (Generates coverage reports and stores them as build artifacts)
- **Branch Protection:** Status checks are required to be green before pull requests can be merged.

---

## 6. Instructor Verification Protocol Guide (CSE0613316 Lab)

If evaluating this repository according to **Guideline §9 (Instructor Verification Protocol)**:

### Check 1: Clean Checkout & Repeatability
Clone into a fresh directory and run:
```bash
git clone https://github.com/jahidhassan1010/Neighbourhood-Equipment-Rental-Service.git
cd Neighbourhood-Equipment-Rental-Service
npm ci
npm test
```
*Expected Result:* All 42 tests pass deterministically in ~1.1 seconds without any manual intervention.

### Check 2: Planted Bug Test (Verification of Test Effectiveness)
Open [`src/logic/rentalRules.ts`](../src/logic/rentalRules.ts#L86) and deliberately introduce a bug in the risk calculation function:
```typescript
// Change line 86 from:
return user.rating < 3.0 || lateFlags > 2 || user.overdueInstances >= 3;
// To:
return user.rating < 3.0 || lateFlags > 2 || user.overdueInstances > 3; // (Changed >= 3 to > 3)
```
Re-run the test suite:
```bash
npm test
```
*Expected Result:* `TC-RISK-03: Boundary check for overdue instances: flagged at EXACTLY 3 instances (BVA: >= 3)` immediately **FAILS**, proving the test suite actively catches boundary logic regressions. Revert the line to restore green status.

### Check 3: Code Coverage Audit
Run:
```bash
npm run test:coverage
```
*Expected Result:* Confirms **94.82% Line Coverage** and **84.38% Branch Coverage** on [`src/logic/rentalRules.ts`](../src/logic/rentalRules.ts), surpassing the Professional Tier exit criteria.
