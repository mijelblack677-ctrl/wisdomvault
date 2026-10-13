// Try both possible paths
let client;
try {
  // Try the TypeScript file (if using ts-node or compiled)
  const { client: c } = require('./src/lib/db/connection.ts');
  client = c;
} catch (e1) {
  try {
    // Try the compiled JavaScript
    const { client: c } = require('./src/lib/db/connection.js');
    client = c;
  } catch (e2) {
    // Try the index
    const { client: c } = require('./src/lib/db');
    client = c;
  }
}

if (!client) {
  console.error('❌ Could not find database connection');
  process.exit(1);
}

async function fixReferrals() {
  const sql = client;
  
  console.log('🔧 Fixing existing referrals...');
  
  try {
    // 1. Find referrals where user is not verified but bonus was paid
    const badReferrals = await sql`
      SELECT 
        r.id,
        r.referrer_id,
        r.referred_id,
        r.bonus_amount,
        r.fee_deducted,
        r.net_amount,
        u.payment_status,
        u.full_name as referred_name
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.is_paid = true 
        AND u.payment_status != 'verified'
        AND r.referral_type = 'first_level'
    `;
    
    console.log(`📊 Found ${badReferrals.length} incorrect referrals`);
    
    if (badReferrals.length === 0) {
      console.log('✅ No incorrect referrals found! All good.');
      return;
    }
    
    for (const ref of badReferrals) {
      console.log(`\n🔍 Referral ${ref.id}:`);
      console.log(`   Referrer: ${ref.referrer_id}`);
      console.log(`   Referred: ${ref.referred_name} (${ref.payment_status})`);
      console.log(`   Amount: ${ref.bonus_amount} MWK (Fee: ${ref.fee_deducted}, Net: ${ref.net_amount})`);
      
      // Get the referrer's wallet
      const wallet = await sql`
        SELECT id, balance_available, gross_earnings, fees_paid
        FROM wallets WHERE user_id = ${ref.referrer_id}
      `;
      
      if (wallet.length > 0) {
        const currentBalance = parseFloat(wallet[0].balance_available);
        const currentGross = parseFloat(wallet[0].gross_earnings);
        const currentFees = parseFloat(wallet[0].fees_paid || 0);
        const refundAmount = parseFloat(ref.net_amount);
        const refundGross = parseFloat(ref.bonus_amount);
        const refundFee = parseFloat(ref.fee_deducted || 0);
        
        // Reverse the payment
        const newBalance = currentBalance - refundAmount;
        const newGross = currentGross - refundGross;
        const newFees = Math.max(0, currentFees - refundFee);
        
        await sql`
          UPDATE wallets 
          SET balance_available = ${newBalance},
              gross_earnings = ${newGross},
              fees_paid = ${newFees}
          WHERE id = ${wallet[0].id}
        `;
        
        // Mark referral as unpaid
        await sql`
          UPDATE referrals 
          SET is_paid = false,
              fee_deducted = 0,
              net_amount = bonus_amount
          WHERE id = ${ref.id}
        `;
        
        // Record reversal transaction
        await sql`
          INSERT INTO transactions (
            wallet_id, referral_id, transaction_type, amount, 
            fee_deducted, balance_before, balance_after, description
          ) VALUES (
            ${wallet[0].id}, ${ref.id}, 'referral_reversal',
            ${-refundGross}, ${-refundFee},
            ${currentBalance}, ${newBalance},
            ${'Reversal: Referral bonus reversed - user not verified'}
          )
        `;
        
        console.log(`   ✅ Reversed: MWK ${refundAmount.toLocaleString()} removed from referrer's wallet`);
      } else {
        console.log(`   ⚠️ Wallet not found for referrer ${ref.referrer_id}`);
      }
    }
    
    console.log('\n✅ Done! All incorrect referrals have been reversed.');
    
    // Show summary
    const remaining = await sql`
      SELECT COUNT(*) as count 
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.is_paid = true 
        AND u.payment_status != 'verified'
        AND r.referral_type = 'first_level'
    `;
    
    console.log(`📊 Remaining incorrect referrals: ${remaining[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

fixReferrals();
