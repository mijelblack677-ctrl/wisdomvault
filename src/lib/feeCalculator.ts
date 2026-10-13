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
 *   190,000 - 499,999:  +MWK 4,000
 *
 * Large withdrawals (MWK 500,000 and above) skip the schedule above entirely
 * and are charged a flat total fee -- see LARGE_FLAT_TIERS below.
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

interface LargeFlatTier {
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound (Infinity for the top tier). */
  max: number;
  /** Flat total fee charged across this band. */
  fee: number;
  /** Human-readable band, shown in the fee breakdown. */
  label: string;
}

/**
 * Flat total fee for large withdrawals (MWK 500,000 and up). These bands
 * replace the base-fee + bracket-bonus schedule entirely for the amounts they
 * cover.
 *
 * Bounds are half-open -- [min, max) -- and the 0.01 steps reflect MWK's two
 * decimal places, so the schedule is gapless: every amount >= 500,000 matches
 * exactly one band.
 *
 *   500,000 - 600,000: MWK 10,000
 *   600,001 - 699,999: MWK 12,500
 *   700,000 - 800,000: MWK 15,000
 *   800,001 - 899,999: MWK 17,500
 *   900,000 and up:    MWK 20,000
 */
const LARGE_FLAT_TIERS: LargeFlatTier[] = [
  { min: 500000,    max: 600000.01, fee: 10000, label: '500,000 - 600,000 MWK' },
  { min: 600000.01, max: 700000,    fee: 12500, label: '600,001 - 699,999 MWK' },
  { min: 700000,    max: 800000.01, fee: 15000, label: '700,000 - 800,000 MWK' },
  { min: 800000.01, max: 900000,    fee: 17500, label: '800,001 - 899,999 MWK' },
  { min: 900000,    max: Infinity,  fee: 20000, label: '900,000 MWK and above' },
];

function getLargeFlatTier(amount: number): LargeFlatTier | null {
  for (const t of LARGE_FLAT_TIERS) {
    if (amount >= t.min && amount < t.max) return t;
  }
  return null;
}

export function calculateWithdrawalFee(amount: number, mode: string = 'manual'): number {
  if (amount <= 0) return 0;

  // Below the minimum withdrawal amount — no fee
  if (amount < 7000) return 0;

  // Large withdrawals take a flat total fee instead of base + bracket bonus
  const largeTier = getLargeFlatTier(amount);
  if (largeTier) return largeTier.fee;

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
  // Large withdrawals use the flat schedule
  const largeTier = amount >= 7000 ? getLargeFlatTier(amount) : null;
  if (largeTier) {
    return {
      fee: largeTier.fee,
      net: amount - largeTier.fee,
      tier: 'Large withdrawal',
      description: largeTier.label
    };
  }

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