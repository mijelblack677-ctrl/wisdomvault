import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
//#region src/pages/api/payment-config.ts
var payment_config_exports = /* @__PURE__ */ __exportAll({
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
			config: {
				registration_fee_mwk: config.registration_fee_mwk || "13000",
				registration_fee_usd: config.registration_fee_usd || "8",
				agent_code_1: config.agent_code_1 || "*405*123456#",
				agent_code_2: config.agent_code_2 || "*405*789012#",
				agent_name_1: config.agent_name_1 || "Agent 1",
				agent_name_2: config.agent_name_2 || "Agent 2",
				whatsapp_number: config.whatsapp_number || "+265888000000"
			}
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Payment config error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message,
			config: {
				registration_fee_mwk: "13000",
				registration_fee_usd: "8",
				agent_code_1: "*405*123456#",
				agent_code_2: "*405*789012#",
				agent_name_1: "Agent 1",
				agent_name_2: "Agent 2",
				whatsapp_number: "+265888000000"
			}
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/payment-config@_@ts
var page = () => payment_config_exports;
//#endregion
export { page };
