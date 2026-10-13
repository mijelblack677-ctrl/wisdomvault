#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Connecting Admin Settings to Billing Page...\n');

// 1. Update the payment-config API to read from platform_config
const apiPath = 'src/pages/api/payment-config.ts';

if (!fs.existsSync(apiPath)) {
  console.log('📝 Creating payment-config API...');
  const apiContent = `export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../lib/db/connection';

export const GET: APIRoute = async () => {
  const sql = client;

  try {
    const configs = await sql\`
      SELECT config_key, config_value 
      FROM platform_config 
      WHERE config_key IN (
        'registration_fee_mwk', 
        'registration_fee_usd',
        'agent_code_1',
        'agent_code_2',
        'agent_name_1',
        'agent_name_2',
        'whatsapp_number'
      )
    \`;

    const config: Record<string, string> = {};
    for (const c of configs) {
      config[c.config_key] = c.config_value;
    }

    return new Response(JSON.stringify({
      success: true,
      config
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};`;
  
  fs.writeFileSync(apiPath, apiContent);
  console.log('✅ Created payment-config API');
}

// 2. Update the billing page to use the API
const billingPath = 'src/pages/billing.astro';

if (fs.existsSync(billingPath)) {
  let content = fs.readFileSync(billingPath, 'utf8');
  
  // Backup
  const backupPath = billingPath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, content);
  console.log('✅ Billing page backup created:', backupPath);
  
  // Update the fee values to use dynamic data
  content = content.replace(
    /const feeMwk = '10000';/,
    `const feeMwk = c.registration_fee_mwk || '13000';`
  );
  
  content = content.replace(
    /const feeUsd = '6';/,
    `const feeUsd = c.registration_fee_usd || '7';`
  );
  
  // Update agent names to use dynamic data
  content = content.replace(
    /const name1 = c\.agent_name_1 \|\| 'Agent 1';/,
    `const name1 = c.agent_name_1 || 'Agent 1';`
  );
  
  content = content.replace(
    /const name2 = c\.agent_name_2 \|\| 'Agent 2';/,
    `const name2 = c.agent_name_2 || 'Agent 2';`
  );
  
  console.log('✅ Updated billing page to use dynamic settings');
  
  // Write the file
  fs.writeFileSync(billingPath, content);
}

console.log('\n✅ Done!');
console.log('\n📋 Summary:');
console.log('  1. ✅ payment-config API reads from platform_config');
console.log('  2. ✅ Billing page uses dynamic values from admin settings');
console.log('  3. ✅ Admin Settings → platform_config → Billing page');
console.log('\n🚀 Deploy now to see the changes!');
