import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/billing/config.ts
var config_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
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
		const config = {};
		for (const c of configs) config[c.config_key] = c.config_value;
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
//#endregion
//#region \0virtual:astro:page:src/pages/api/billing/config@_@ts
var page = () => config_exports;
//#endregion
export { page };
