import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/payment-settings.ts
var payment_settings_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	PUT: () => PUT,
	prerender: () => false
});
var GET = async ({ request }) => {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({
		success: false,
		message: "Unauthorized"
	}), {
		status: 401,
		headers: { "Content-Type": "application/json" }
	});
	const token = authHeader.replace("Bearer ", "");
	const sql = client;
	try {
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const configs = await sql`
      SELECT config_key, config_value, description 
      FROM platform_config 
      WHERE config_key IN (
        'agent_code_1', 'agent_code_2', 
        'agent_name_1', 'agent_name_2', 
        'whatsapp_number', 
        'registration_fee_mwk', 'registration_fee_usd',
        'withdrawal_min_amount', 'withdrawal_fee_percent',
        'withdrawal_mode',
        'auto_content_urls', 'auto_content_enabled', 'auto_content_max',
        'auto_content_reward_min', 'auto_content_reward_max'
      )
    `;
		const config = {};
		for (const c of configs) config[c.config_key] = {
			value: c.config_value,
			description: c.description
		};
		return new Response(JSON.stringify({
			success: true,
			config
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			message: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var PUT = async ({ request }) => {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({
		success: false,
		message: "Unauthorized"
	}), {
		status: 401,
		headers: { "Content-Type": "application/json" }
	});
	const token = authHeader.replace("Bearer ", "");
	const sql = client;
	try {
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const rawBody = await request.text();
		const { settings } = JSON.parse(rawBody);
		if (!settings) return new Response(JSON.stringify({
			success: false,
			message: "Settings required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		for (const key of [
			"agent_code_1",
			"agent_code_2",
			"agent_name_1",
			"agent_name_2",
			"whatsapp_number",
			"registration_fee_mwk",
			"registration_fee_usd",
			"withdrawal_min_amount",
			"withdrawal_fee_percent",
			"withdrawal_mode",
			"auto_content_urls",
			"auto_content_enabled",
			"auto_content_max",
			"auto_content_reward_min",
			"auto_content_reward_max"
		]) if (settings[key] !== void 0) await sql`
          INSERT INTO platform_config (config_key, config_value, updated_at)
          VALUES (${key}, ${settings[key]}, NOW())
          ON CONFLICT (config_key) 
          DO UPDATE SET config_value = ${settings[key]}, updated_at = NOW()
        `;
		return new Response(JSON.stringify({
			success: true,
			message: "Settings updated successfully"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			message: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/payment-settings@_@ts
var page = () => payment_settings_exports;
//#endregion
export { page };
