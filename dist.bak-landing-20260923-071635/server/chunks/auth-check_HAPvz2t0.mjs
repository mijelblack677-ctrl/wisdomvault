import "./connection_BinlbIW5.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
//#region src/lib/auth-check.ts
/**
* Extract and validate the authenticated user from a request.
* Checks Bearer token first, falls back to ?userId query param for backwards compatibility.
* Returns the user if valid, null otherwise.
*/
async function getAuthenticatedUser(request) {
	return getAuthUser(request);
}
/**
* Require a valid Bearer token AND that the authenticated user matches the
* claimed userId. Use this on every endpoint that trusts a client-supplied
* userId (query param or body) so a caller can only ever act as themselves.
*/
async function isAuthorizedUser(request, claimedUserId) {
	const user = await getAuthenticatedUser(request);
	if (!user) return false;
	return user.id === claimedUserId;
}
//#endregion
export { isAuthorizedUser as t };
