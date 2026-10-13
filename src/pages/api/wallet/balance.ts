export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Verify user exists
    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // ✅ Get wallet with ALL fields including store_credit
    const result = await sql`
      SELECT 
        w.id,
        w.user_id,
        w.balance_available,
        w.gross_earnings,
        w.total_withdrawn,
        w.fees_paid,
        w.store_credit,
        w.gross_earnings_total,
        w.updated_at,
        u.full_name,
        u.payment_status,
        u.total_gross_earnings,
        u.total_fees_paid,
        u.total_net_earnings,
        u.fee_chunks_count
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = ${userId}
    `;

    if (result.length === 0) {
      // ✅ Create wallet with store_credit if it doesn't exist
      await sql`
        INSERT INTO wallets (
          user_id, 
          balance_available, 
          gross_earnings, 
          gross_earnings_total, 
          total_withdrawn,
          fees_paid,
          store_credit
        ) VALUES (
          ${userId}, 
          0, 
          0, 
          0,
          0,
          0,
          0
        )
      `;
      
      // Fetch the newly created wallet
      const newResult = await sql`
        SELECT 
          w.id,
          w.user_id,
          w.balance_available,
          w.gross_earnings,
          w.total_withdrawn,
          w.fees_paid,
          w.store_credit,
          w.gross_earnings_total,
          w.updated_at,
          u.full_name,
          u.payment_status,
          u.total_gross_earnings,
          u.total_fees_paid,
          u.total_net_earnings,
          u.fee_chunks_count
        FROM wallets w
        JOIN users u ON w.user_id = u.id
        WHERE w.user_id = ${userId}
      `;
      
      if (newResult.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Failed to create wallet' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const wallet = newResult[0];
      
      // ✅ Return wallet with store_credit
      return new Response(JSON.stringify({
        success: true,
        wallet: {
          id: wallet.id,
          userId: wallet.user_id,
          balanceAvailable: parseFloat(wallet.balance_available || 0),
          grossEarnings: parseFloat(wallet.gross_earnings || 0),
          totalWithdrawn: parseFloat(wallet.total_withdrawn || 0),
          feesPaid: parseFloat(wallet.fees_paid || 0),
          storeCredit: parseFloat(wallet.store_credit || 0), // ✅ ADD THIS
          grossEarningsTotal: parseFloat(wallet.gross_earnings_total || 0),
          fullName: wallet.full_name,
          paymentStatus: wallet.payment_status,
          totalGrossEarnings: parseFloat(wallet.total_gross_earnings || 0),
          totalFeesPaid: parseFloat(wallet.total_fees_paid || 0),
          totalNetEarnings: parseFloat(wallet.total_net_earnings || 0),
          feeChunksCount: parseInt(wallet.fee_chunks_count || 0)
        },
        withdrawalInfo: {
          feeDescription: 'Tiered withdrawal fee based on amount',
          exampleBreakdown: {
            withdraw7000: { amount: 7000, fee: 1000, receive: 6000 },
            withdraw20000: { amount: 20000, fee: 1025, receive: 18975 },
            withdraw30000: { amount: 30000, fee: 2050, receive: 27950 },
            withdraw50000: { amount: 50000, fee: 2600, receive: 47400 },
            withdraw100000: { amount: 100000, fee: 3225, receive: 96775 }
          }
        },
        recentTransactions: []
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    const wallet = result[0];
    
    // ✅ Get recent transactions
    const recentTransactions = await sql`
      SELECT 
        id,
        transaction_type,
        amount,
        fee_deducted,
        net_amount,
        balance_before,
        balance_after,
        description,
        created_at
      FROM transactions
      WHERE wallet_id = ${wallet.id}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // ✅ Return wallet with ALL fields including store_credit
    return new Response(JSON.stringify({
      success: true,
      wallet: {
        id: wallet.id,
        userId: wallet.user_id,
        balanceAvailable: parseFloat(wallet.balance_available || 0),
        grossEarnings: parseFloat(wallet.gross_earnings || 0),
        totalWithdrawn: parseFloat(wallet.total_withdrawn || 0),
        feesPaid: parseFloat(wallet.fees_paid || 0),
        storeCredit: parseFloat(wallet.store_credit || 0), // ✅ ADD THIS
        grossEarningsTotal: parseFloat(wallet.gross_earnings_total || 0),
        fullName: wallet.full_name,
        paymentStatus: wallet.payment_status,
        totalGrossEarnings: parseFloat(wallet.total_gross_earnings || 0),
        totalFeesPaid: parseFloat(wallet.total_fees_paid || 0),
        totalNetEarnings: parseFloat(wallet.total_net_earnings || 0),
        feeChunksCount: parseInt(wallet.fee_chunks_count || 0)
      },
      withdrawalInfo: {
        feeDescription: 'Tiered withdrawal fee based on amount',
        exampleBreakdown: {
          withdraw7000: { amount: 7000, fee: 1000, receive: 6000 },
          withdraw20000: { amount: 20000, fee: 1025, receive: 18975 },
          withdraw100000: { amount: 100000, fee: 4225, receive: 95775 }
        }
      },
      recentTransactions: recentTransactions.map((tx: any) => ({
        id: tx.id,
        type: tx.transaction_type,
        amount: parseFloat(tx.amount || 0),
        feeDeducted: parseFloat(tx.fee_deducted || 0),
        netAmount: parseFloat(tx.net_amount || 0),
        balanceBefore: parseFloat(tx.balance_before || 0),
        balanceAfter: parseFloat(tx.balance_after || 0),
        description: tx.description,
        createdAt: tx.created_at
      }))
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Balance fetch error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to fetch balance: ' + err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
