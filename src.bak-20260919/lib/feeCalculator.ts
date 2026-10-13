// src/lib/feeCalculator.ts

/**
 * Calculate withdrawal fee based on the tiered fee structure.
 *
 * Base fee (before bracket bonus):
 *   7,000 - 19,999:  MWK 1,000
 *   20,000 - 29,999: MWK 1,025
 *   30,000+:         MWK 1,050 + MWK 25 per 10,000 bracket
 *
 * Bracket bonus added on top of the base fee:
 *   30,000 - 39,999:  +MWK 1,000
 *   40,000 - 49,999:  +MWK 1,500
 *   50,000 - 59,999:  +MWK 1,500
 *   60,000 - 69,999:  +MWK 1,500
 *   70,000 - 79,999:  +MWK 1,600
 *   80,000 - 89,999:  +MWK 1,700
 *   90,000 - 99,999:  +MWK 1,800
 *   100,000 - 119,999: +MWK 2,000
 *   120,000 - 139,999: +MWK 2,100
 *   140,000 - 169,999: +MWK 3,000
 *   170,000 - 189,999: +MWK 3,200
 *   190,000+:          +MWK 4,000
 *
 * The same schedule applies to both manual and PayChangu (auto) mode.
 */

interface BracketBonus {
  min: number;
  max: number;
  bonus: number;
}

const BRACKET_BONUSES: BracketBonus[] = [
  { min: 30000, max: 39999, bonus: 1000 },
  { min: 40000, max: 49999, bonus: 1500 },
  { min: 50000, max: 59999, bonus: 1500 },
  { min: 60000, max: 69999, bonus: 1500 },
  { min: 70000, max: 79999, bonus: 1600 },
  { min: 80000, max: 89999, bonus: 1700 },
  { min: 90000, max: 99999, bonus: 1800 },
  { min: 100000, max: 119999, bonus: 3000 },
  { min: 120000, max: 139999, bonus: 3100 },
  { min: 140000, max: 169999, bonus: 3300 },
  { min: 170000, max: 189999, bonus: 1400 },
  { min: 190000, max: Infinity, bonus: 4000 },
];

function getBracketBonus(amount: number): number {
  for (const b of BRACKET_BONUSES) {
    if (amount >= b.min && amount <= b.max) return b.bonus;
  }
  return 0;
}

export function calculateWithdrawalFee(amount: number, mode: string = 'manual'): number {
  if (amount <= 0) return 0;

  // Below the minimum withdrawal amount — no fee
  if (amount < 7000) return 0;

  // Base fee
  let baseFee: number;
  if (amount < 20000) {
    baseFee = 1000;
  } else {
    // 20,000+: start at 1,025 and add 25 for every 10,000 bracket
    const bracket = Math.floor((amount - 20000) / 10000);
    baseFee = 1000 + 25 * (bracket + 1);
  }

  // Add bracket bonus on top
  const bonus = getBracketBonus(amount);
  return baseFee + bonus;
}

/**
 * Calculate net payout after fee
 */
export function calculateNetPayout(amount: number, mode: string = 'manual'): number {
  const fee = calculateWithdrawalFee(amount, mode);
  return amount - fee;
}

/**
 * Get fee breakdown for display
 */
export function getFeeBreakdown(amount: number, mode: string = 'manual'): {
  fee: number;
  net: number;
  tier: string;
  description: string;
} {
  const baseFee = amount < 7000
    ? 0
    : amount < 20000
      ? 1000
      : (() => {
          const bracket = Math.floor((amount - 20000) / 10000);
          return 1000 + 25 * (bracket + 1);
        })();

  const bonus = getBracketBonus(amount);
  const fee = baseFee + bonus;
  const net = amount - fee;

  let tier = '';
  let description = '';

  if (amount < 7000) {
    tier = 'No Fee';
    description = 'Below minimum withdrawal (MWK 7,000)';
  } else if (amount < 20000) {
    tier = 'Tier 1';
    description = '7,000 - 19,999 MWK';
  } else {
    const bracket = Math.floor((amount - 20000) / 10000);
    const lower = 20000 + bracket * 10000;
    const upper = lower + 9999;
    tier = `Tier ${bracket + 2}`;
    description = `${lower.toLocaleString()} - ${upper.toLocaleString()} MWK`;
  }

  return {
    fee,
    net,
    tier,
    description
  };
}