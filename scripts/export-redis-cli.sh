#!/bin/bash
# Redis Data Export using Upstash REST API
# READ-ONLY export of all keys and values

set -e

# Load environment variables
if [ -f .env.local ]; then
  source .env.local
else
  echo "❌ ERROR: .env.local not found"
  exit 1
fi

# Check environment variables
if [ -z "$KV_REST_API_URL" ] || [ -z "$KV_REST_API_TOKEN" ]; then
  echo "❌ ERROR: Missing KV_REST_API_URL or KV_REST_API_TOKEN"
  exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  Redis Data Export - READ-ONLY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📦 Exporting all Redis keys using Upstash REST API..."
echo ""

# Export all keys
TIMESTAMP=$(date +%Y-%m-%d)
EXPORT_FILE="redis-export-${TIMESTAMP}.json"

# Get all keys using SCAN command via REST API
echo "🔍 Scanning Redis keys..."
KEYS_JSON=$(curl -s "${KV_REST_API_URL}/keys/*" \
  -H "Authorization: Bearer ${KV_REST_API_TOKEN}")

# Extract keys from result array
KEYS=$(echo "$KEYS_JSON" | jq -r '.result[]?' 2>/dev/null || echo "")

if [ -z "$KEYS" ]; then
  echo "⚠️  No keys found or error connecting to Redis"
  echo "Response: $KEYS_JSON"
  exit 1
fi

# Count keys
KEY_COUNT=$(echo "$KEYS" | wc -l | tr -d ' ')
echo "✅ Found ${KEY_COUNT} keys"
echo ""
echo "📦 Fetching values for each key..."
echo ""

# Start JSON array
echo "[" > "${EXPORT_FILE}"

# Process each key
FIRST=true
while IFS= read -r key; do
  # Skip empty lines
  [ -z "$key" ] && continue

  # Get value for this key via REST API
  VALUE_JSON=$(curl -s "${KV_REST_API_URL}/get/${key}" \
    -H "Authorization: Bearer ${KV_REST_API_TOKEN}")

  VALUE=$(echo "$VALUE_JSON" | jq -r '.result // "null"')

  # Add comma for all but first entry
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo "," >> "${EXPORT_FILE}"
  fi

  # Write JSON object (escape key for JSON)
  KEY_ESCAPED=$(echo "$key" | jq -R .)
  echo -n "  {\"key\": ${KEY_ESCAPED}, \"value\": ${VALUE}}" >> "${EXPORT_FILE}"

  echo "  ✓ $key = $VALUE"
done <<< "$KEYS"

# Close JSON array
echo "" >> "${EXPORT_FILE}"
echo "]" >> "${EXPORT_FILE}"

echo ""
echo "✅ Export complete!"
echo ""
echo "📄 File created: ${EXPORT_FILE}"
echo "📊 Total keys exported: ${KEY_COUNT}"
echo ""
echo "🎉 No data was modified (read-only export)"
