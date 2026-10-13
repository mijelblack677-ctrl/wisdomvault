/**
 * Fee Calculator Service
 * Implements the 6,000 chunk rule:
 * - 1,000 fee for every complete 6,000 earned (cumulative)
 */

export interface FeeResult {
  grossAmount: number;
  feeDeducted: number;
  netAmount: number;
  newBalance: number;
  chunksBefore: number;
  chunksAfter: number;
  newChunks: number;
}

export function calculateFee(
  currentBalance: number,
  grossAmount: number,
  chunkSize: number = 6000,
  feePerChunk: number = 1000
): FeeResult {
  // Calculate total cumulative earnings including this transaction
  const totalEarnings = currentBalance + grossAmount;
  
  // Calculate how many 6,000 chunks exist before and after
  const chunksBefore = Math.floor(currentBalance / chunkSize);
  const chunksAfter = Math.floor(totalEarnings / chunkSize);
  
  // Fee = number of new 6,000 chunks × 1,000
  const newChunks = chunksAfter - chunksBefore;
  const feeDeducted = newChunks * feePerChunk;
  const netAmount = grossAmount - feeDeducted;
  const newBalance = currentBalance + netAmount;
  
  return {
    grossAmount,
    feeDeducted,
    netAmount,
    newBalance,
    chunksBefore,
    chunksAfter,
    newChunks
  };
}

export function getNextChunkProgress(
  currentBalance: number,
  chunkSize: number = 6000
): { earnedInCurrentChunk: number; remainingForNextChunk: number; progress: number } {
  const earnedInCurrentChunk = currentBalance % chunkSize;
  const remainingForNextChunk = chunkSize - earnedInCurrentChunk;
  const progress = (earnedInCurrentChunk / chunkSize) * 100;
  
  return {
    earnedInCurrentChunk,
    remainingForNextChunk,
    progress: Math.min(progress, 100)
  };
}

export function formatBalance(balance: number): string {
  return balance.toLocaleString();
}
