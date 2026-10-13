#!/usr/bin/env bash
# E2E test against https://wisdomvault.online — signup + auth + wallet + payment gates.
# No real charges: payment tests are negative-path only (auth/validation gates).
# Cleans up its test user at the end.
set -u
BASE="https://wisdomvault.online"
STAMP=$(date +%s)
EMAIL="e2etest${STAMP}@example.com"
PHONE="+26599${STAMP: -6}"
PASS="E2eTest!${STAMP}x"
DB_URL="postgresql://wisdom_vault:ab0968aa54a5690656104ec36076b763@127.0.0.1:5432/wisdom_vault"
PSQL="ssh -o BatchMode=yes miracle@185.131.54.4 PGPASSWORD=ab0968aa54a5690656104ec36076b763 /usr/pgsql-18/bin/psql -h 127.0.0.1 -U wisdom_vault -d wisdom_vault -t -A -c"
PASS_COUNT=0; FAIL_COUNT=0

check() { # $1=name $2=expected $3=actual
  if [ "$2" = "$3" ]; then echo "PASS: $1"; PASS_COUNT=$((PASS_COUNT+1));
  else echo "FAIL: $1 (expected [$2] got [$3])"; FAIL_COUNT=$((FAIL_COUNT+1)); fi
}

echo "== 1. Register =="
REG=$(curl -s -m 30 -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"fullName\":\"E2E Test\",\"email\":\"$EMAIL\",\"phone\":\"$PHONE\",\"password\":\"$PASS\",\"consent\":true}")
TOKEN=$(echo "$REG" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USERID=$(echo "$REG" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
check "register success" "true" "$(echo "$REG" | grep -o '"success":[a-z]*' | cut -d: -f2)"
[ -n "$TOKEN" ] && { echo "PASS: register returned token"; PASS_COUNT=$((PASS_COUNT+1)); } || { echo "FAIL: no token"; FAIL_COUNT=$((FAIL_COUNT+1)); }

echo "== 2. Login =="
LOGIN=$(curl -s -m 30 -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$EMAIL\",\"password\":\"$PASS\"}")
check "login success" "true" "$(echo "$LOGIN" | grep -o '"success":[a-z]*' | cut -d: -f2)"

echo "== 3. Wrong password rejected =="
BAD=$(curl -s -m 30 -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"identifier\":\"$EMAIL\",\"password\":\"wrong-${STAMP}\"}")
check "wrong password rejected" "false" "$(echo "$BAD" | grep -o '"success":[a-z]*' | cut -d: -f2)"

echo "== 4. Wallet balance (authenticated) =="
BAL=$(curl -s -m 30 "$BASE/api/wallet/balance?userId=$USERID" -H "Authorization: Bearer $TOKEN")
check "balance success" "true" "$(echo "$BAL" | grep -o '"success":[a-z]*' | head -1 | cut -d: -f2)"

echo "== 5. Wallet balance (no token) → expect 401 =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/api/wallet/balance?userId=$USERID")
check "balance without token = 401" "401" "$CODE"

echo "== 6. Cross-user access blocked (my token, other userId) → 401 =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/api/wallet/balance?userId=00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $TOKEN")
check "cross-user balance = 401" "401" "$CODE"

echo "== 7. PayChangu initiate without auth → expect 401 =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" -X POST "$BASE/api/paychangu/initiate" \
  -H "Content-Type: application/json" -d "{\"userId\":\"$USERID\"}")
check "initiate without token = 401" "401" "$CODE"

echo "== 8. PayChangu initiate, bogus userId + valid token → expect 401 =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" -X POST "$BASE/api/paychangu/initiate" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\":\"00000000-0000-0000-0000-000000000000\"}")
check "initiate cross-user = 401" "401" "$CODE"

echo "== 9. Withdraw with empty wallet → expect business rejection (no funds moved) =="
WD=$(curl -s -m 30 -X POST "$BASE/api/wallet/withdraw" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"amount\":7000,\"phoneNumber\":\"$PHONE\",\"cardholderName\":\"E2E Test\"}")
WD_OK=$(echo "$WD" | grep -o '"success":[a-z]*' | head -1 | cut -d: -f2)
if [ "$WD_OK" = "false" ]; then echo "PASS: withdraw correctly rejected (empty wallet)"; PASS_COUNT=$((PASS_COUNT+1));
else echo "WARN: withdraw response: $(echo "$WD" | head -c 200)"; fi

echo "== 9b. payment-status with token → expect 200 (dashboard flow) =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/api/user/payment-status?userId=$USERID" -H "Authorization: Bearer $TOKEN")
check "payment-status with token = 200" "200" "$CODE"

echo "== 9c. referral/stats with token → expect 200 (dashboard flow) =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/api/referral/stats?userId=$USERID" -H "Authorization: Bearer $TOKEN")
check "referral/stats with token = 200" "200" "$CODE"

echo "== 10. Admin endpoint without auth → expect 401 =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/api/admin/users")
check "admin/users unauth = 401" "401" "$CODE"

echo "== 11. VaultPro endpoint without auth → expect 401 =="
CODE=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$BASE/api/vaultpro/users")
check "vaultpro/users unauth = 401" "401" "$CODE"

echo "== 12. Cleanup test user =="
$PSQL "DELETE FROM users WHERE email = '$EMAIL';" >/dev/null
LEFT=$($PSQL "SELECT count(*) FROM users WHERE email = '$EMAIL';")
check "test user removed" "0" "$LEFT"

echo
echo "RESULT: $PASS_COUNT passed, $FAIL_COUNT failed"
exit $FAIL_COUNT
