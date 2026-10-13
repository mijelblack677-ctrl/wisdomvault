import postgres from "postgres";
//#region src/lib/db/connection.ts
var _client = null;
function initClient() {
	if (_client) return _client;
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.error("❌ DATABASE_URL not available");
		return null;
	}
	_client = postgres(connectionString, {
		max: parseInt(process.env.DB_POOL_SIZE || "10"),
		idle_timeout: 30,
		connect_timeout: 10,
		max_lifetime: 1800,
		ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
		prepare: false
	});
	return _client;
}
var client = new Proxy(function() {}, {
	apply(_target, _thisArg, args) {
		const sql = initClient();
		if (!sql) throw new Error("Database not available");
		return sql(...args);
	},
	get(_target, prop) {
		if (prop === Symbol.toPrimitive) return void 0;
		const sql = initClient();
		if (!sql) {
			if (prop === "begin") return async (cb) => cb({ query: async () => [] });
			if (prop === "query") return async () => ({ rows: [] });
			if (prop === "end") return async () => {};
			return;
		}
		const val = sql[prop];
		if (typeof val === "function") return val.bind(sql);
		return val;
	}
});
async function closeDatabase() {
	if (_client && typeof _client.end === "function") await _client.end();
}
process.on("SIGTERM", async () => {
	await closeDatabase();
	process.exit(0);
});
process.on("SIGINT", async () => {
	await closeDatabase();
	process.exit(0);
});
//#endregion
export { client as t };
