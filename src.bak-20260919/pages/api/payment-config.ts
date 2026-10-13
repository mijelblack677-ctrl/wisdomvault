export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../lib/db/connection';

export const GET: APIRoute = async () => {
  const sql = client;

  try {
    // First, check if the table has data
    const configs = await sql`
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
    `;

    // Build config object
    const config: Record<string, string> = {};
    for (const c of configs) {
      config[c.config_key] = c.config_value;
    }

    // Always return all fields, with defaults if missing
    return new Response(JSON.stringify({
      success: true,
      config: {
        registration_fee_mwk: config.registration_fee_mwk || '13000',
        registration_fee_usd: config.registration_fee_usd || '8',
        agent_code_1: config.agent_code_1 || '*405*123456#',
        agent_code_2: config.agent_code_2 || '*405*789012#',
        agent_name_1: config.agent_name_1 || 'Agent 1',
        agent_name_2: config.agent_name_2 || 'Agent 2',
        whatsapp_number: config.whatsapp_number || '+265888000000',
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Payment config error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message,
      config: {
        registration_fee_mwk: '13000',
        registration_fee_usd: '8',
        agent_code_1: '*405*123456#',
        agent_code_2: '*405*789012#',
        agent_name_1: 'Agent 1',
        agent_name_2: 'Agent 2',
        whatsapp_number: '+265888000000',
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
