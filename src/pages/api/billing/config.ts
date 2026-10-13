export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async () => {
  const sql = client;

  try {
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
};
